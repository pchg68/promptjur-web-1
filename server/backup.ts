/**
 * Módulo de Backup Automatizado do Banco de Dados
 *
 * Estratégia: usa mysql2 nativo para exportar dados via SQL gerado em Node.js,
 * eliminando a dependência do binário `mysqldump` (não disponível em produção).
 *
 * Fluxo:
 * 1. Conecta ao banco via mysql2 usando DATABASE_URL
 * 2. Lista todas as tabelas do schema atual
 * 3. Para cada tabela: gera CREATE TABLE + INSERT INTO em SQL puro
 * 4. Criptografa o SQL resultante com AES-256-GCM
 * 5. Faz upload para S3 e registra na tabela `backups`
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import mysql from "mysql2/promise";
import { storagePut } from "./storage";
import { getDb } from "./db";
import { eq, desc } from "drizzle-orm";
import { mysqlTable, int, varchar, timestamp, bigint } from "drizzle-orm/mysql-core";

// ─── Tabela de controle de backups ────────────────────────────────────────────

export const backups = mysqlTable("backups", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  s3Key: varchar("s3_key", { length: 512 }).notNull(),
  s3Url: varchar("s3_url", { length: 1024 }).notNull(),
  size: bigint("size", { mode: "number" }).notNull(),
  isEncrypted: int("is_encrypted").notNull().default(1),
  createdBy: int("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Backup = typeof backups.$inferSelect;

interface BackupResult {
  success: boolean;
  filename?: string;
  s3Url?: string;
  size?: number;
  tablesExported?: number;
  error?: string;
}

// ─── Criptografia AES-256-GCM ─────────────────────────────────────────────────

function encrypt(data: Buffer, password: string): Buffer {
  const salt = randomBytes(32);
  const key = scryptSync(password, salt, 32);
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Formato: salt (32) + iv (16) + authTag (16) + encrypted data
  return Buffer.concat([salt, iv, authTag, encrypted]);
}

function decrypt(encryptedData: Buffer, password: string): Buffer {
  const salt = encryptedData.subarray(0, 32);
  const iv = encryptedData.subarray(32, 48);
  const authTag = encryptedData.subarray(48, 64);
  const encrypted = encryptedData.subarray(64);

  const key = scryptSync(password, salt, 32);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

// ─── Helpers de geração de SQL ────────────────────────────────────────────────

/**
 * Escapa um valor para uso seguro em SQL INSERT
 */
function escapeSqlValue(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number" || typeof val === "bigint") return String(val);
  if (typeof val === "boolean") return val ? "1" : "0";
  if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`;
  if (Buffer.isBuffer(val)) return `X'${val.toString("hex")}'`;
  // String: escapa aspas simples e backslashes
  const str = String(val)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\0/g, "\\0")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\x1a/g, "\\Z");
  return `'${str}'`;
}

/**
 * Gera o SQL completo de uma tabela (CREATE TABLE + INSERTs em lotes)
 */
async function exportarTabela(
  conn: mysql.Connection,
  schema: string,
  tabela: string
): Promise<string> {
  const linhas: string[] = [];

  linhas.push(`-- ─── Tabela: ${tabela} ───────────────────────────────────────────`);
  linhas.push(`DROP TABLE IF EXISTS \`${tabela}\`;`);

  // CREATE TABLE
  const [createRows] = await conn.query<mysql.RowDataPacket[]>(
    `SHOW CREATE TABLE \`${schema}\`.\`${tabela}\``
  );
  if (createRows.length > 0) {
    const createSql: string =
      (createRows[0] as Record<string, string>)["Create Table"] ?? "";
    linhas.push(createSql + ";");
  }

  // Contar registros
  const [countRows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM \`${schema}\`.\`${tabela}\``
  );
  const total: number = (countRows[0] as { total: number }).total ?? 0;

  if (total === 0) {
    linhas.push(`-- (tabela vazia)`);
    return linhas.join("\n");
  }

  // Buscar dados em lotes de 500 para evitar estouro de memória
  const BATCH = 500;
  let offset = 0;

  while (offset < total) {
    const [rows] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT * FROM \`${schema}\`.\`${tabela}\` LIMIT ${BATCH} OFFSET ${offset}`
    );
    if ((rows as mysql.RowDataPacket[]).length === 0) break;

    const colunas = Object.keys(rows[0])
      .map((c) => `\`${c}\``)
      .join(", ");

    const valores = (rows as mysql.RowDataPacket[])
      .map(
        (row) =>
          `(${Object.values(row)
            .map((v) => escapeSqlValue(v))
            .join(", ")})`
      )
      .join(",\n  ");

    linhas.push(`INSERT INTO \`${tabela}\` (${colunas}) VALUES`);
    linhas.push(`  ${valores};`);

    offset += BATCH;
  }

  return linhas.join("\n");
}

// ─── Exportação completa do banco ─────────────────────────────────────────────

/**
 * Gera o dump SQL completo do banco usando mysql2 nativo (sem mysqldump)
 */
