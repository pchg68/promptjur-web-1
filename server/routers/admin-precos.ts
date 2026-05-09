/**
 * Admin Preços Router — PromptJur
 * 
 * Endpoints administrativos para gerenciar price overrides:
 * - Listar overrides ativos
 * - Histórico de ajustes (com paginação)
 * - Reverter para preço base
 * - Aplicar ajuste manual
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { eq, desc, and, sql } from "drizzle-orm";
import { getDb } from "../db";
import { priceOverrides } from "../../drizzle/schema";
import { PLANS, CREDIT_PACKAGES } from "../stripe-products";
import { updatePrices, getEffectivePlanPrice, getEffectiveCreditPrice } from "../scheduled/update-prices";
import { createPriceChangeNotice, cancelPriceChangeNotice, listPriceChangeNotices } from "../scheduled/price-change-notice";
import { notifyOwner } from "../_core/notification";
import { priceChangeNotices } from "../../drizzle/schema";

// Middleware admin
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso restrito a administradores.",
    });
  }
  return next({ ctx });
});

export const adminPrecosRouter = router({
  /**
   * Lista todos os overrides ativos com comparação ao preço base
   */
  listarOverrides: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const overrides = await db.select().from(priceOverrides).orderBy(desc(priceOverrides.appliedAt));

    // Enriquecer com preço base para comparação
    return overrides.map((o) => {
      let precoBase: number | null = null;
      let nome = o.entityId;

      if (o.entityType === "plan") {
        const plan = PLANS[o.entityId];
        if (plan) {
          precoBase = plan.priceMonthly;
          nome = plan.name;
        }
      } else if (o.entityType === "credit_package") {
        const pkg = CREDIT_PACKAGES.find((p) => p.id === o.entityId);
        if (pkg) {
          precoBase = pkg.priceInCents;
          nome = pkg.name;
        }
      }

      return {
        ...o,
        nome,
        precoBase,
        diferencaPercent: precoBase && o.priceMonthly
          ? (((o.priceMonthly - precoBase) / precoBase) * 100).toFixed(2)
          : o.adjustmentPercent?.toString() ?? "0",
      };
    });
  }),

  /**
   * Retorna resumo dos preços atuais (base + override efetivo)
   */
  resumoPrecos: adminProcedure.query(async () => {
    const planos = await Promise.all(
      Object.entries(PLANS)
        .filter(([id]) => id !== "free" && id !== "enterprise")
        .map(async ([id, plan]) => {
          const effective = await getEffectivePlanPrice(id);
          return {
            id,
            nome: plan.name,
            tipo: "plan" as const,
            precoBase: plan.priceMonthly,
            precoEfetivo: effective?.monthly ?? plan.priceMonthly,
            precoBaseAnual: plan.priceYearly,
            precoEfetivoAnual: effective?.yearly ?? plan.priceYearly,
            temOverride: effective?.monthly !== plan.priceMonthly,
          };
        })
    );

    const pacotes = await Promise.all(
      CREDIT_PACKAGES.map(async (pkg) => {
        const effective = await getEffectiveCreditPrice(pkg.id);
        return {
          id: pkg.id,
          nome: pkg.name,
          tipo: "credit_package" as const,
          creditos: pkg.credits,
          precoBase: pkg.priceInCents,
          precoEfetivo: effective?.priceInCents ?? pkg.priceInCents,
          precoPorCreditoBase: pkg.pricePerCredit,
          precoPorCreditoEfetivo: effective?.pricePerCredit ?? pkg.pricePerCredit,
          temOverride: effective?.priceInCents !== pkg.priceInCents,
        };
      })
    );

    return { planos, pacotes };
  }),

  /**
   * Reverte um override para o preço base (remove o override)
   */
  reverter: adminProcedure
    .input(z.object({
      entityType: z.enum(["plan", "credit_package"]),
      entityId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database indisponível" });

      const deleted = await db
        .delete(priceOverrides)
        .where(
          and(
            eq(priceOverrides.entityType, input.entityType),
            eq(priceOverrides.entityId, input.entityId)
          )
        );

      // Notificar owner
      const nome = input.entityType === "plan"
        ? PLANS[input.entityId]?.name ?? input.entityId
        : CREDIT_PACKAGES.find(p => p.id === input.entityId)?.name ?? input.entityId;

      await notifyOwner({
        title: "💰 Override de Preço Revertido",
        content: `O override de preço para "${nome}" (${input.entityType}) foi removido manualmente. O preço voltou ao valor base definido no código.`,
      });

      return { success: true, message: `Override removido para ${nome}` };
    }),

  /**
   * Aplica ajuste manual de preço
   */
  ajustarManual: adminProcedure
    .input(z.object({
      entityType: z.enum(["plan", "credit_package"]),
      entityId: z.string(),
      novoPreco: z.number().min(100), // mínimo R$ 1,00
      motivo: z.string().min(3),
    }))
    .mutation(async ({ input }) => {
      const updates = [];

      if (input.entityType === "plan") {
        updates.push({
          planId: input.entityId,
          newPriceMonthly: input.novoPreco,
          reason: `Ajuste manual: ${input.motivo}`,
        });
      } else {
        updates.push({
          packageId: input.entityId,
          newPriceInCents: input.novoPreco,
          reason: `Ajuste manual: ${input.motivo}`,
        });
      }

      const result = await updatePrices({
        updates,
        source: "manual",
        referenceMonth: new Date().toISOString().slice(0, 7),
      });

      if (result.errors.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.errors.join("; "),
        });
      }

      // Notificar owner
      const nome = input.entityType === "plan"
        ? PLANS[input.entityId]?.name ?? input.entityId
        : CREDIT_PACKAGES.find(p => p.id === input.entityId)?.name ?? input.entityId;

      await notifyOwner({
        title: "💰 Ajuste Manual de Preço",
        content: `Preço de "${nome}" ajustado manualmente para R$ ${(input.novoPreco / 100).toFixed(2)}. Motivo: ${input.motivo}`,
      });

      return { success: true, result };
    }),

  /**
   * Listar avisos prévios de reajuste (CDC Art. 6º)
   */
  listarAvisos: adminProcedure.query(async () => {
    return listPriceChangeNotices(50);
  }),

  /**
   * Cancelar um aviso pendente (antes da vigência)
   */
  cancelarAviso: adminProcedure
    .input(z.object({ noticeId: z.number() }))
    .mutation(async ({ input }) => {
      const success = await cancelPriceChangeNotice(input.noticeId);
      if (!success) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Aviso não encontrado ou já não está pendente.",
        });
      }
      await notifyOwner({
        title: "❌ Aviso de Reajuste Cancelado",
        content: `Aviso prévio #${input.noticeId} foi cancelado pelo admin. O reajuste NÃO será aplicado.`,
      });
      return { success: true };
    }),

  /**
   * Criar aviso prévio manualmente (ajuste com 30 dias de antecedência)
   */
  criarAvisoManual: adminProcedure
    .input(z.object({
      entityType: z.enum(["plan", "credit_package"]),
      entityId: z.string(),
      novoPreco: z.number().min(100),
      motivo: z.string().min(3),
    }))
    .mutation(async ({ input }) => {
      let currentPrice: number;
      if (input.entityType === "plan") {
        const plan = PLANS[input.entityId];
        if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado" });
        currentPrice = plan.priceMonthly;
      } else {
        const pkg = CREDIT_PACKAGES.find(p => p.id === input.entityId);
        if (!pkg) throw new TRPCError({ code: "NOT_FOUND", message: "Pacote não encontrado" });
        currentPrice = pkg.priceInCents;
      }
      const adjustmentPercent = ((input.novoPreco - currentPrice) / currentPrice) * 100;
      const result = await createPriceChangeNotice({
        entityType: input.entityType,
        entityId: input.entityId,
        currentPrice,
        newPrice: input.novoPreco,
        adjustmentPercent,
        reason: input.motivo,
        source: "manual",
      });
      return result;
    }),

  /**
   * Cria aviso de teste com data de vigência em 2 minutos (apenas em ambiente de desenvolvimento)
   * Permite validar o fluxo completo: email enviado → scheduled task aplica → histórico atualizado
   */
  testarFluxoCompleto: adminProcedure
    .input(z.object({
      entityType: z.enum(["plan", "credit_package"]),
      entityId: z.string(),
      novoPreco: z.number().min(100),
    }))
    .mutation(async ({ input }) => {
      if (process.env.NODE_ENV === "production") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Teste de fluxo não disponível em produção.",
        });
      }

      let currentPrice: number;
      if (input.entityType === "plan") {
        const plan = PLANS[input.entityId];
        if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado" });
        currentPrice = plan.priceMonthly;
      } else {
        const pkg = CREDIT_PACKAGES.find(p => p.id === input.entityId);
        if (!pkg) throw new TRPCError({ code: "NOT_FOUND", message: "Pacote não encontrado" });
        currentPrice = pkg.priceInCents;
      }

      const adjustmentPercent = ((input.novoPreco - currentPrice) / currentPrice) * 100;

      // Criar notice com effectiveDate = agora + 2 minutos (para teste rápido)
      const effectiveDate = new Date(Date.now() + 2 * 60 * 1000);

      const { createPriceChangeNotice: createNotice } = await import("../scheduled/price-change-notice");
      const result = await createNotice({
        entityType: input.entityType,
        entityId: input.entityId,
        currentPrice,
        newPrice: input.novoPreco,
        adjustmentPercent,
        reason: "[TESTE] Validação do fluxo completo de aviso prévio",
        source: "manual",
        effectiveDateOverride: effectiveDate,
      });

      await notifyOwner({
        title: "🧪 Teste de Fluxo Iniciado",
        content: `Aviso de teste criado (ID #${result.noticeId}). Vigência em 2 minutos. O job diário aplicará o reajuste automaticamente.`,
      });

      return {
        ...result,
        effectiveDate,
        message: `Aviso de teste criado. O reajuste será aplicado em ~2 minutos pelo job diário.`,
      };
    }),

  /**
   * Histórico de todos os ajustes (com paginação)
   */
  historico: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { items: [], total: 0, page: 1, totalPages: 0 };

      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const offset = (page - 1) * limit;

      // Buscar total
      const countResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(priceOverrides);
      const total = Number(countResult[0]?.count ?? 0);

      // Buscar itens paginados
      const items = await db
        .select()
        .from(priceOverrides)
        .orderBy(desc(priceOverrides.appliedAt))
        .limit(limit)
        .offset(offset);

      // Enriquecer com nomes
      const enriched = items.map((item) => {
        let nome = item.entityId;
        if (item.entityType === "plan") {
          nome = PLANS[item.entityId]?.name ?? item.entityId;
        } else {
          nome = CREDIT_PACKAGES.find(p => p.id === item.entityId)?.name ?? item.entityId;
        }
        return { ...item, nome };
      });

      return {
        items: enriched,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }),
});
