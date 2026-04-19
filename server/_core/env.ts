import { z } from "zod";

const envSchema = z.object({
  // Obrigatórias em produção
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET deve ter ao menos 16 caracteres").default("dev-secret-change-in-production"),

  // OAuth — opcional: sem ela o login OAuth fica desabilitado
  OAUTH_SERVER_URL: z.string().default(""),

  // Opcionais com defaults
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  VITE_APP_ID: z.string().default(""),
  OWNER_OPEN_ID: z.string().default(""),
  BUILT_IN_FORGE_API_URL: z.string().default(""),
  BUILT_IN_FORGE_API_KEY: z.string().default(""),
  STRIPE_SECRET_KEY: z.string().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),

  // E-mail (Resend)
  RESEND_API_KEY: z.string().default(""),
  EMAIL_FROM: z.string().default(""),
  ADMIN_EMAIL: z.string().default(""),

  // App URL e Sentry
  VITE_APP_URL: z.string().default("https://promptjur.com"),
  SENTRY_DSN: z.string().default(""),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
    console.error(`[env] ATENÇÃO — variáveis ausentes ou inválidas:\n${missing}`);
    // Nunca crasha aqui — deixa o servidor subir para o healthcheck passar
    // As rotas que precisam de DB/Auth falham individualmente com erro claro
    return result.data ?? (envSchema.parse({}) as any);
  }
  return result.data;
}

const parsed = loadEnv();

export const ENV = {
  appId: parsed.VITE_APP_ID,
  cookieSecret: parsed.JWT_SECRET,
  databaseUrl: parsed.DATABASE_URL,
  oAuthServerUrl: parsed.OAUTH_SERVER_URL,
  ownerOpenId: parsed.OWNER_OPEN_ID,
  isProduction: parsed.NODE_ENV === "production",
  forgeApiUrl: parsed.BUILT_IN_FORGE_API_URL,
  forgeApiKey: parsed.BUILT_IN_FORGE_API_KEY,
  stripeSecretKey: parsed.STRIPE_SECRET_KEY,
  stripeWebhookSecret: parsed.STRIPE_WEBHOOK_SECRET,
  resendApiKey: parsed.RESEND_API_KEY,
  emailFrom: parsed.EMAIL_FROM,
  adminEmail: parsed.ADMIN_EMAIL,
  appUrl: parsed.VITE_APP_URL,
  sentryDsn: parsed.SENTRY_DSN,
};
