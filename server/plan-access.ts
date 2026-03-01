/**
 * Controle de acesso por plano para modelos de IA premium
 * 
 * Define quais modelos cada plano pode acessar e fornece
 * funções de verificação para uso nos routers tRPC.
 */

import { PLANS, type Plan } from "./stripe-products";

export type UserPlan = "free" | "pro" | "enterprise";

/**
 * Mapeamento de modelos para o plano mínimo necessário
 */
export const MODEL_PLAN_REQUIREMENTS: Record<string, UserPlan> = {
  // Modelos gratuitos (disponíveis para todos)
  "manus-default": "free",
  "gpt-4o-mini": "free",
  
  // Modelos Pro (requerem plano Profissional)
  "gpt-4o": "pro",
  "claude-sonnet": "pro",
  "claude-3.5-sonnet": "pro",
  "claude-3-5-sonnet": "pro",
  "gemini-pro": "pro",
  "gemini-1.5-pro": "pro",
  "gemini-flash": "pro",
  "gemini-2.0-flash": "pro",
  "gemini-2.0-flash-lite": "pro",
  "perplexity-sonar": "pro",
  "sonar": "pro",
  
  // Modelos Enterprise (requerem plano Escritório)
  "o1": "enterprise",
  "o1-mini": "enterprise",
  "o1-preview": "enterprise",
  "claude-opus": "enterprise",
  "claude-3-opus": "enterprise",
  "sonar-pro": "enterprise",
  "sonar-reasoning-pro": "enterprise",
  "sonar-reasoning": "enterprise",
  "gpt-4-turbo": "enterprise",
};

/**
 * Hierarquia de planos (para comparação)
 */
const PLAN_HIERARCHY: Record<UserPlan, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

/**
 * Verifica se um plano tem acesso a um modelo específico
 */
export function canAccessModel(userPlan: UserPlan, modelId: string): boolean {
  const requiredPlan = MODEL_PLAN_REQUIREMENTS[modelId] || "free";
  return PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan];
}

/**
 * Retorna o plano mínimo necessário para um modelo
 */
export function getRequiredPlan(modelId: string): UserPlan {
  return MODEL_PLAN_REQUIREMENTS[modelId] || "free";
}

/**
 * Retorna a lista de modelos disponíveis para um plano
 */
export function getModelsForPlan(userPlan: UserPlan): string[] {
  return Object.entries(MODEL_PLAN_REQUIREMENTS)
    .filter(([_, requiredPlan]) => PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan])
    .map(([modelId]) => modelId);
}

/**
 * Retorna informações de acesso para todos os modelos
 * (usado pelo frontend para exibir locks/badges)
 */
export function getModelAccessInfo(userPlan: UserPlan): Array<{
  modelId: string;
  requiredPlan: UserPlan;
  hasAccess: boolean;
  planLabel: string;
}> {
  const planLabels: Record<UserPlan, string> = {
    free: "Gratuito",
    pro: "Profissional",
    enterprise: "Escritório",
  };

  return Object.entries(MODEL_PLAN_REQUIREMENTS).map(([modelId, requiredPlan]) => ({
    modelId,
    requiredPlan,
    hasAccess: PLAN_HIERARCHY[userPlan] >= PLAN_HIERARCHY[requiredPlan],
    planLabel: planLabels[requiredPlan],
  }));
}

/**
 * Mensagem de erro para acesso negado
 */
export function getAccessDeniedMessage(modelId: string, userPlan: UserPlan): string {
  const requiredPlan = getRequiredPlan(modelId);
  const planLabels: Record<UserPlan, string> = {
    free: "Gratuito",
    pro: "Profissional (R$ 49,90/mês)",
    enterprise: "Escritório (R$ 149,90/mês)",
  };

  return `O modelo "${modelId}" requer o plano ${planLabels[requiredPlan]}. Seu plano atual é ${planLabels[userPlan]}. Faça upgrade para acessar este modelo.`;
}
