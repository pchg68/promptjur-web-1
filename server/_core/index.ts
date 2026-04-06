import "dotenv/config";
import { initSentry } from "./sentry";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { scheduleCacheCleanup } from "../jobs/cache-cleanup";
import { scheduleWhitelistExpiry } from "../jobs/whitelist-expiry";
import { handleStripeWebhook } from "./stripeWebhook";
import { handleGoogleOAuthCallback } from "../google-oauth-callback";
import { assistenteSSEHandler } from "../assistente-sse";
import { tRPCRateLimiter, injectUserMiddleware } from "./rateLimiter";
import * as Sentry from "@sentry/node";
import { handleTRPCError, setUserContext } from "./sentry";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // Inicializar Sentry antes de tudo
  initSentry();
  
  const app = express();
  const server = createServer(app);
  
  // Configurar trust proxy para rate limiting funcionar corretamente
  app.set('trust proxy', 1);
  
  // Stripe webhook MUST be registered BEFORE express.json() to receive raw body
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook
  );
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Google OAuth2 callback para Drive e Gmail
  app.get("/api/google/callback", handleGoogleOAuthCallback);
  // Assistente jurídico SSE (streaming de respostas da IA)
  app.get("/api/assistente/stream", assistenteSSEHandler);
  // Middleware do Sentry para capturar requisições (versão 10.x não requer handlers manuais)
  // O Sentry 10.x captura automaticamente via integração expressIntegration()
  
  // tRPC API with rate limiting
  app.use(
    "/api/trpc",
    injectUserMiddleware, // Injetar usuário antes do rate limiter
    tRPCRateLimiter,
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError: handleTRPCError,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  
  // Middleware de tratamento de erros do Sentry (DEVE ser o último middleware)
  if (process.env.SENTRY_DSN) {
    Sentry.setupExpressErrorHandler(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Agendar job de limpeza de cache
    scheduleCacheCleanup();
    // Agendar job de expiração automática da whitelist (a cada hora)
    scheduleWhitelistExpiry();
  });
}

startServer().catch(console.error);
