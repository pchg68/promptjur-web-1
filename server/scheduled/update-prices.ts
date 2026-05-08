/**
 * Módulo de Atualização de Preços — PromptJur
 * 
 * Recebe novos preços via POST da scheduled task mensal e atualiza
 * o arquivo stripe-products.ts em runtime (via banco de dados).
 * 
 * Estratégia:
 * - Os preços base ficam em stripe-products.ts (código estático)
 * - A tabela `price_overrides` no banco permite sobrescrever preços dinamicamente
 * - O frontend e backend consultam getPlanPrice() que verifica overrides primeiro
 * - A scheduled task pesquisa IPCA/inflação e sugere ajustes mensais
 */

import { eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import { priceOverrides } from "../../drizzle/schema";
import { PLANS, CREDIT_PACKAGES } from "../stripe-products";
import { notifyOwner } from "../_core/notification";

export interface PriceUpdate {
  planId?: string;
  packageId?: string;
  newPriceMonthly?: number; // centavos BRL
  newPriceYearly?: number; // centavos BRL
  newPriceInCents?: number; // para pacotes de créditos
  reason?: string;
  adjustmentPercent?: number; // % de ajuste aplicado
}

export interface UpdatePricesInput {
  updates: PriceUpdate[];
  source?: string; // "ipca", "manual", "scheduled_task"
  referenceMonth?: string; // "2026-05" formato YYYY-MM
}

export interface UpdatePricesResult {
  applied: number;
  skipped: number;
  errors: string[];
  details: Array<{
    id: string;
    type: "plan" | "credit_package";
    oldPrice: number;
    newPrice: number;
    adjustmentPercent: number;
  }>;
}

/**
 * Aplica atualizações de preços no banco de dados.
 * Os preços são armazenados como overrides — o código estático não é alterado.
 */
export async function updatePrices(input: UpdatePricesInput): Promise<UpdatePricesResult> {
  const db = await getDb();
  if (!db) {
    return { applied: 0, skipped: 0, errors: ["Database not available"], details: [] };
  }

  const result: UpdatePricesResult = {
    applied: 0,
    skipped: 0,
    errors: [],
    details: [],
  };

  const updates = input.updates || [];
  const source = input.source || "scheduled_task";
  const referenceMonth = input.referenceMonth || new Date().toISOString().slice(0, 7);

  for (const update of updates) {
    try {
      if (update.planId) {
        // Atualizar preço de plano
        const plan = PLANS[update.planId];
        if (!plan) {
          result.errors.push(`Plano não encontrado: ${update.planId}`);
          result.skipped++;
          continue;
        }

        const oldPriceMonthly = plan.priceMonthly;
        const newPriceMonthly = update.newPriceMonthly ?? oldPriceMonthly;
        const newPriceYearly = update.newPriceYearly ?? Math.round(newPriceMonthly * 12 * 0.8); // 20% desconto anual

        // Validar limites (não permitir aumento > 30% ou redução > 50% de uma vez)
        const changePercent = ((newPriceMonthly - oldPriceMonthly) / oldPriceMonthly) * 100;
        if (changePercent > 30) {
          result.errors.push(`Plano ${update.planId}: aumento de ${changePercent.toFixed(1)}% excede limite de 30%`);
          result.skipped++;
          continue;
        }
        if (changePercent < -50) {
          result.errors.push(`Plano ${update.planId}: redução de ${changePercent.toFixed(1)}% excede limite de -50%`);
          result.skipped++;
          continue;
        }

        // Upsert no banco
        await db.insert(priceOverrides).values({
          entityType: "plan",
          entityId: update.planId,
          priceMonthly: newPriceMonthly,
          priceYearly: newPriceYearly,
          reason: update.reason || `Ajuste ${source} - ${referenceMonth}`,
          adjustmentPercent: update.adjustmentPercent ?? parseFloat(changePercent.toFixed(2)),
          source,
          referenceMonth,
          appliedAt: new Date(),
        }).onDuplicateKeyUpdate({
          set: {
            priceMonthly: newPriceMonthly,
            priceYearly: newPriceYearly,
            reason: update.reason || `Ajuste ${source} - ${referenceMonth}`,
            adjustmentPercent: update.adjustmentPercent ?? parseFloat(changePercent.toFixed(2)),
            source,
            referenceMonth,
            appliedAt: new Date(),
          },
        });

        result.applied++;
        result.details.push({
          id: update.planId,
          type: "plan",
          oldPrice: oldPriceMonthly,
          newPrice: newPriceMonthly,
          adjustmentPercent: parseFloat(changePercent.toFixed(2)),
        });

      } else if (update.packageId) {
        // Atualizar preço de pacote de créditos
        const pkg = CREDIT_PACKAGES.find(p => p.id === update.packageId);
        if (!pkg) {
          result.errors.push(`Pacote não encontrado: ${update.packageId}`);
          result.skipped++;
          continue;
        }

        const oldPrice = pkg.priceInCents;
        const newPrice = update.newPriceInCents ?? oldPrice;

        // Validar limites
        const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;
        if (changePercent > 30) {
          result.errors.push(`Pacote ${update.packageId}: aumento de ${changePercent.toFixed(1)}% excede limite de 30%`);
          result.skipped++;
          continue;
        }
        if (changePercent < -50) {
          result.errors.push(`Pacote ${update.packageId}: redução de ${changePercent.toFixed(1)}% excede limite de -50%`);
          result.skipped++;
          continue;
        }

        // Upsert no banco
        await db.insert(priceOverrides).values({
          entityType: "credit_package",
          entityId: update.packageId,
          priceInCents: newPrice,
          pricePerCredit: Math.round(newPrice / pkg.credits),
          reason: update.reason || `Ajuste ${source} - ${referenceMonth}`,
          adjustmentPercent: update.adjustmentPercent ?? parseFloat(changePercent.toFixed(2)),
          source,
          referenceMonth,
          appliedAt: new Date(),
        }).onDuplicateKeyUpdate({
          set: {
            priceInCents: newPrice,
            pricePerCredit: Math.round(newPrice / pkg.credits),
            reason: update.reason || `Ajuste ${source} - ${referenceMonth}`,
            adjustmentPercent: update.adjustmentPercent ?? parseFloat(changePercent.toFixed(2)),
            source,
            referenceMonth,
            appliedAt: new Date(),
          },
        });

        result.applied++;
        result.details.push({
          id: update.packageId,
          type: "credit_package",
          oldPrice,
          newPrice,
          adjustmentPercent: parseFloat(changePercent.toFixed(2)),
        });

      } else {
        result.errors.push("Update sem planId ou packageId");
        result.skipped++;
      }
    } catch (err: any) {
      result.errors.push(`Erro ao processar update: ${err?.message}`);
      result.skipped++;
    }
  }

  console.log(`[UpdatePrices] Resultado: ${result.applied} aplicados, ${result.skipped} ignorados, ${result.errors.length} erros`);

  // Notificar owner sobre ajustes aplicados
  if (result.applied > 0) {
    try {
      const detalhes = result.details
        .map(d => {
          const nome = d.type === "plan"
            ? PLANS[d.id]?.name ?? d.id
            : CREDIT_PACKAGES.find(p => p.id === d.id)?.name ?? d.id;
          const sinal = d.adjustmentPercent > 0 ? "+" : "";
          return `\u2022 ${nome}: R$ ${(d.oldPrice / 100).toFixed(2)} \u2192 R$ ${(d.newPrice / 100).toFixed(2)} (${sinal}${d.adjustmentPercent.toFixed(2)}%)`;
        })
        .join("\n");

      await notifyOwner({
        title: `\ud83d\udcb0 Ajuste de Pre\u00e7os Aplicado (${source})`,
        content: `${result.applied} pre\u00e7o(s) atualizado(s) em ${referenceMonth}.\n\nDetalhes:\n${detalhes}${result.errors.length > 0 ? `\n\n\u26a0\ufe0f Erros: ${result.errors.join("; ")}` : ""}\n\nFonte: ${source}\nAcesse /admin-precos para gerenciar.`,
      });
    } catch (notifErr) {
      console.warn("[UpdatePrices] Falha ao notificar owner:", notifErr);
    }
  }

  return result;
}

/**
 * Consulta o preço efetivo de um plano (override > estático)
 */
export async function getEffectivePlanPrice(planId: string): Promise<{ monthly: number; yearly: number } | null> {
  const db = await getDb();
  if (!db) return null;

  const override = await db
    .select()
    .from(priceOverrides)
    .where(eq(priceOverrides.entityId, planId))
    .limit(1);

  if (override.length > 0 && override[0].priceMonthly !== null) {
    return {
      monthly: override[0].priceMonthly,
      yearly: override[0].priceYearly ?? Math.round(override[0].priceMonthly * 12 * 0.8),
    };
  }

  const plan = PLANS[planId];
  if (!plan) return null;
  return { monthly: plan.priceMonthly, yearly: plan.priceYearly };
}

/**
 * Consulta o preço efetivo de um pacote de créditos (override > estático)
 */
export async function getEffectiveCreditPrice(packageId: string): Promise<{ priceInCents: number; pricePerCredit: number } | null> {
  const db = await getDb();
  if (!db) return null;

  const override = await db
    .select()
    .from(priceOverrides)
    .where(eq(priceOverrides.entityId, packageId))
    .limit(1);

  if (override.length > 0 && override[0].priceInCents !== null) {
    return {
      priceInCents: override[0].priceInCents,
      pricePerCredit: override[0].pricePerCredit ?? 0,
    };
  }

  const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
  if (!pkg) return null;
  return { priceInCents: pkg.priceInCents, pricePerCredit: pkg.pricePerCredit };
}

/**
 * Retorna todos os overrides ativos (para exibir no admin)
 */
export async function getAllPriceOverrides() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(priceOverrides);
}
