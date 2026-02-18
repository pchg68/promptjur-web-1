/**
 * Configuração do Sentry para monitoramento de erros no servidor
 * 
 * O Sentry captura automaticamente erros não tratados, exceções e stack traces,
 * enviando para o dashboard do Sentry para análise e debugging.
 */

import * as Sentry from "@sentry/node";
import { ENV } from "./env";

/**
 * Inicializa o Sentry no servidor
 * 
 * Para usar em produção:
 * 1. Crie uma conta em https://sentry.io
 * 2. Crie um novo projeto Node.js
 * 3. Copie o DSN fornecido
 * 4. Adicione SENTRY_DSN nas variáveis de ambiente via webdev_request_secrets
 * 
 * Exemplo de DSN: https://examplePublicKey@o0.ingest.sentry.io/0
 */
export function initSentry() {
  const sentryDsn = process.env.SENTRY_DSN;
  
  if (!sentryDsn) {
    console.warn("[Sentry] SENTRY_DSN not configured. Error monitoring disabled.");
    console.warn("[Sentry] To enable: Add SENTRY_DSN via webdev_request_secrets tool");
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    
    // Ambiente (development, staging, production)
    environment: process.env.NODE_ENV || "development",
    
    // Taxa de amostragem de performance (0.0 a 1.0)
    // 1.0 = 100% das transações são enviadas
    // 0.1 = 10% das transações são enviadas (recomendado para produção)
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    
    // Informações do release para rastreamento de versões
    release: `promptjur-web@${process.env.npm_package_version || "unknown"}`,
    
    // Integração com Express para capturar requisições HTTP
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
    
    // Filtrar informações sensíveis
    beforeSend(event) {
      // Remover dados sensíveis antes de enviar
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers?.["authorization"];
        delete event.request.headers?.["cookie"];
      }
      return event;
    },
  });

  console.log("[Sentry] Initialized successfully for environment:", process.env.NODE_ENV);
}

/**
 * Captura uma exceção manualmente
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Captura uma mensagem de log
 */
export function captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
  Sentry.captureMessage(message, level);
}

/**
 * Adiciona contexto de usuário para rastreamento
 */
export function setUserContext(user: { id: number; email?: string; name?: string }) {
  Sentry.setUser({
    id: user.id.toString(),
    email: user.email,
    username: user.name,
  });
}

/**
 * Limpa contexto de usuário (útil após logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

// Exportar namespace Sentry para uso direto quando necessário
export { Sentry };
