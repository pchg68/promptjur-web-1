/**
 * Conexão com o banco de dados.
 */
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { logger } from "../_core/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;
let _mysqlPool: mysql.Pool | null = null;


/**
 * Obtém a instância do banco de dados Drizzle ORM.
 * Cria a conexão lazy (apenas quando necessário) e reutiliza a instância.
 * 
 * @returns {Promise<ReturnType<typeof drizzle> | null>} Instância do Drizzle ORM ou null se conexão falhar
 * @example
 * const db = await getDb();
 * if (!db) {
 *   console.error('Database not available');
 *   return;
 * }
 */
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      _mysqlPool = mysql.createPool({
        host: url.hostname,
        port: parseInt(url.port) || 3306,
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.replace(/^\//, '').split('?')[0],
        ssl: { rejectUnauthorized: false },
        connectionLimit: 10,
        waitForConnections: true,
      });
      _db = drizzle(_mysqlPool);
    } catch (error) {
      logger.warn('[Database] Failed to connect', { error });
      _db = null;
    }
  }
  return _db;
}
