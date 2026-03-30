/**
 * Configuração do Sentry para monitoramento de erros no frontend (React)
 * 
 * Captura automaticamente:
 * - Erros de componentes React (via ErrorBoundary e React 19 handlers)
 * - Erros de rede (fetch/tRPC)
 * - Unhandled promise rejections
 * - Breadcrumbs de navegação e interações do usuário
 * - Session replay em caso de erros
 */

import * as Sentry from "@sentry/react";

let sentryInitialized = false;

/**
 * Inicializa o Sentry no cliente React.
 * Deve ser chamado ANTES de createRoot() no main.tsx.
 */
export function initSentry() {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!sentryDsn) {
    console.warn("[Sentry] VITE_SENTRY_DSN não configurado. Monitoramento de erros desabilitado.");
    return;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      
      // Ambiente (development, staging, production)
      environment: import.meta.env.MODE || "development",
      
      // Release para rastreamento de versões
      release: "promptjur-client@1.0.0",
      
      // Taxa de amostragem de performance (reduzida para evitar memory leak)
      tracesSampleRate: import.meta.env.MODE === "production" ? 0.1 : 0.3,
      
      // Session Replay: DESABILITADO para evitar Out of Memory
      // O replay mantém buffers grandes na memória que acumulam com o tempo
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,  // Desabilitado - causa memory leak
      
      // Integrações - REDUZIDAS para evitar memory leak
      // Session Replay REMOVIDO: mantinha buffers grandes que causavam Out of Memory
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      
      // Limitar número de breadcrumbs para evitar acúmulo de memória
      maxBreadcrumbs: 30,
      
      // Filtrar informações sensíveis antes de enviar
      beforeSend(event) {
        // Remover dados sensíveis
        if (event.request) {
          delete event.request.cookies;
          if (event.request.headers) {
            delete event.request.headers["authorization"];
            delete event.request.headers["cookie"];
          }
        }
        
        // Filtrar erros de extensões do navegador
        const frames = event.exception?.values?.[0]?.stacktrace?.frames;
        if (frames?.some(f => f.filename?.includes("chrome-extension://"))) {
          return null;
        }
        
        return event;
      },
      
      // Ignorar erros comuns que não são bugs
      ignoreErrors: [
        // Erros de rede/conectividade
        "Failed to fetch",
        "NetworkError",
        "Load failed",
        "ChunkLoadError",
        // Erros de autenticação (esperados)
        "UNAUTHORIZED",
        "Please login",
        // Erros de JSON inválido causados por redirect de auth (HTML retornado)
        /Unexpected token '<'/,
        /is not valid JSON/,
        // Erros de navegação do usuário
        "ResizeObserver loop",
        "AbortError",
      ],
    });

    sentryInitialized = true;
    console.log("[Sentry] Inicializado com sucesso para ambiente:", import.meta.env.MODE);
  } catch (error) {
    console.error("[Sentry] Falha ao inicializar:", error);
  }
}

/**
 * Verifica se o Sentry está inicializado e ativo
 */
export function isSentryActive(): boolean {
  return sentryInitialized;
}

/**
 * Captura uma exceção manualmente com contexto adicional
 */
export function captureException(error: Error | unknown, context?: Record<string, any>) {
  if (!sentryInitialized) {
    console.error("[Sentry:Offline]", error);
    return;
  }
  
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
  if (!sentryInitialized) return;
  Sentry.captureMessage(message, level);
}

/**
 * Adiciona contexto de usuário para rastreamento.
 * Deve ser chamado após o login do usuário.
 */
export function setUserContext(user: { id: number; email?: string | null; name?: string | null; role?: string }) {
  if (!sentryInitialized) return;
  
  Sentry.setUser({
    id: user.id.toString(),
    email: user.email || undefined,
    username: user.name || undefined,
  });
}

/**
 * Limpa contexto de usuário (útil após logout)
 */
export function clearUserContext() {
  if (!sentryInitialized) return;
  Sentry.setUser(null);
}

/**
 * Adiciona um breadcrumb personalizado para rastreamento de fluxo
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, any>,
  level: "debug" | "info" | "warning" | "error" = "info"
) {
  if (!sentryInitialized) return;
  
  Sentry.addBreadcrumb({
    category,
    message,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Retorna o status do Sentry para o painel de monitoramento
 */
export function getSentryStatus() {
  return {
    initialized: sentryInitialized,
    dsn: import.meta.env.VITE_SENTRY_DSN ? "configured" : "not_configured",
    environment: import.meta.env.MODE || "development",
  };
}

// Exportar namespace Sentry para uso direto (ErrorBoundary, etc.)
export { Sentry };