async function gerarDumpSQL(): Promise<{ sql: string; tablesExported: number }> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("DATABASE_URL not configured");

  // Suporta formatos:
  //   mysql://user:pass@host:port/database?ssl=...
  //   mysql://user:pass@host:port/database
  const urlObj = new URL(dbUrl);
  const host = urlObj.hostname;
  const port = parseInt(urlObj.port || "3306", 10);
  const user = decodeURIComponent(urlObj.username);
  const password = decodeURIComponent(urlObj.password);
  // Remove leading slash e query string do pathname
  const database = urlObj.pathname.replace(/^\//, "").split("?")[0];

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    ssl: { rejectUnauthorized: false }, // TiDB Cloud exige SSL mas aceita qualquer cert
    multipleStatements: false,
  });

  try {
    // Lista todas as tabelas do schema
    const [tableRows] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`,
      [database]
    );

    const tabelas = (tableRows as mysql.RowDataPacket[]).map(
      (r) => r["TABLE_NAME"] as string
    );

    const cabecalho = [
      `-- PromptJur Database Backup`,
      `-- Gerado em: ${new Date().toISOString()}`,
      `-- Banco: ${database}`,
      `-- Tabelas: ${tabelas.length}`,
      `-- Gerado por: backup.ts (mysql2 nativo)`,
      ``,
      `SET FOREIGN_KEY_CHECKS=0;`,
      `SET SQL_MODE='NO_AUTO_VALUE_ON_ZERO';`,
      `SET NAMES utf8mb4;`,
      ``,
    ].join("\n");

    const partes: string[] = [cabecalho];

    for (const tabela of tabelas) {
      try {
        const sqlTabela = await exportarTabela(conn, database, tabela);
        partes.push(sqlTabela);
        partes.push(""); // linha em branco entre tabelas
      } catch (err) {
        partes.push(`-- ERRO ao exportar tabela ${tabela}: ${(err as Error).message}`);
      }
    }

    partes.push(`SET FOREIGN_KEY_CHECKS=1;`);
    partes.push(`-- Fim do backup`);

    return {
      sql: partes.join("\n"),
      tablesExported: tabelas.length,
    };
  } finally {
    await conn.end();
  }
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Cria backup do banco de dados sem depender de mysqldump
 */
export async function criarBackup(userId: number): Promise<BackupResult> {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-${ts}.sql`;

  try {
    // 1. Gera o dump SQL em memória (sem arquivo temporário)
    const { sql, tablesExported } = await gerarDumpSQL();
    const backupBuffer = Buffer.from(sql, "utf8");
    const originalSize = backupBuffer.length;

    // 2. Criptografa
    const encryptionKey =
      process.env.BACKUP_ENCRYPTION_KEY ||
      "default-encryption-key-change-in-production";
    const encryptedData = encrypt(backupBuffer, encryptionKey);

    // 3. Upload para S3
    const s3Key = `backups/${filename}.enc`;
    const { url: s3Url } = await storagePut(
      s3Key,
      encryptedData,
      "application/octet-stream"
    );

    // 4. Registra no banco
    const db = await getDb();
    if (db) {
      await db.insert(backups).values({
        filename: `${filename}.enc`,
        s3Key,
        s3Url,
        size: encryptedData.length,
        isEncrypted: 1,
        createdBy: userId,
      });
    }

    console.log(
      `[Backup] Sucesso: ${tablesExported} tabelas, ${(originalSize / 1024).toFixed(1)} KB`
    );

    return {
      success: true,
      filename: `${filename}.enc`,
      s3Url,
      size: originalSize,
      tablesExported,
    };
  } catch (error: any) {
    console.error("[Backup] Falha ao criar backup:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Lista todos os backups disponíveis
 */
export async function listarBackups(): Promise<Backup[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(backups)
    .orderBy(desc(backups.createdAt))
    .limit(100);

  return result.map((backup) => ({
    ...backup,
    createdAt: backup.createdAt instanceof Date
      ? backup.createdAt.toISOString()
      : backup.createdAt,
  })) as any;
}

/**
 * Restaura backup do banco de dados
 *
 * ATENÇÃO: operação destrutiva — substitui todos os dados atuais.
 * Usa mysql2 para executar o SQL linha a linha (sem cliente mysql CLI).
 */
export async function restaurarBackup(backupId: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Busca metadados do backup
    const [backup] = await db
      .select()
      .from(backups)
      .where(eq(backups.id, backupId))
      .limit(1);

    if (!backup) throw new Error("Backup not found");

    // Download do S3
    const response = await fetch(backup.s3Url);
    if (!response.ok) {
      throw new Error(`Falha ao baixar backup: ${response.statusText}`);
    }

    const encryptedData = Buffer.from(await response.arrayBuffer());

    // Descriptografa
    const encryptionKey =
      process.env.BACKUP_ENCRYPTION_KEY ||
      "default-encryption-key-change-in-production";
    const sqlBuffer = decrypt(encryptedData, encryptionKey);
    const sql = sqlBuffer.toString("utf8");

    // Conecta ao banco
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error("DATABASE_URL not configured");

    const urlObj = new URL(dbUrl);
    const conn = await mysql.createConnection({
      host: urlObj.hostname,
      port: parseInt(urlObj.port || "3306", 10),
      user: decodeURIComponent(urlObj.username),
      password: decodeURIComponent(urlObj.password),
      database: urlObj.pathname.replace(/^\//, "").split("?")[0],
      ssl: { rejectUnauthorized: false },
      multipleStatements: true, // necessário para executar o dump completo
    });

    try {
      // Executa o SQL do backup (SET FOREIGN_KEY_CHECKS=0 já está no dump)
      await conn.query(sql);
    } finally {
      await conn.end();
    }

    return { success: true };
  } catch (error: any) {
    console.error("[Backup] Falha ao restaurar backup:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove backups com mais de 30 dias (metadados no banco; S3 não gerenciado aqui)
 */
export async function limparBackupsAntigos(): Promise<{ removed: number }> {
  const db = await getDb();
  if (!db) return { removed: 0 };

  // TODO: Implementar remoção de objetos no S3 via API
  return { removed: 0 };
}
