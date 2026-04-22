import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { stripe } from "../_core/stripe";
import { getDb } from "../db";
import { users, enterpriseLeads, launchInterests } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { PLANS, formatPrice } from "../stripe-products";
import { TRPCError } from "@trpc/server";
import { isFeatureEnabled } from "../feature-flags";
import { getUserQuotaSummary } from "../quota";

export const stripeRouter = router({
  /**
   * Retorna o resumo de quota do usuário autenticado
   * (operações usadas, restantes, próximo reset)
   */
  getMyUsage: protectedProcedure.query(async ({ ctx }) => {
    const summary = await getUserQuotaSummary(ctx.user.id);
    if (!summary) {
      return {
        plan: "free",
        usageCount: 0,
        limit: 20,
        remaining: 20,
        percentUsed: 0,
        nextResetAt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        isUnlimited: false,
      };
    }
    return summary;
  }),

  /**
   * Retorna se os pagamentos estão ativos (feature flag `pagamentos_ativos`)
   * Usado pelo frontend para mostrar/ocultar botões de checkout
   */
  getPagamentosAtivos: publicProcedure.query(async () => {
    const ativo = await isFeatureEnabled("pagamentos_ativos");
    return { ativo };
  }),

  /**
   * Registra interesse de e-mail para notificação de lançamento
   */
  registrarInteresse: publicProcedure
    .input(
      z.object({
        email: z.string().email("E-mail inválido"),
        nome: z.string().optional(),
        planoInteresse: z.enum(["pro", "enterprise", "qualquer"]).default("qualquer"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database indisponível" });

      try {
        await db.insert(launchInterests).values({
          email: input.email,
          nome: input.nome ?? null,
          planoInteresse: input.planoInteresse,
        });
      } catch (err: unknown) {
        // Erro de e-mail duplicado (unique constraint) — retorna sucesso silencioso
        const mysqlErr = err as { code?: string };
        if (mysqlErr?.code === "ER_DUP_ENTRY") {
          return { success: true, jaRegistrado: true };
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao registrar interesse" });
      }

      // Notificar owner sobre novo interessado
      try {
        const { notifyOwner } = await import("../_core/notification");
        await notifyOwner({
          title: `📧 Novo interessado no lançamento: ${input.email}`,
          content: [
            `**E-mail:** ${input.email}`,
            input.nome ? `**Nome:** ${input.nome}` : null,
            `**Plano de interesse:** ${input.planoInteresse}`,
            `Data: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
          ].filter(Boolean).join("\n"),
        });
      } catch { /* notificação não crítica */ }

      return { success: true, jaRegistrado: false };
    }),

  /**
   * Retorna os planos disponíveis
   */
  getPlans: publicProcedure.query(() => {
    return Object.values(PLANS).map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      priceMonthlyFormatted: formatPrice(plan.priceMonthly),
      priceYearlyFormatted: formatPrice(plan.priceYearly),
      priceYearlyMonthlyFormatted: formatPrice(Math.round(plan.priceYearly / 12)),
      features: plan.features,
      limits: plan.limits,
      popular: plan.popular || false,
      contactOnly: plan.contactOnly || false,
    }));
  }),

  /**
   * Retorna o plano atual do usuário
   */
  getCurrentPlan: protectedProcedure.query(async ({ ctx }) => {
    const planId = ctx.user.subscriptionPlan || "free";
    const plan = PLANS[planId];
    if (!plan) return { ...PLANS.free, currentPlan: true };
    return { ...plan, currentPlan: true };
  }),

  /**
   * Cria uma sessão de checkout do Stripe
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        planId: z.enum(["pro", "enterprise"]),
        billingPeriod: z.enum(["monthly", "yearly"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar se pagamentos estão ativos via feature flag
      const pagamentosAtivos = await isFeatureEnabled("pagamentos_ativos");
      if (!pagamentosAtivos) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "O sistema de pagamentos está temporariamente desativado. Em breve estará disponível!",
        });
      }

      const plan = PLANS[input.planId];
      if (!plan) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Plano não encontrado",
        });
      }

      const priceInCents =
        input.billingPeriod === "monthly"
          ? plan.priceMonthly
          : Math.round(plan.priceYearly / 12);

      const origin = ctx.req.headers.origin || process.env.VITE_APP_URL || "https://promptjur.com";

      try {
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          customer_email: ctx.user.email || undefined,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email || "",
            customer_name: ctx.user.name || "",
            plan_id: input.planId,
            billing_period: input.billingPeriod,
          },
          line_items: [
            {
              price_data: {
                currency: "brl",
                product_data: {
                  name: `PromptJur ${plan.name}`,
                  description: plan.description,
                },
                unit_amount: priceInCents,
                recurring: {
                  interval: input.billingPeriod === "monthly" ? "month" : "year",
                },
              },
              quantity: 1,
            },
          ],
          allow_promotion_codes: true,
          success_url: `${origin}/planos?success=true&plan=${input.planId}`,
          cancel_url: `${origin}/planos?canceled=true`,
        });

        return { checkoutUrl: session.url };
      } catch (error) {
        console.error("[Stripe] Error creating checkout session:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao criar sessão de checkout",
        });
      }
    }),

  /**
   * Cria um portal de gerenciamento de assinatura
   */
  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user?.stripeCustomerId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Nenhuma assinatura ativa encontrada. Assine um plano primeiro.",
      });
    }

    const origin = ctx.req.headers.origin || process.env.VITE_APP_URL || "https://promptjur.com";

    try {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${origin}/planos`,
      });

      return { portalUrl: portalSession.url };
    } catch (error) {
      console.error("[Stripe] Error creating portal session:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao criar portal de gerenciamento",
      });
    }
  }),

  /**
   * Recebe lead comercial para o plano Enterprise
   */
  enviarLeadEnterprise: publicProcedure
    .input(
      z.object({
        nome: z.string().min(2, "Nome obrigatório"),
        email: z.string().email("Email inválido"),
        escritorio: z.string().min(2, "Nome do escritório obrigatório"),
        numeroAdvogados: z.enum(["1-5", "6-20", "21-50", "51-100", "100+"]),
        areasPrincipais: z.string().optional(),
        mensagem: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { notifyOwner } = await import("../_core/notification");
      // Salvar lead no banco de dados para gestão comercial
      const db = await getDb();
      if (db) {
        try {
          await db.insert(enterpriseLeads).values({
            nome: input.nome,
            email: input.email,
            escritorio: input.escritorio,
            numeroAdvogados: input.numeroAdvogados,
            areasPrincipais: input.areasPrincipais ?? null,
            mensagem: input.mensagem ?? null,
            status: "pendente",
          });
        } catch (err) {
          console.error("[Enterprise Lead] Erro ao salvar no banco:", err);
        }
      }
      const conteudo = [
        `**Novo lead Enterprise recebido!**`,
        ``,
        `**Nome:** ${input.nome}`,
        `**Email:** ${input.email}`,
        `**Escritório:** ${input.escritorio}`,
        `**Nº de advogados:** ${input.numeroAdvogados}`,
        input.areasPrincipais ? `**Áreas principais:** ${input.areasPrincipais}` : null,
        input.mensagem ? `**Mensagem:** ${input.mensagem}` : null,
        ``,
        `Data: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
      ].filter(Boolean).join("\n");

      await notifyOwner({
        title: `🏢 Novo Lead Enterprise: ${input.escritorio}`,
        content: conteudo,
      });

      console.log(`[Enterprise Lead] ${input.escritorio} (${input.email}) - ${input.numeroAdvogados} advogados`);
      return { success: true };
    }),

  /**
   * Cancela a assinatura do usuário
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user?.stripeSubscriptionId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Nenhuma assinatura ativa para cancelar",
      });
    }

    try {
      // Cancelar no final do período atual
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      return { success: true, message: "Assinatura será cancelada no final do período atual" };
    } catch (error) {
      console.error("[Stripe] Error canceling subscription:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Erro ao cancelar assinatura",
      });
    }
  }),
});
