import winston from 'winston';
import path from 'path';

/**
 * Níveis de log personalizados para o PromptJur
 */
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  },
};

// Adicionar cores aos níveis
winston.addColors(customLevels.colors);

/**
 * Formato de log estruturado em JSON para produção
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Formato de log legível para desenvolvimento
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level}: ${info.message}${info.stack ? `\n${info.stack}` : ''}`
  )
);

/**
 * Determina o nível de log baseado no ambiente
 */
const getLogLevel = (): string => {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') return 'info';
  if (env === 'test') return 'error';
  return 'debug';
};

/**
 * Configuração de transports (destinos dos logs)
 */
const transports: winston.transport[] = [
  // Console (sempre ativo)
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? jsonFormat : consoleFormat,
  }),
];

// Em produção, adicionar arquivo de logs
if (process.env.NODE_ENV === 'production') {
  const logsDir = path.join(process.cwd(), 'logs');
  
  // Logs de erro separados
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    })
  );

  // Logs combinados
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: jsonFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
    })
  );
}

/**
 * Instância principal do logger
 */
export const logger = winston.createLogger({
  levels: customLevels.levels,
  level: getLogLevel(),
  transports,
  // Não sair do processo em caso de erro
  exitOnError: false,
});

/**
 * Logger específico para requisições HTTP
 * 
 * @param method - Método HTTP (GET, POST, etc)
 * @param url - URL da requisição
 * @param statusCode - Código de status HTTP
 * @param duration - Duração em ms
 * @param userId - ID do usuário (opcional)
 */
export function logHttp(
  method: string,
  url: string,
  statusCode: number,
  duration: number,
  userId?: number
) {
  logger.http('HTTP Request', {
    method,
    url,
    statusCode,
    duration,
    userId,
  });
}

/**
 * Logger específico para operações de banco de dados
 * 
 * @param operation - Tipo de operação (SELECT, INSERT, UPDATE, DELETE)
 * @param table - Nome da tabela
 * @param duration - Duração em ms
 * @param error - Erro (se houver)
 */
export function logDatabase(
  operation: string,
  table: string,
  duration: number,
  error?: Error
) {
  if (error) {
    logger.error('Database Error', {
      operation,
      table,
      duration,
      error: error.message,
      stack: error.stack,
    });
  } else {
    logger.debug('Database Operation', {
      operation,
      table,
      duration,
    });
  }
}

/**
 * Logger específico para operações de cache
 * 
 * @param operation - Tipo de operação (GET, SET, DELETE, CLEAR)
 * @param key - Chave do cache
 * @param hit - Se foi cache hit (opcional)
 */
export function logCache(
  operation: string,
  key: string,
  hit?: boolean
) {
  logger.debug('Cache Operation', {
    operation,
    key,
    hit,
  });
}

/**
 * Logger específico para operações de LLM
 * 
 * @param model - Modelo usado (GPT-4, Manus AI, etc)
 * @param tokens - Número de tokens usados
 * @param duration - Duração em ms
 * @param error - Erro (se houver)
 */
export function logLLM(
  model: string,
  tokens: number,
  duration: number,
  error?: Error
) {
  if (error) {
    logger.error('LLM Error', {
      model,
      tokens,
      duration,
      error: error.message,
    });
  } else {
    logger.info('LLM Request', {
      model,
      tokens,
      duration,
    });
  }
}

/**
 * Logger específico para autenticação
 * 
 * @param event - Tipo de evento (login, logout, failed_login)
 * @param userId - ID do usuário
 * @param method - Método de autenticação
 * @param ip - Endereço IP
 */
export function logAuth(
  event: 'login' | 'logout' | 'failed_login',
  userId: number | null,
  method: string,
  ip: string
) {
  logger.info('Authentication Event', {
    event,
    userId,
    method,
    ip,
  });
}

/**
 * Logger específico para ações administrativas
 * 
 * @param action - Ação realizada
 * @param userId - ID do administrador
 * @param details - Detalhes adicionais
 */
export function logAdmin(
  action: string,
  userId: number,
  details?: Record<string, any>
) {
  logger.info('Admin Action', {
    action,
    userId,
    ...details,
  });
}

export default logger;
