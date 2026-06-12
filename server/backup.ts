/**
 * Módulo de Backup Automatizado do Banco de Dados
 * Cria backups criptografados e armazena no S3
 */

import { exec } from "child_process";
import { promisify } from "util";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";
import { storagePut, storageDelete } from "./storage";
import { getDb } from "./db";
import { eq, desc, lt } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { backups } from "../drizzle/schema";

const execAsync = promisify(exec);

export type Backup = typeof backups.$inferSelect;

interface BackupResult {
  success: boolean;
  filename?: string;
  s3Url?: string;
  size?: number;
  error?: string;
}

/**
 * Criptografa dados usando AES-256-GCM
 */
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

/**
 * Descriptografa dados usando AES-256-GCM
 */
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

/**
 * Cria backup do banco de dados
 */
export async function criarBackup(userId: number): Promise<BackupResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-${timestamp}.sql`;
  const tempPath = `/tmp/${filename}`;
  const encryptedPath = `/tmp/${filename}.enc`;

  try {
    // Extrai credenciais do DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL not configured");
    }

    // Parse DATABASE_URL (formato: mysql://user:pass@host:port/database)
    const urlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!urlMatch) {
      throw new Error("Invalid DATABASE_URL format");
    }

    const [, user, password, host, port, database] = urlMatch;

    // Cria backup usando mysqldump
    const dumpCommand = `mysqldump -h ${host} -P ${port} -u ${user} -p'${password}' ${database} > ${tempPath}`;
    await execAsync(dumpCommand, {
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
    });

    // Verifica se o arquivo foi criado
    if (!existsSync(tempPath)) {
      throw new Error("Backup file was not created");
    }

    // Lê o arquivo de backup
    const backupData = readFileSync(tempPath);
    const originalSize = backupData.length;

    // Criptografa o backup
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || "default-encryption-key-change-in-production";
    const encryptedData = encrypt(backupData, encryptionKey);
    
    // Salva arquivo criptografado temporariamente
    writeFileSync(encryptedPath, encryptedData);

    // Upload para S3
    const s3Key = `backups/${filename}.enc`;
    const { url: s3Url } = await storagePut(
      s3Key,
      encryptedData,
      "application/octet-stream"
    );

    // Registra backup no banco de dados
    const db = await getDb();
    if (db) {
      await db.insert(backups).values({
        filename: `${filename}.enc`,
        s3Key,
        s3Url,
        size: encryptedData.length,
        isEncrypted: true,
        createdBy: userId,
      });
    }

    // Remove arquivos temporários
    unlinkSync(tempPath);
    unlinkSync(encryptedPath);

    try {
      await notifyOwner({
        title: "✅ Backup concluído com sucesso",
        content: [
          `Arquivo: ${filename}.enc`,
          `Tabelas exportadas: dump completo do banco`,
          `Tamanho: ${Math.round(encryptedData.length / 1024)} KB`,
          "Criptografia: AES-256-GCM",
        ].join("\n"),
      });
    } catch (notifyError) {
      console.error("[Backup] Failed to notify owner about successful backup:", notifyError);
    }

    return {
      success: true,
      filename: `${filename}.enc`,
      s3Url,
      size: originalSize,
    };
  } catch (error: any) {
    console.error("[Backup] Failed to create backup:", error);
    
    // Limpa arquivos temporários em caso de erro
    try {
      if (existsSync(tempPath)) unlinkSync(tempPath);
      if (existsSync(encryptedPath)) unlinkSync(encryptedPath);
    } catch {}

    try {
      await notifyOwner({
        title: "❌ Falha ao criar backup",
        content: `Erro: ${error.message}`,
      });
    } catch (notifyError) {
      console.error("[Backup] Failed to notify owner about backup failure:", notifyError);
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
  if (!db) {
    return [];
  }

  const result = await db
    .select()
    .from(backups)
    .orderBy(desc(backups.createdAt))
    .limit(100);

  return result.map((backup: any) => ({
    ...backup,
    createdAt: backup.createdAt.toISOString(),
  })) as any;
}

/**
 * Restaura backup do banco de dados
 * ATENÇÃO: Esta operação é destrutiva e substitui todos os dados atuais
 */
export async function restaurarBackup(backupId: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Busca informações do backup
    const [backup] = await db
      .select()
      .from(backups)
      .where(eq(backups.id, backupId))
      .limit(1);

    if (!backup) {
      throw new Error("Backup not found");
    }

    // Download do backup do S3
    const response = await fetch(backup.s3Url);
    if (!response.ok) {
      throw new Error(`Failed to download backup: ${response.statusText}`);
    }

    const encryptedData = Buffer.from(await response.arrayBuffer());

    // Descriptografa o backup
    const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || "default-encryption-key-change-in-production";
    const decryptedData = decrypt(encryptedData, encryptionKey);

    // Salva arquivo SQL temporário
    const tempPath = `/tmp/restore-${Date.now()}.sql`;
    writeFileSync(tempPath, decryptedData);

    // Extrai credenciais do DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL not configured");
    }

    const urlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!urlMatch) {
      throw new Error("Invalid DATABASE_URL format");
    }

    const [, user, password, host, port, database] = urlMatch;

    // Restaura backup usando mysql client
    const restoreCommand = `mysql -h ${host} -P ${port} -u ${user} -p'${password}' ${database} < ${tempPath}`;
    await execAsync(restoreCommand, {
      maxBuffer: 50 * 1024 * 1024,
    });

    // Remove arquivo temporário
    unlinkSync(tempPath);

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("[Backup] Failed to restore backup:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Remove backups antigos (retenção de 30 dias)
 */
export async function limparBackupsAntigos(retentionDays = 30): Promise<{
  removed: number;
  errors: number;
}> {
  const db = await getDb();
  if (!db) {
    return { removed: 0, errors: 0 };
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const antigos = await db
    .select()
    .from(backups)
    .where(lt(backups.createdAt, cutoffDate))
    .orderBy(desc(backups.createdAt));

  let removed = 0;
  let errors = 0;

  for (const backup of antigos as Backup[]) {
    try {
      if (backup.s3Key) {
        await storageDelete(backup.s3Key);
      }

      await db.delete(backups).where(eq(backups.id, backup.id));
      removed += 1;
    } catch (error) {
      errors += 1;
      console.error("[Backup] Failed to remove old backup:", error);
    }
  }

  if (removed > 0) {
    try {
      await notifyOwner({
        title: "🗑️ Backups antigos removidos",
        content: `Foram removidos ${removed} backup(s) com mais de ${retentionDays} dias.${errors > 0 ? ` Erros: ${errors}.` : ""}`,
      });
    } catch (notifyError) {
      console.error("[Backup] Failed to notify owner about cleanup:", notifyError);
    }
  }

  return { removed, errors };
}
