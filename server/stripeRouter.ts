import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import Stripe from "stripe";

// Inicializar Stripe apenas se a chave estiver configurada
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-11-17.clover',
  });
}

export const stripeRouter = router({
  // Criar sessão de checkout
  createCheckoutSession: protectedProcedure
    .input(z.object({
      priceId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { priceId } = input;
      const user = ctx.user;

      if (!stripe) {
        throw new Error('Stripe não está configurado. Configure STRIPE_SECRET_KEY nas variáveis de ambiente.');
      }

      try {
        const session = await stripe.checkout.sessions.create({
          customer_email: user.email || undefined,
          client_reference_id: user.id.toString(),
          metadata: {
            user_id: user.id.toString(),
            customer_email: user.email || '',
            customer_name: user.name || '',
          },
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: 'subscription',
          allow_promotion_codes: true,
          success_url: `${ctx.req.headers.origin}/dashboard?payment=success`,
          cancel_url: `${ctx.req.headers.origin}/planos?payment=canceled`,
        });

        return { url: session.url };
      } catch (error) {
        console.error('[Stripe] Error creating checkout session:', error);
        throw new Error('Falha ao criar sessão de checkout');
      }
    }),

  // Obter portal do cliente
  createPortalSession: protectedProcedure
    .mutation(async ({ ctx }) => {
      const user = ctx.user;

      if (!stripe) {
        throw new Error('Stripe não está configurado. Configure STRIPE_SECRET_KEY nas variáveis de ambiente.');
      }

      if (!user.stripeCustomerId) {
        throw new Error('Nenhuma assinatura ativa encontrada');
      }

      try {
        const session = await stripe.billingPortal.sessions.create({
          customer: user.stripeCustomerId,
          return_url: `${ctx.req.headers.origin}/dashboard`,
        });

        return { url: session.url };
      } catch (error) {
        console.error('[Stripe] Error creating portal session:', error);
        throw new Error('Falha ao criar sessão do portal');
      }
    }),
});
