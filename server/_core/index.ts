console.log("[boot] Iniciando PromptJur...");
import "dotenv/config";
import { initSentry } from "./sentry";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import helmet from "helmet";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { scheduleCacheCleanup } from "../jobs/cache-cleanup";
import { scheduleWhitelistExpiry } from "../jobs/whitelist-expiry";
import { scheduleApplyPendingPrices } from "../jobs/apply-pending-prices";
import { scheduleSchemaDriftMonitor } from "../jobs/schema-drift-monitor";
import { quarterlyPriceReviewJob, deveExecutarHoje } from "../jobs/quarterly-price-review";
import { scheduleBackupAutomatico } from "../jobs/backup-automatico";
import { scheduleReenvioAutomatico } from "../jobs/reenvio-automatico";
import { scheduleAppHealthMonitor } from "../jobs/app-health-monitor";
import { scheduleTrialReminder } from "../jobs/trial-reminder";
import { handleStripeWebhook } from "./stripeWebhook";
import { handleGoogleOAuthCallback } from "../google-oauth-callback";
import { assistenteSSEHandler } from "../assistente-sse";
import { sugestoesSSEHandler } from "../sugestoes-sse";
import { tRPCRateLimiter, injectUserMiddleware } from "./rateLimiter";
import * as Sentry from "@sentry/node";
import { handleTRPCError, setUserContext } from "./sentry";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { getDb, warmUpDbPool } from "../db";

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

  // Security headers (Helmet) — deve vir antes de qualquer rota
  const isProduction = process.env.NODE_ENV === "production";
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://js.stripe.com",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com",
              ],
              styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com",
              ],
              imgSrc: ["'self'", "data:", "blob:", "https:"],
              fontSrc: [
                "'self'",
                "data:",
                "https://fonts.gstatic.com",
                "https://cdn.jsdelivr.net",
                "https://cdnjs.cloudflare.com",
              ],
              connectSrc: [
                "'self'",
                "https://api.stripe.com",
                "https://*.sentry.io",
                process.env.BUILT_IN_FORGE_API_URL || "",
                process.env.VITE_FRONTEND_FORGE_API_URL || "",
              ].filter(Boolean),
              frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
      // HSTS: 1 ano com subdomínios
      strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
      // Previne MIME sniffing
      xContentTypeOptions: true, // nosniff (padrão do Helmet)
      // Referrer policy restritiva
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      // Cross-Origin policies permissivas para assets CDN (KaTeX, pdfjs, etc.)
      crossOriginEmbedderPolicy: false,
      // Previne clickjacking
      xFrameOptions: { action: "deny" },
    })
  );

  // Health check endpoint — usado pelo Railway, Render e load balancers
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

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
  // Sugestões automáticas de prompts por estratégia (SSE)
  app.get("/api/assistente/sugestoes", sugestoesSSEHandler);
  // Middleware do Sentry para capturar requisições (versão 10.x não requer handlers manuais)
  // O Sentry 10.x captura automaticamente via integração expressIntegration()
  
  // ─── CI Webhook Endpoints ──────────────────────────────────────────────
  app.post("/api/ci/audit", async (req, res) => {
    const { handleCIAuditWebhook } = await import("../api/ci-audit");
    return handleCIAuditWebhook(req, res);
  });

  // ─── Scheduled Task Endpoints ───────────────────────────────────────────
  // Endpoint para processar emails de onboarding pendentes (chamado por scheduled task)
  app.post("/api/scheduled/onboarding", async (req, res) => {
    try {
      const { processOnboardingEmails } = await import("../onboarding-drip");
      const result = await processOnboardingEmails();
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("[Scheduled] Erro ao processar onboarding:", err);
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Endpoint para atualizar preços dos planos e pacotes de créditos (chamado por scheduled task mensal)
  app.post("/api/scheduled/update-prices", async (req, res) => {
    try {
      const { immediate } = req.body;
      if (immediate) {
        // Aplicação imediata (sem aviso prévio) — usado apenas para ajustes mínimos ou reversões
        const { updatePrices } = await import("../scheduled/update-prices");
        const result = await updatePrices(req.body);
        res.json({ success: true, ...result });
      } else {
        // Fluxo padrão: criar aviso prévio de 30 dias (CDC Art. 6º)
        const { createPriceChangeNotice } = await import("../scheduled/price-change-notice");
        const { PLANS, CREDIT_PACKAGES } = await import("../stripe-products");
        const updates = req.body.updates || [];
        const results = [];
        for (const update of updates) {
          if (update.planId) {
            const plan = PLANS[update.planId];
            if (!plan) continue;
            const result = await createPriceChangeNotice({
              entityType: "plan",
              entityId: update.planId,
              currentPrice: plan.priceMonthly,
              newPrice: update.newPriceMonthly ?? plan.priceMonthly,
              adjustmentPercent: update.adjustmentPercent ?? ((update.newPriceMonthly - plan.priceMonthly) / plan.priceMonthly * 100),
              reason: update.reason,
              source: req.body.source || "scheduled_task",
            });
            results.push(result);
          } else if (update.packageId) {
            const pkg = CREDIT_PACKAGES.find((p: any) => p.id === update.packageId);
            if (!pkg) continue;
            const result = await createPriceChangeNotice({
              entityType: "credit_package",
              entityId: update.packageId,
              currentPrice: pkg.priceInCents,
              newPrice: update.newPriceInCents ?? pkg.priceInCents,
              adjustmentPercent: update.adjustmentPercent ?? ((update.newPriceInCents - pkg.priceInCents) / pkg.priceInCents * 100),
              reason: update.reason,
              source: req.body.source || "scheduled_task",
            });
            results.push(result);
          }
        }
        res.json({ success: true, mode: "notice_30_days", notices: results });
      }
    } catch (err: any) {
      console.error("[Scheduled] Erro ao atualizar preços:", err);
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Endpoint para aplicar reajustes pendentes (executado diariamente)
  app.post("/api/scheduled/apply-pending-prices", async (req, res) => {
    try {
      const { applyPendingPriceChanges } = await import("../scheduled/price-change-notice");
      const result = await applyPendingPriceChanges();
      res.json({ success: true, ...result });
    } catch (err: any) {
      console.error("[Scheduled] Erro ao aplicar reajustes pendentes:", err);
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Endpoint para processar tickets de suporte (status)
  app.get("/api/scheduled/health", (_req, res) => {
    res.json({ status: "ok", service: "promptjur-scheduled", timestamp: new Date().toISOString() });
  });

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
  const port = isProduction ? preferredPort : await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  console.log(`[boot] Iniciando servidor na porta ${port}...`);
  // Servidor inicia PRIMEIRO para o healthcheck passar imediatamente
  await new Promise<void>((resolve) => {
    server.listen(port, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${port}/`);
      resolve();
    });
  });

  // Warm-up do pool de conexões (evita cold start de 6s+ no primeiro request)
  warmUpDbPool();

  // Agendar jobs
  scheduleCacheCleanup();
  scheduleWhitelistExpiry();
  scheduleApplyPendingPrices(); // Aplica reajustes pendentes após 30 dias de aviso prévio (CDC Art. 6º)
  scheduleSchemaDriftMonitor(); // Monitora divergência entre schema Drizzle e banco de produção
  scheduleAppHealthMonitor(); // Monitora heap, event loop lag e DB latency a cada 60s
  scheduleTrialReminder(); // Envia lembretes de trial expirando em 1-3 dias (09h00 Brasília)

  // Revisão trimestral de preços (1º dia de jan/abr/jul/out)
  if (deveExecutarHoje()) {
    quarterlyPriceReviewJob();
  }
  // Verificação diária às 06:00 para garantir execução mesmo após restart
  setInterval(() => {
    if (deveExecutarHoje()) {
      quarterlyPriceReviewJob();
    }
  }, 6 * 60 * 60 * 1000); // a cada 6 horas

  // Migração roda depois que o servidor já está ouvindo (não bloqueia healthcheck)
  if (process.env.DATABASE_URL) {
    runMigrations().catch((err) =>
      console.error("[Migration] Erro ao migrar — a app continua rodando:", err)
    );
  } else {
    console.warn("[Migration] DATABASE_URL não definida — pulando migração");
  }
}

async function runMigrations() {
  console.log("[Migration] Iniciando...");
  const db = await getDb();
  if (!db) { console.error("[Migration] DB indisponível"); return; }
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  await migrate(db, { migrationsFolder });
  console.log("[Migration] Concluída com sucesso");
}

startServer().catch((err) => {
  console.error("[boot] FATAL — servidor falhou ao iniciar:", err);
  process.exit(1);
});
