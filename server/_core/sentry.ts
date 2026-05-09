/**
 * Configuração do Sentry para monitoramento de erros no servidor
 * 
 * Captura automaticamente:
 * - Erros não tratados e exceções
 * - Erros de procedures tRPC com contexto de usuário
 * - Performance de requisições HTTP
 * - Breadcrumbs de fluxo de requisições
 * - Stack traces com source maps
 */

import * as Sentry from "@sentry/node";
import { trackQueryError } from "./query-error-alert";

let sentryInitialized = false;

/**
 * Inicializa o Sentry no servidor.
 * Deve ser chamado ANTES de qualquer outro módulo no index.ts.
 */
export function initSentry() {
  const sentryDsn = process.env.SENTRY_DSN;
  
  if (!sentryDsn) {
    console.warn("[Sentry] SENTRY_DSN não configurado. Monitoramento de erros desabilitado.");
    console.warn("[Sentry] Para ativar: Adicione SENTRY_DSN nas configurações do projeto");
    return;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      
      // Ambiente (development, staging, production)
      environment: process.env.NODE_ENV || "development",
      
      // Taxa de amostragem de performance
      tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
      
      // Informações do release para rastreamento de versões
      release: `promptjur-server@${process.env.npm_package_version || "1.0.0"}`,
      
      // Nome do servidor para identificação
      serverName: "promptjur-web",
      
      // Integração com Express para capturar requisições HTTP
      integrations: [
        Sentry.httpIntegration(),
        Sentry.expressIntegration(),
      ],
      
      // Filtrar informações sensíveis antes de enviar
      beforeSend(event) {
        // Remover dados sensíveis
        if (event.request) {
          delete event.request.cookies;
          if (event.request.headers) {
            delete event.request.headers["authorization"];
            delete event.request.headers["cookie"];
            delete event.request.headers["x-forwarded-for"];
          }
        }
        
        // Remover dados sensíveis de breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map(bc => {
            if (bc.data?.headers) {
              delete bc.data.headers["authorization"];
              delete bc.data.headers["cookie"];
            }
            return bc;
          });
        }
        
        return event;
      },
      
      // Filtrar transações de performance desnecessárias
      beforeSendTransaction(event) {
        // Ignorar health checks e assets estáticos
        const url = event.request?.url || "";
        if (url.includes("/health") || url.includes("/favicon") || url.includes("/assets/")) {
          return null;
        }
        return event;
      },
    });

    sentryInitialized = true;
    console.log("[Sentry] Inicializado com sucesso para ambiente:", process.env.NODE_ENV);
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
  if (!sentryInitialized) {
    console.log(`[Sentry:Offline] [${level}]`, message);
    return;
  }
  Sentry.captureMessage(message, level);
}

/**
 * Adiciona contexto de usuário para rastreamento.
 * Chamado automaticamente no contexto tRPC quando o usuário está autenticado.
 */
export function setUserContext(user: { id: number; email?: string | null; name?: string | null; role?: string }) {
  if (!sentryInitialized) return;
  
  Sentry.setUser({
    id: user.id.toString(),
    email: user.email || undefined,
    username: user.name || undefined,
    role: user.role,
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
 * Handler de erros para tRPC procedures.
 * Captura erros com contexto completo (procedure, input, usuário).
 * 
 * Uso no createExpressMiddleware:
 * ```ts
 * createExpressMiddleware({
 *   router: appRouter,
 *   createContext,
 *   onError: handleTRPCError,
 * })
 * ```
 */
export function handleTRPCError({ error, path, type, ctx }: {
  error: any;
  path?: string;
  type: string;
  ctx?: any;
}) {
  // Não capturar erros de autenticação (são esperados)
  if (error?.code === "UNAUTHORIZED" || error?.code === "FORBIDDEN") {
    return;
  }
  
  // Não capturar NOT_FOUND (são esperados)
  if (error?.code === "NOT_FOUND") {
    return;
  }
  
  // Log no console para debugging local
  console.error(`[tRPC Error] ${type} ${path}:`, error?.message || error);

  // Rastrear erros de query para alerta proativo (threshold 3+ em 1h)
  const errorMsg = error?.message || String(error);
  if (errorMsg.includes("Failed query") || errorMsg.includes("Table") && errorMsg.includes("doesn't exist")) {
    trackQueryError(errorMsg, path || "unknown").catch(() => {});
  }
  
  if (!sentryInitialized) return;
  
  Sentry.withScope((scope) => {
    // Adicionar contexto da procedure
    scope.setTag("trpc.path", path || "unknown");
    scope.setTag("trpc.type", type);
    scope.setTag("trpc.code", error?.code || "INTERNAL_SERVER_ERROR");
    
    // Adicionar contexto do usuário se disponível
    if (ctx?.user) {
      scope.setUser({
        id: ctx.user.id?.toString(),
        email: ctx.user.email || undefined,
        username: ctx.user.name || undefined,
      });
    }
    
    // Adicionar breadcrumb
    scope.addBreadcrumb({
      category: "trpc",
      message: `${type} ${path}`,
      level: "error",
      data: {
        code: error?.code,
        message: error?.message,
      },
    });
    
    // Capturar a exceção
    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureException(new Error(`tRPC Error: ${error?.message || JSON.stringify(error)}`));
    }
  });
}

/**
 * Retorna estatísticas básicas do Sentry para o painel de monitoramento
 */
export function getSentryStatus() {
  return {
    initialized: sentryInitialized,
    dsn: process.env.SENTRY_DSN ? "configured" : "not_configured",
    environment: process.env.NODE_ENV || "development",
    release: `promptjur-server@${process.env.npm_package_version || "1.0.0"}`,
  };
}

// Exportar namespace Sentry para uso direto quando necessário
export { Sentry };
