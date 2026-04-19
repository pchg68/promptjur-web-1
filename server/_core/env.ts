import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default(""),
  JWT_SECRET: z.string().default("dev-secret-change-in-production"),
  OAUTH_SERVER_URL: z.string().default(""),

  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  VITE_APP_ID: z.string().default(""),
  OWNER_OPEN_ID: z.string().default(""),
  BUILT_IN_FORGE_API_URL: z.string().default(""),
  BUILT_IN_FORGE_API_KEY: z.string().default(""),
  STRIPE_SECRET_KEY: z.string().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),

  RESEND_API_KEY: z.string().default(""),
  EMAIL_FROM: z.string().default(""),
  ADMIN_EMAIL: z.string().default(""),

  VITE_APP_URL: z.string().default("https://promptjur.com"),
  SENTRY_DSN: z.string().default(""),
});

const parsed = envSchema.parse(process.env);

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
