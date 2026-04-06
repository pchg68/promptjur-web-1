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
import { storagePut, storageDelete } from "./storage";
import { getDb } from "./db";
import { eq, desc, lt } from "drizzle-orm";
import { mysqlTable, int, varchar, timestamp, bigint } from "drizzle-orm/mysql-core";
import { notifyOwner } from "./_core/notification";

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

    const tamanhoKB = (originalSize / 1024).toFixed(1);
    const tamanhoMB = (originalSize / (1024 * 1024)).toFixed(2);
    console.log(
      `[Backup] Sucesso: ${tablesExported} tabelas, ${tamanhoKB} KB`
    );

    // 5. Notifica o owner sobre o sucesso
    try {
      await notifyOwner({
        title: `✅ Backup concluído — ${new Date().toLocaleDateString("pt-BR")}`,
        content: [
          `**Backup automático realizado com sucesso.**`,
          ``,
          `| Campo | Valor |`,
          `|---|---|`,
          `| Arquivo | \`${filename}.enc\` |`,
          `| Tabelas exportadas | ${tablesExported} |`,
          `| Tamanho original | ${tamanhoMB} MB (${tamanhoKB} KB) |`,
          `| Tamanho criptografado | ${(encryptedData.length / 1024).toFixed(1)} KB |`,
          `| Armazenamento | S3 (criptografado AES-256-GCM) |`,
          `| Horário | ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Brasília) |`,
        ].join("\n"),
      });
    } catch (notifyErr) {
      // Falha na notificação não deve cancelar o backup
      console.warn("[Backup] Falha ao notificar owner:", notifyErr);
    }

    return {
      success: true,
      filename: `${filename}.enc`,
      s3Url,
      size: originalSize,
      tablesExported,
    };
  } catch (error: any) {
    console.error("[Backup] Falha ao criar backup:", error);

    // Notifica o owner sobre a falha
    try {
      await notifyOwner({
        title: `❌ Falha no backup — ${new Date().toLocaleDateString("pt-BR")}`,
        content: [
          `**O backup automático falhou.**`,
          ``,
          `**Erro:** ${error.message}`,
          ``,
          `Verifique os logs do servidor e tente criar um backup manual pelo painel admin.`,
          ``,
          `Horário: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Brasília)`,
        ].join("\n"),
      });
    } catch (notifyErr) {
      console.warn("[Backup] Falha ao notificar owner sobre erro:", notifyErr);
    }

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
 * Remove backups com mais de 30 dias:
 * 1. Busca backups antigos no banco
 * 2. Deleta cada objeto do S3
 * 3. Remove os registros do banco
 * 4. Notifica o owner com o resultado
 */
export async function limparBackupsAntigos(
  diasRetencao = 30
): Promise<{ removed: number; errors: number }> {
  const db = await getDb();
  if (!db) return { removed: 0, errors: 0 };

  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - diasRetencao);

  // Busca backups mais antigos que o limite de retenção
  const backupsAntigos = await db
    .select()
    .from(backups)
    .where(lt(backups.createdAt, dataLimite))
    .orderBy(backups.createdAt);

  if (backupsAntigos.length === 0) {
    console.log(`[Backup] Limpeza: nenhum backup com mais de ${diasRetencao} dias encontrado.`);
    return { removed: 0, errors: 0 };
  }

  console.log(`[Backup] Limpeza: ${backupsAntigos.length} backup(s) antigo(s) encontrado(s).`);

  let removed = 0;
  let errors = 0;

  for (const backup of backupsAntigos) {
    try {
      // 1. Deleta do S3
      const deletadoS3 = await storageDelete(backup.s3Key);
      if (!deletadoS3) {
        console.warn(`[Backup] Não foi possível deletar do S3: ${backup.s3Key}`);
      }

      // 2. Remove do banco (mesmo que o S3 falhe, remove o registro)
      await db.delete(backups).where(eq(backups.id, backup.id));

      removed++;
      console.log(`[Backup] Removido: ${backup.filename} (criado em ${backup.createdAt})`);
    } catch (err) {
      errors++;
      console.error(`[Backup] Erro ao remover backup #${backup.id}:`, err);
    }
  }

  console.log(`[Backup] Limpeza concluída: ${removed} removido(s), ${errors} erro(s).`);

  // Notifica o owner sobre a limpeza
  if (removed > 0 || errors > 0) {
    try {
      await notifyOwner({
        title: `🗑️ Limpeza de backups antigos — ${new Date().toLocaleDateString("pt-BR")}`,
        content: [
          `**Limpeza automática de backups concluída.**`,
          ``,
          `| Campo | Valor |`,
          `|---|---|`,
          `| Backups removidos | ${removed} |`,
          `| Erros | ${errors} |`,
          `| Política de retenção | ${diasRetencao} dias |`,
          `| Horário | ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Brasília) |`,
        ].join("\n"),
      });
    } catch (notifyErr) {
      console.warn("[Backup] Falha ao notificar owner sobre limpeza:", notifyErr);
    }
  }

  return { removed, errors };
}
