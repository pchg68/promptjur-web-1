import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { initSentry, Sentry, captureException, addBreadcrumb } from "./_core/sentry";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

// Inicializar Sentry antes de criar o QueryClient
initSentry();

/**
 * Handler gracioso para erros de preload do Vite.
 * Quando o browser falha ao carregar um chunk JS/CSS (ex: deploy novo invalidou hashes,
 * conexão instável, ou paths incorretos), o Vite dispara o evento 'vite:preloadError'.
 * Em vez de mostrar a tela de erro do ErrorBoundary, recarregamos a página automaticamente
 * para que o browser baixe os novos assets. Um flag no sessionStorage evita loops infinitos.
 */
const PRELOAD_RELOAD_KEY = 'promptjur_preload_reload';

window.addEventListener('vite:preloadError', (event: Event) => {
  const payload = (event as any).payload ?? (event as any).detail;
  const lastReload = sessionStorage.getItem(PRELOAD_RELOAD_KEY);
  const now = Date.now();
  
  // Se já recarregou nos últimos 30 segundos, não recarregar novamente (evita loop)
  if (lastReload && now - parseInt(lastReload, 10) < 30_000) {
    console.error('[Preload] Erro de preload persistente após reload:', payload);
    addBreadcrumb('preload_error_persistent', String(payload));
    return;
  }
  
  // Prevenir o comportamento padrão (que lançaria o erro para o ErrorBoundary)
  event.preventDefault();
  
  console.warn('[Preload] Erro de preload detectado, recarregando página...', payload);
  addBreadcrumb('preload_error_reload', String(payload));
  
  // Marcar que estamos recarregando por causa de preload
  sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(now));
  
  // Recarregar a página para obter os assets atualizados
  window.location.reload();
});

/**
 * Anti-redirect-loop: só permite um redirect a cada 10 segundos.
 * Isso evita que múltiplas queries UNAUTHORIZED disparem loops infinitos.
 */
let lastRedirectTime = 0;
let redirectScheduled = false;
const REDIRECT_COOLDOWN_MS = 10_000;

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;
  if (!isUnauthorized) return;

  const now = Date.now();

  // Se já redirecionou recentemente, ignorar
  if (now - lastRedirectTime < REDIRECT_COOLDOWN_MS) return;

  // Se já tem um redirect agendado, ignorar
  if (redirectScheduled) return;

  // Agendar redirect com pequeno delay para agrupar erros simultâneos
  redirectScheduled = true;
  setTimeout(() => {
    // Verificar novamente se auth.me retorna null antes de redirecionar
    // Isso evita redirect quando o cookie existe mas uma query específica falhou
    lastRedirectTime = Date.now();
    redirectScheduled = false;
    console.warn("[Auth] Redirecionando para login após erro de autenticação");
    window.location.href = getLoginUrl();
  }, 500);
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry 2x antes de considerar erro (ajuda com race conditions de cookie)
      // Mas NÃO retry em erros UNAUTHORIZED (evita HTML response após redirect)
      retry: (failureCount, error) => {
        if (error instanceof TRPCClientError) {
          const code = (error.data as any)?.code;
          // Não retry em erros de autenticação ou not found
          if (code === 'UNAUTHORIZED' || code === 'FORBIDDEN' || code === 'NOT_FOUND') return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      // Cache por 30 segundos para evitar refetch desnecessário
      staleTime: 30_000,
      // CRITICAL: Garbage collect queries após 2 minutos (padrão é 5min)
      // Isso evita acúmulo de dados na memória que causa Out of Memory
      gcTime: 2 * 60 * 1000,
      // Não refetch automaticamente ao focar a janela (evita sobrecarga)
      refetchOnWindowFocus: false,
      // Não refetch em background (evita acúmulo quando tab está inativa)
      refetchIntervalInBackground: false,
      // Não refetch ao reconectar (evita burst de requisições)
      refetchOnReconnect: false,
    },
    mutations: {
      // Garbage collect mutations rapidamente
      gcTime: 60_000,
    },
  },
});

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    // Só redirecionar se NÃO for a query auth.me (ela retorna null normalmente)
    const queryKey = event.query.queryKey;
    const isAuthMeQuery = Array.isArray(queryKey) && queryKey.some(
      (k: any) => typeof k === 'string' && k.includes('auth.me')
    );
    if (!isAuthMeQuery) {
      redirectToLoginIfUnauthorized(error);
    }
    // Capturar erros de query no Sentry (exceto auth)
    if (!isAuthMeQuery) {
      captureException(error instanceof Error ? error : new Error(String(error)), {
        type: "trpc_query_error",
        queryKey: JSON.stringify(queryKey),
      });
    }
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    // Capturar erros de mutation no Sentry
    captureException(error instanceof Error ? error : new Error(String(error)), {
      type: "trpc_mutation_error",
    });
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

// React 19 error handlers integrados com Sentry
const root = createRoot(document.getElementById("root")!, {
  // Erro não capturado por nenhum ErrorBoundary
  onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.warn("[React] Erro não capturado:", error, errorInfo.componentStack);
  }),
  // Erro capturado por um ErrorBoundary
  onCaughtError: Sentry.reactErrorHandler(),
  // Erro recuperável automaticamente pelo React
  onRecoverableError: Sentry.reactErrorHandler(),
});

root.render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);

/**
 * Registrar Service Worker para cache de chunks JS/CSS.
 * O SW usa estratégia Cache-First para assets com hash (imutáveis),
 * garantindo carregamento instantâneo e resiliência em conexões instáveis.
 */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Service Worker registrado com sucesso:', registration.scope);
        
        // Limpar cache antigo periodicamente (a cada 24h)
        const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;
        setInterval(() => {
          if (registration.active) {
            registration.active.postMessage({ type: 'CLEANUP_CACHE' });
          }
        }, CLEANUP_INTERVAL);
      })
      .catch((error) => {
        console.warn('[SW] Falha ao registrar Service Worker:', error);
      });
  });
}
