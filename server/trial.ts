/**
 * trial.ts — Gerenciamento do período de trial de 7 dias
 *
 * Fluxo:
 *  1. Novo usuário se cadastra → ativa trial de 7 dias automaticamente
 *  2. Durante o trial, o usuário tem acesso equivalente ao plano Pro
 *  3. Após 7 dias, se não assinou, o acesso é rebaixado para Free
 *  4. O trial só pode ser usado uma vez por usuário (trialUsed = true)
 *
 * Integração:
 *  - quota.ts: durante o trial, usa limites do plano Pro
 *  - plan-access.ts: durante o trial, modelos Pro ficam disponíveis
 *  - stripeWebhook.ts: ao assinar, trialUsed = true (não reativa)
 */

import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "../drizzle/schema";

/** Duração do trial em dias */
export const TRIAL_DURATION_DAYS = 7;

/** Status do trial de um usuário */
export interface TrialStatus {
  /** Se o trial está ativo agora */
  isActive: boolean;
  /** Data de término do trial (null se nunca teve) */
  endsAt: Date | null;
  /** Dias restantes (0 se expirado ou sem trial) */
  daysRemaining: number;
  /** Horas restantes no último dia */
  hoursRemaining: number;
  /** Se o trial já foi usado (não pode reativar) */
  trialUsed: boolean;
  /** Se o usuário já tem um plano pago (não precisa de trial) */
  hasPaidPlan: boolean;
}

/**
 * Ativa o trial de 7 dias para um novo usuário.
 * Só ativa se o usuário nunca usou o trial antes.
 */
export async function activateTrial(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const [user] = await db
    .select({
      id: users.id,
      trialUsed: users.trialUsed,
      trialEndsAt: users.trialEndsAt,
      subscriptionPlan: users.subscriptionPlan,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return false;

  // Não ativar se já usou o trial ou já tem plano pago
  if (user.trialUsed || user.subscriptionPlan !== "free") return false;

  // Não ativar se já tem trial ativo
  if (user.trialEndsAt && new Date(user.trialEndsAt) > new Date()) return false;

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);

  await db
    .update(users)
    .set({
      trialEndsAt: trialEnd,
      trialUsed: true,
    })
    .where(eq(users.id, userId));

  console.log(`[Trial] Activated ${TRIAL_DURATION_DAYS}-day trial for user ${userId}, ends at ${trialEnd.toISOString()}`);
  return true;
}

/**
 * Retorna o status do trial de um usuário.
 */
export async function getTrialStatus(userId: number): Promise<TrialStatus> {
  const db = await getDb();
  if (!db) {
    return { isActive: false, endsAt: null, daysRemaining: 0, hoursRemaining: 0, trialUsed: false, hasPaidPlan: false };
  }

  const [user] = await db
    .select({
      trialEndsAt: users.trialEndsAt,
      trialUsed: users.trialUsed,
      subscriptionPlan: users.subscriptionPlan,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return { isActive: false, endsAt: null, daysRemaining: 0, hoursRemaining: 0, trialUsed: false, hasPaidPlan: false };
  }

  const hasPaidPlan = user.subscriptionPlan !== "free";

  if (!user.trialEndsAt) {
    return { isActive: false, endsAt: null, daysRemaining: 0, hoursRemaining: 0, trialUsed: user.trialUsed, hasPaidPlan };
  }

  const now = new Date();
  const endsAt = new Date(user.trialEndsAt);
  const diffMs = endsAt.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { isActive: false, endsAt, daysRemaining: 0, hoursRemaining: 0, trialUsed: user.trialUsed, hasPaidPlan };
  }

  const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hoursRemaining = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return {
    isActive: true,
    endsAt,
    daysRemaining,
    hoursRemaining,
    trialUsed: user.trialUsed,
    hasPaidPlan,
  };
}

/**
 * Verifica se o usuário está em período de trial ativo.
 * Usado pelo quota.ts e plan-access.ts para conceder acesso Pro temporário.
 */
export async function isTrialActive(userId: number): Promise<boolean> {
  const status = await getTrialStatus(userId);
  return status.isActive && !status.hasPaidPlan;
}

/**
 * Retorna o plano efetivo do usuário (considerando trial).
 * Se o trial está ativo e o plano é free, retorna "pro".
 */
export async function getEffectivePlan(userId: number, currentPlan: string): Promise<string> {
  if (currentPlan !== "free") return currentPlan;

  const trialActive = await isTrialActive(userId);
  return trialActive ? "pro" : "free";
}
