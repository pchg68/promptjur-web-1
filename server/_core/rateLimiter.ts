import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sdk } from "./sdk";

/**
 * Limites de requisições por plano
 */
export const RATE_LIMITS = {
  free: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 1000, // 1000 requisições por hora (aumentado para desenvolvimento)
    dailyMax: 5000, // 5000 requisições por dia (aumentado para desenvolvimento)
  },
  pro: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 100, // 100 requisições por hora
    dailyMax: 1000, // 1000 requisições por dia
  },
  enterprise: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: Infinity, // Ilimitado
    dailyMax: Infinity, // Ilimitado
  },
} as const;

/**
 * Obtém o plano do usuário baseado no email ou openId
 */
async function getUserPlan(userIdentifier: string): Promise<"free" | "pro" | "enterprise"> {
  const db = await getDb();
  if (!db) {
    console.warn("[RateLimiter] Database not available, defaulting to free plan");
    return "free";
  }

  try {
    // Tentar buscar por email primeiro
    const userByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, userIdentifier))
      .limit(1);

    if (userByEmail.length > 0) {
      return userByEmail[0].subscriptionPlan;
    }

    // Tentar buscar por openId
    const userByOpenId = await db
      .select()
      .from(users)
      .where(eq(users.openId, userIdentifier))
      .limit(1);

    if (userByOpenId.length > 0) {
      return userByOpenId[0].subscriptionPlan;
    }

    // Usuário não encontrado, retornar plano gratuito
    return "free";
  } catch (error) {
    console.error("[RateLimiter] Error fetching user plan:", error);
    return "free";
  }
}

/**
 * Middleware de rate limiting baseado no plano do usuário
 */
export const createRateLimiter = () => {
  return rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora (será ajustado dinamicamente)
    
    // Função para determinar o limite baseado no usuário
    max: async (req: Request) => {
      // Extrair identificador do usuário (pode vir do contexto tRPC ou header)
      const userEmail = (req as any).user?.email || req.headers["x-user-email"];
      const userOpenId = (req as any).user?.openId || req.headers["x-user-openid"];
      
      const userIdentifier = userEmail || userOpenId;
      
      if (!userIdentifier) {
        console.warn("[RateLimiter] No user identifier found, applying free plan limits");
        return RATE_LIMITS.free.max;
      }

      const plan = await getUserPlan(userIdentifier as string);
      const limit = RATE_LIMITS[plan].max;
      
      console.log(`[RateLimiter] User ${userIdentifier} (plan: ${plan}) - limit: ${limit}/hour`);
      
      return limit;
    },

    // Mensagem de erro quando limite é excedido
    handler: (req: Request, res: Response) => {
      const userEmail = (req as any).user?.email || req.headers["x-user-email"];
      const plan = (req as any).user?.subscriptionPlan || "free";
      
      console.warn(`[RateLimiter] Rate limit exceeded for user: ${userEmail} (plan: ${plan})`);
      
      res.status(429).json({
        error: "Too Many Requests",
        message: `Você excedeu o limite de requisições do plano ${plan}. Por favor, aguarde antes de tentar novamente ou considere fazer upgrade para um plano superior.`,
        plan,
        limits: RATE_LIMITS[plan as keyof typeof RATE_LIMITS],
        retryAfter: res.getHeader("Retry-After"),
      });
    },

    // Não aplicar rate limiting em ambiente de desenvolvimento
    skip: (req: Request) => {
      return process.env.NODE_ENV === "development" && req.headers["x-skip-rate-limit"] === "true";
    },

    // Headers padrão
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
};

/**
 * Middleware para injetar usuário autenticado no request antes do rate limiter
 */
export async function injectUserMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (user) {
      (req as any).user = user;
    }
  } catch (error) {
    // Usuário não autenticado, continuar sem user
  }
  next();
}

/**
 * Middleware específico para rotas tRPC
 * Extrai informações do usuário do contexto tRPC
 */
export const tRPCRateLimiter = createRateLimiter();
