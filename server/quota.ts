/**
 * quota.ts — Controle de quota mensal por plano
 *
 * Responsabilidades:
 *  1. Verificar se o usuário ainda tem operações disponíveis no mês corrente
 *  2. Incrementar o contador após cada operação bem-sucedida
 *  3. Resetar o contador quando o mês vira
 *
 * Limites por plano (espelha stripe-products.ts):
 *  - free:       20 operações/mês
 *  - pro:       300 operações/mês
 *  - enterprise: ilimitado (-1)
 */

import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { PLANS } from "./stripe-products";

/** Retorna o limite mensal do plano (−1 = ilimitado) */
export function getPlanMonthlyLimit(plan: string): number {
  return PLANS[plan]?.limits?.promptsPerMonth ?? 20;
}

/**
 * Verifica se o usuário pode executar mais uma operação.
 * Reseta o contador automaticamente se o mês mudou desde o último reset.
 * Lança TRPCError FORBIDDEN se o limite foi atingido.
 */
export async function checkPlanQuota(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return; // sem banco → não bloqueia (ambiente de dev)

  const [user] = await db
    .select({
      id: users.id,
      subscriptionPlan: users.subscriptionPlan,
      usageCount: users.usageCount,
      bonusCredits: users.bonusCredits,
      monthlyUsageResetAt: users.monthlyUsageResetAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return;

  // ── Reset mensal automático ──────────────────────────────────────────────
  const now = new Date();
  const resetAt = new Date(user.monthlyUsageResetAt);
  const sameMonth =
    now.getFullYear() === resetAt.getFullYear() &&
    now.getMonth() === resetAt.getMonth();

  if (!sameMonth) {
    // Novo mês: zerar contador e atualizar data de reset
    await db
      .update(users)
      .set({ usageCount: 0, monthlyUsageResetAt: now })
      .where(eq(users.id, userId));
    return; // acabou de resetar → pode executar
  }

  // ── Verificar limite ─────────────────────────────────────────────────────
  const limit = getPlanMonthlyLimit(user.subscriptionPlan);
  if (limit === -1) return; // ilimitado

  if (user.usageCount >= limit) {
    // Verificar se tem créditos bônus disponíveis
    const bonusCredits = (user as any).bonusCredits ?? 0;
    if (bonusCredits > 0) {
      return; // Tem créditos extras, pode continuar
    }

    const planName =
      user.subscriptionPlan === "free"
        ? "Gratuito"
        : user.subscriptionPlan === "pro"
        ? "Profissional"
        : "Escritório";

    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Você atingiu o limite de ${limit} operações mensais do plano ${planName}. Adquira créditos extras ou faça upgrade para continuar usando o PromptJur.`,
    });
  }
}

/**
 * Incrementa o contador de uso do usuário em +1.
 * Deve ser chamado APÓS a operação ser concluída com sucesso.
 */
export async function incrementQuota(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const [user] = await db
    .select({
      usageCount: users.usageCount,
      bonusCredits: users.bonusCredits,
      subscriptionPlan: users.subscriptionPlan,
      monthlyUsageResetAt: users.monthlyUsageResetAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return;

  // Verificar se está além do limite do plano (usando créditos bônus)
  const limit = getPlanMonthlyLimit(user.subscriptionPlan);
  const now = new Date();
  const resetAt = new Date(user.monthlyUsageResetAt);
  const sameMonth = now.getFullYear() === resetAt.getFullYear() && now.getMonth() === resetAt.getMonth();
  const currentUsage = sameMonth ? user.usageCount : 0;

  if (limit !== -1 && currentUsage >= limit && user.bonusCredits > 0) {
    // Consumir crédito bônus em vez de incrementar usage
    await db
      .update(users)
      .set({ bonusCredits: user.bonusCredits - 1 })
      .where(eq(users.id, userId));
  } else {
    // Incrementar usage normal
    await db
      .update(users)
      .set({ usageCount: user.usageCount + 1 })
      .where(eq(users.id, userId));
  }
}

/**
 * Retorna o resumo de uso do usuário para exibição no frontend.
 */
export async function getUserQuotaSummary(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const [user] = await db
    .select({
      subscriptionPlan: users.subscriptionPlan,
      usageCount: users.usageCount,
      bonusCredits: users.bonusCredits,
      monthlyUsageResetAt: users.monthlyUsageResetAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  const limit = getPlanMonthlyLimit(user.subscriptionPlan);
  const now = new Date();

  // Calcular próximo reset (1º dia do próximo mês)
  const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Verificar se precisa resetar
  const resetAt = new Date(user.monthlyUsageResetAt);
  const sameMonth =
    now.getFullYear() === resetAt.getFullYear() &&
    now.getMonth() === resetAt.getMonth();
  const currentUsage = sameMonth ? user.usageCount : 0;
  const totalAvailable = limit === -1 ? -1 : limit + (user.bonusCredits ?? 0);

  return {
    plan: user.subscriptionPlan,
    usageCount: currentUsage,
    limit,
    bonusCredits: user.bonusCredits ?? 0,
    totalAvailable,
    remaining: totalAvailable === -1 ? -1 : Math.max(0, totalAvailable - currentUsage),
    percentUsed: limit === -1 ? 0 : Math.min(100, Math.round((currentUsage / limit) * 100)),
    nextResetAt: nextReset,
    isUnlimited: limit === -1,
  };
}
