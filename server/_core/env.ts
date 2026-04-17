import { z } from "zod";

const envSchema = z.object({
  // Obrigatórias em produção
  DATABASE_URL: z.string().min(1, "DATABASE_URL é obrigatória"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET deve ter ao menos 16 caracteres"),
  OAUTH_SERVER_URL: z.string().url("OAUTH_SERVER_URL deve ser uma URL válida").or(z.string().min(1)),

  // Opcionais com defaults
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  VITE_APP_ID: z.string().default(""),
  OWNER_OPEN_ID: z.string().default(""),
  BUILT_IN_FORGE_API_URL: z.string().default(""),
  BUILT_IN_FORGE_API_KEY: z.string().default(""),
  STRIPE_SECRET_KEY: z.string().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
    // Em produção falha hard; em dev/test apenas avisa
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Variáveis de ambiente inválidas:\n${missing}`);
    } else {
      console.warn(`[env] Aviso — variáveis ausentes ou inválidas:\n${missing}`);
    }
    // Retorna com defaults para não quebrar dev
    return envSchema.parse({ ...envSchema.parse({}), ...process.env } as any);
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
};
