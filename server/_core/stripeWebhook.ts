import { Request, Response } from 'express';
import Stripe from 'stripe';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

// Inicializar Stripe apenas se a chave estiver configurada
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-11-17.clover',
  });
}

export async function handleStripeWebhook(req: Request, res: Response) {
  if (!stripe) {
    console.error('[Stripe Webhook] Stripe não configurado');
    return res.status(500).json({ error: 'Stripe não configurado' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('[Stripe Webhook] Assinatura ou secret ausente');
    return res.status(400).json({ error: 'Webhook signature ou secret ausente' });
  }

  let event: Stripe.Event;

  try {
    // Verificar assinatura do webhook
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error(`[Stripe Webhook] Erro na verificação: ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`[Stripe Webhook] Evento recebido: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Evento não tratado: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error(`[Stripe Webhook] Erro ao processar evento: ${error.message}`);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('[Stripe Webhook] Processando checkout.session.completed');

  const userId = session.client_reference_id || session.metadata?.user_id;
  const customerId = session.customer as string;

  if (!userId) {
    console.error('[Stripe Webhook] user_id não encontrado no session');
    return;
  }

  const db = await getDb();
  if (!db) {
    console.error('[Stripe Webhook] Banco de dados não disponível');
    return;
  }

  try {
    // Buscar subscription do Stripe
    if (session.subscription) {
      const subscription = await stripe!.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price.id;

      // Mapear priceId para plano
      let plan: 'free' | 'pro' | 'enterprise' | 'basic' = 'free';
      if (priceId === process.env.STRIPE_PRICE_PRO) {
        plan = 'pro';
      } else if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) {
        plan = 'enterprise';
      }

      // Atualizar usuário no banco
      await db.update(users)
        .set({
          stripeCustomerId: customerId,
          subscriptionStatus: subscription.status as 'active' | 'canceled' | 'past_due' | 'trialing' | 'none',
          subscriptionPlan: plan,
        })
        .where(eq(users.id, parseInt(userId)));

      console.log(`[Stripe Webhook] Usuário ${userId} atualizado: plano=${plan}, status=${subscription.status}`);
    }
  } catch (error: any) {
    console.error(`[Stripe Webhook] Erro ao atualizar usuário: ${error.message}`);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('[Stripe Webhook] Processando customer.subscription.updated');

  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;

  const db = await getDb();
  if (!db) {
    console.error('[Stripe Webhook] Banco de dados não disponível');
    return;
  }

  try {
    // Mapear priceId para plano
    let plan: 'free' | 'pro' | 'enterprise' | 'basic' = 'free';
    if (priceId === process.env.STRIPE_PRICE_PRO) {
      plan = 'pro';
    } else if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) {
      plan = 'enterprise';
    }

    // Atualizar usuário
    await db.update(users)
      .set({
        subscriptionStatus: subscription.status as 'active' | 'canceled' | 'past_due' | 'trialing' | 'none',
        subscriptionPlan: plan,
      })
      .where(eq(users.stripeCustomerId, customerId));

    console.log(`[Stripe Webhook] Assinatura atualizada: customer=${customerId}, plano=${plan}, status=${subscription.status}`);
  } catch (error: any) {
    console.error(`[Stripe Webhook] Erro ao atualizar assinatura: ${error.message}`);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('[Stripe Webhook] Processando customer.subscription.deleted');

  const customerId = subscription.customer as string;

  const db = await getDb();
  if (!db) {
    console.error('[Stripe Webhook] Banco de dados não disponível');
    return;
  }

  try {
    // Resetar para plano gratuito
    await db.update(users)
      .set({
        subscriptionStatus: 'canceled',
        subscriptionPlan: 'free',
      })
      .where(eq(users.stripeCustomerId, customerId));

    console.log(`[Stripe Webhook] Assinatura cancelada: customer=${customerId}`);
  } catch (error: any) {
    console.error(`[Stripe Webhook] Erro ao cancelar assinatura: ${error.message}`);
  }
}
