/**
 * Configuração do Sentry para monitoramento de erros no frontend (React)
 * 
 * O Sentry captura automaticamente erros não tratados, exceções de componentes React,
 * e erros de promise rejections, enviando para o dashboard do Sentry.
 */

import * as Sentry from "@sentry/react";

/**
 * Inicializa o Sentry no cliente React
 * 
 * Para usar em produção:
 * 1. Crie uma conta em https://sentry.io
 * 2. Crie um novo projeto React
 * 3. Copie o DSN fornecido
 * 4. Adicione VITE_SENTRY_DSN nas variáveis de ambiente via webdev_request_secrets
 * 
 * Exemplo de DSN: https://examplePublicKey@o0.ingest.sentry.io/0
 */
export function initSentry() {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!sentryDsn) {
    console.warn("[Sentry] VITE_SENTRY_DSN not configured. Error monitoring disabled.");
    console.warn("[Sentry] To enable: Add VITE_SENTRY_DSN via webdev_request_secrets tool");
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    
    // Ambiente (development, staging, production)
    environment: import.meta.env.MODE || "development",
    
    // Taxa de amostragem de performance (0.0 a 1.0)
    tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 1.0,
    
    // Taxa de amostragem de replay de sessão (0.0 a 1.0)
    // Captura replays de sessões com erros
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Integração com React Router para rastreamento de navegação
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true, // Ocultar todo texto para privacidade
        blockAllMedia: true, // Bloquear mídia para privacidade
      }),
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

  console.log("[Sentry] Initialized successfully for environment:", import.meta.env.MODE);
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
