import { Request, Response } from "express";
import Stripe from "stripe";
import { stripe, STRIPE_WEBHOOK_SECRET } from "./stripe";
import { getDb } from "../db";
import { users, processedStripeEvents } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Mapeia planos do Stripe para os planos do sistema
 */
function mapStripePlanToSystemPlan(stripePriceId: string): "free" | "pro" | "enterprise" {
  // Mapeamento baseado em metadata ou nome do preço
  // Os IDs serão configurados quando os produtos forem criados no Stripe Dashboard
  const priceIdLower = stripePriceId.toLowerCase();
  if (priceIdLower.includes("enterprise") || priceIdLower.includes("escritorio")) return "enterprise";
  if (priceIdLower.includes("pro") || priceIdLower.includes("profissional")) return "pro";
  return "free";
}

/**
 * Atualiza o plano de assinatura do usuário no banco de dados
 */
async function updateUserSubscription(
  customerEmail: string,
  plan: "free" | "pro" | "enterprise",
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  try {
    const updateData: Record<string, unknown> = { subscriptionPlan: plan };
    if (stripeCustomerId) updateData.stripeCustomerId = stripeCustomerId;
    if (stripeSubscriptionId) updateData.stripeSubscriptionId = stripeSubscriptionId;
    if (plan === "free") updateData.stripeSubscriptionId = null;

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.email, customerEmail));
    
    console.log(`[Webhook] Updated user ${customerEmail} to plan: ${plan}`);
  } catch (error) {
    console.error("[Webhook] Failed to update user subscription:", error);
    throw error;
  }
}

/**
 * Atualiza o plano do usuário pelo userId (via metadata do checkout)
 */
async function updateUserSubscriptionById(
  userId: number,
  plan: "free" | "pro" | "enterprise",
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  try {
    const updateData: Record<string, unknown> = { subscriptionPlan: plan };
    if (stripeCustomerId) updateData.stripeCustomerId = stripeCustomerId;
    if (stripeSubscriptionId) updateData.stripeSubscriptionId = stripeSubscriptionId;
    if (plan === "free") updateData.stripeSubscriptionId = null;

    await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId));
    
    console.log(`[Webhook] Updated user ID ${userId} to plan: ${plan}`);
  } catch (error) {
    console.error("[Webhook] Failed to update user subscription by ID:", error);
    throw error;
  }
}

/**
 * Adiciona créditos bônus ao usuário após compra de pacote de excedente
 */
async function addBonusCredits(userId: number, credits: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available for bonus credits");
    return;
  }

  try {
    // UPDATE ATÔMICO: usa sql expression para somar diretamente no banco
    // Evita race condition de read-then-write quando múltiplos webhooks
    // chegam simultaneamente para o mesmo usuário
    await db
      .update(users)
      .set({ bonusCredits: sql`${users.bonusCredits} + ${credits}` })
      .where(eq(users.id, userId));

    console.log(`[Webhook] Added ${credits} bonus credits to user ${userId} (atomic)`);
  } catch (error) {
    console.error("[Webhook] Failed to add bonus credits:", error);
    throw error;
  }
}

/**
 * Handler principal do webhook do Stripe
 */
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("[Webhook] Missing stripe-signature header");
    res.status(400).send("Missing signature");
    return;
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error("[Webhook] STRIPE_WEBHOOK_SECRET not configured");
    res.status(500).send("Webhook secret not configured");
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const error = err as Error;
    console.error("[Webhook] Signature verification failed:", error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
    return;
  }

  // Detectar eventos de teste e retornar resposta de verificação
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    res.json({ verified: true });
    return;
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  // ── Verificação de Idempotência ─────────────────────────────────────────
  try {
    const db = await getDb();
    if (db) {
      const [existing] = await db
        .select({ id: processedStripeEvents.id })
        .from(processedStripeEvents)
        .where(eq(processedStripeEvents.eventId, event.id))
        .limit(1);

      if (existing) {
        console.log(`[Webhook] Event ${event.id} already processed, skipping (idempotent)`);
        res.json({ received: true, idempotent: true });
        return;
      }

      // Registrar evento como processado ANTES de processar
      // (se falhar no meio, o evento não será reprocessado)
      await db.insert(processedStripeEvents).values({
        eventId: event.id,
        eventType: event.type,
      });
    }
  } catch (idempotencyError) {
    // Se falhar a verificação de idempotência, continuar processando
    // (melhor processar duplicado do que não processar)
    console.warn(`[Webhook] Idempotency check failed:`, idempotencyError);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id ? parseInt(session.metadata.user_id) : null;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Verificar se é compra de créditos extras
        if (session.metadata?.type === "credit_purchase" && userId) {
          const credits = parseInt(session.metadata.credits || "0");
          if (credits > 0) {
            await addBonusCredits(userId, credits);
            console.log(`[Webhook] Added ${credits} bonus credits to user ${userId}`);
          }
          break;
        }

        if (userId && subscriptionId) {
          // Buscar detalhes da assinatura para determinar o plano
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = subscription.items.data[0]?.price.id || "";
          const plan = mapStripePlanToSystemPlan(priceId);
          
          await updateUserSubscriptionById(userId, plan, customerId, subscriptionId);
          console.log(`[Webhook] Checkout completed for user ${userId}, plan: ${plan}`);
        } else if (session.customer_email) {
          // Fallback: usar email do cliente
          const plan = subscriptionId ? "pro" : "free";
          await updateUserSubscription(session.customer_email, plan, customerId, subscriptionId);
        }
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if ("email" in customer && customer.email) {
          const priceId = subscription.items.data[0]?.price.id || "";
          const plan = mapStripePlanToSystemPlan(priceId);
          await updateUserSubscription(
            customer.email, 
            plan, 
            subscription.customer as string,
            subscription.id
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if ("email" in customer && customer.email) {
          if (subscription.status === "active" || subscription.status === "trialing") {
            const priceId = subscription.items.data[0]?.price.id || "";
            const plan = mapStripePlanToSystemPlan(priceId);
            await updateUserSubscription(
              customer.email, 
              plan,
              subscription.customer as string,
              subscription.id
            );
          } else if (subscription.status === "canceled" || subscription.status === "unpaid") {
            await updateUserSubscription(customer.email, "free");
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if ("email" in customer && customer.email) {
          await updateUserSubscription(customer.email, "free");
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Webhook] Payment succeeded for invoice: ${invoice.id}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Webhook] Payment failed for invoice: ${invoice.id}`);
        if (invoice.customer_email) {
          console.log(`[Webhook] Payment failed for customer: ${invoice.customer_email}`);
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    res.status(500).send("Webhook processing failed");
  }
}
