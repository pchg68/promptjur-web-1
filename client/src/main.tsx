import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { initSentry } from "./_core/sentry";
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
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      // Cache por 30 segundos para evitar refetch desnecessário
      staleTime: 30_000,
      // Não refetch automaticamente ao focar a janela (evita sobrecarga)
      refetchOnWindowFocus: false,
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
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
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

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
