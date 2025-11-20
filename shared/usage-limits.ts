/**
 * Sistema de Limites de Uso por Plano de Assinatura
 * 
 * Define limites de uso para cada plano e fornece funções
 * para verificar e incrementar contadores de uso.
 */

export const USAGE_LIMITS = {
  free: {
    maxAnalyses: 10,
    maxGenerations: 5,
    maxOptimizations: 5,
    totalLimit: 20, // Limite total mensal
  },
  pro: {
    maxAnalyses: 100,
    maxGenerations: 100,
    maxOptimizations: 100,
    totalLimit: 300,
  },
  enterprise: {
    maxAnalyses: Infinity,
    maxGenerations: Infinity,
    maxOptimizations: Infinity,
    totalLimit: Infinity,
  },
} as const;

export type SubscriptionPlan = keyof typeof USAGE_LIMITS;

export interface UsageLimitError {
  exceeded: true;
  plan: SubscriptionPlan;
  currentUsage: number;
  limit: number;
  message: string;
}

export interface UsageLimitSuccess {
  exceeded: false;
  plan: SubscriptionPlan;
  currentUsage: number;
  limit: number;
  remaining: number;
}

export type UsageLimitResult = UsageLimitError | UsageLimitSuccess;

/**
 * Verifica se o usuário atingiu o limite de uso
 */
export function checkUsageLimit(
  plan: SubscriptionPlan,
  currentUsage: number
): UsageLimitResult {
  const limit = USAGE_LIMITS[plan].totalLimit;

  if (currentUsage >= limit) {
    return {
      exceeded: true,
      plan,
      currentUsage,
      limit,
      message: `Você atingiu o limite de ${limit} operações do plano ${plan}. Faça upgrade para continuar.`,
    };
  }

  return {
    exceeded: false,
    plan,
    currentUsage,
    limit,
    remaining: limit - currentUsage,
  };
}

/**
 * Mensagens de erro personalizadas por plano
 */
export function getUpgradeMessage(plan: SubscriptionPlan): string {
  if (plan === "free") {
    return "Você atingiu o limite do plano gratuito. Faça upgrade para o plano Pro e tenha acesso a 300 operações mensais!";
  }
  if (plan === "pro") {
    return "Você atingiu o limite do plano Pro. Faça upgrade para o plano Enterprise e tenha acesso ilimitado!";
  }
  return "Entre em contato com o suporte para aumentar seu limite.";
}
