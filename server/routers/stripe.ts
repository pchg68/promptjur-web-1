import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { stripe } from "../_core/stripe";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { PLANS, formatPrice } from "../stripe-products";
import { TRPCError } from "@trpc/server";

export const stripeRouter = router({
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

      const origin = ctx.req.headers.origin || "https://promptjur.manus.space";

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

    const origin = ctx.req.headers.origin || "https://promptjur.manus.space";

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
