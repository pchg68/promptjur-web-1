/**
 * Conexão com o banco de dados.
 * 
 * Inclui:
 * - Pool de conexões com mysql2
 * - Warm-up na inicialização (evita cold start de 6s+ no primeiro request)
 * - Keep-alive periódico para manter conexões ativas e evitar reciclo por idle timeout
 */
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { sql } from "drizzle-orm";
import { logger } from "../_core/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;
let _mysqlPool: mysql.Pool | null = null;
let _keepAliveInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Intervalo do keep-alive em ms.
 * TiDB/MySQL geralmente descarta conexões idle após 8h,
 * mas proxies intermediários (como o gateway Manus) podem ter timeout menor (~5min).
 * Usamos 2 minutos para garantir que as conexões não fiquem idle.
 */
const KEEP_ALIVE_INTERVAL_MS = 2 * 60 * 1000; // 2 minutos (reduzido de 4min para combater idle timeout do proxy)

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
        // Evitar que conexões fiquem idle por muito tempo
        idleTimeout: 5 * 60 * 1000, // 5 minutos
        enableKeepAlive: true,
        keepAliveInitialDelay: 30_000, // TCP keep-alive a cada 30s
      });
      _db = drizzle(_mysqlPool);

      // Iniciar keep-alive periódico
      startKeepAlive();
    } catch (error) {
      logger.warn('[Database] Failed to connect', { error });
      _db = null;
    }
  }
  return _db;
}

/**
 * Warm-up do pool de conexões.
 * Deve ser chamado na inicialização do servidor para evitar cold start
 * no primeiro request do usuário (que pode levar 2-7 segundos com TLS).
 */
export async function warmUpDbPool(): Promise<void> {
  try {
    const start = Date.now();
    const db = await getDb();
    if (!db) {
      logger.warn('[Database] Warm-up falhou: DB não disponível');
      return;
    }
    
    // Executar query simples para forçar abertura de conexão
    await db.execute(sql`SELECT 1`);
    const elapsed = Date.now() - start;
    logger.info(`[Database] Pool warm-up concluído em ${elapsed}ms`);
  } catch (error) {
    logger.warn('[Database] Warm-up falhou:', { error });
  }
}

/** Contador de falhas consecutivas no keep-alive */
let keepAliveFailures = 0;
const MAX_KEEPALIVE_FAILURES = 3;

/**
 * Keep-alive periódico para manter conexões ativas no pool.
 * Evita que o gateway/proxy intermediário feche conexões idle,
 * o que causaria cold starts de 6-7 segundos na próxima query.
 * 
 * Melhorias:
 * - Pinga até 2 conexões para manter pool aquecido
 * - Reconexão automática após 3 falhas consecutivas
 * - Logging de latência do ping para diagnóstico
 */
function startKeepAlive(): void {
  if (_keepAliveInterval) return; // Já está rodando

  _keepAliveInterval = setInterval(async () => {
    if (!_mysqlPool) return;
    
    try {
      const start = Date.now();
      // Pingar 2 conexões para manter mais do pool aquecido
      const conn1 = await _mysqlPool.getConnection();
      await conn1.ping();
      conn1.release();
      
      const conn2 = await _mysqlPool.getConnection();
      await conn2.ping();
      conn2.release();
      
      const elapsed = Date.now() - start;
      keepAliveFailures = 0; // Reset no sucesso
      
      // Log apenas se demorou mais que o esperado (possível reconexão)
      if (elapsed > 500) {
        logger.warn(`[Database] Keep-alive lento: ${elapsed}ms (possível reconexão TLS)`);
      }
    } catch (error) {
      keepAliveFailures++;
      logger.warn(`[Database] Keep-alive ping falhou (${keepAliveFailures}/${MAX_KEEPALIVE_FAILURES}):`, { error });
      
      // Após N falhas consecutivas, forçar reconexão do pool
      if (keepAliveFailures >= MAX_KEEPALIVE_FAILURES) {
        logger.warn('[Database] Muitas falhas consecutivas no keep-alive. Forçando reconexão do pool...');
        try {
          // Fechar pool antigo e recriar
          if (_mysqlPool) {
            await _mysqlPool.end().catch(() => {});
          }
          _mysqlPool = null;
          _db = null;
          keepAliveFailures = 0;
          
          // Recriar pool via getDb()
          const db = await getDb();
          if (db) {
            logger.info('[Database] Pool reconectado com sucesso após falhas de keep-alive');
          }
        } catch (reconnectErr) {
          logger.warn('[Database] Falha na reconexão do pool:', { error: reconnectErr });
        }
      }
    }
  }, KEEP_ALIVE_INTERVAL_MS);

  // Não impedir o processo de encerrar
  _keepAliveInterval.unref();
}

/**
 * Encerra o pool de conexões (para testes e shutdown graceful).
 */
export async function closeDbPool(): Promise<void> {
  if (_keepAliveInterval) {
    clearInterval(_keepAliveInterval);
    _keepAliveInterval = null;
  }
  if (_mysqlPool) {
    await _mysqlPool.end();
    _mysqlPool = null;
    _db = null;
  }
}
