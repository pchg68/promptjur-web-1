import { Request, Response } from "express";
import Stripe from "stripe";
import { stripe, STRIPE_WEBHOOK_SECRET } from "./stripe";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Mapeia planos do Stripe para os planos do sistema
 */
function mapStripePlanToSystemPlan(stripePriceId: string): "free" | "pro" | "enterprise" {
  // TODO: Configurar IDs de preços do Stripe quando forem criados
  // Por enquanto, usamos lógica baseada em nome do produto ou metadata
  
  // Exemplo de mapeamento (ajustar conforme seus produtos no Stripe):
  if (stripePriceId.includes("pro")) return "pro";
  if (stripePriceId.includes("enterprise")) return "enterprise";
  
  return "free";
}

/**
 * Atualiza o plano de assinatura do usuário no banco de dados
 */
async function updateUserSubscription(
  customerEmail: string,
  plan: "free" | "pro" | "enterprise"
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  try {
    await db
      .update(users)
      .set({ subscriptionPlan: plan })
      .where(eq(users.email, customerEmail));
    
    console.log(`[Webhook] Updated user ${customerEmail} to plan: ${plan}`);
  } catch (error) {
    console.error("[Webhook] Failed to update user subscription:", error);
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
    // Verificar assinatura do webhook
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

  try {
    switch (event.type) {
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if ("email" in customer && customer.email) {
          const priceId = subscription.items.data[0]?.price.id || "";
          const plan = mapStripePlanToSystemPlan(priceId);
          await updateUserSubscription(customer.email, plan);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if ("email" in customer && customer.email) {
          // Verificar se a assinatura está ativa
          if (subscription.status === "active" || subscription.status === "trialing") {
            const priceId = subscription.items.data[0]?.price.id || "";
            const plan = mapStripePlanToSystemPlan(priceId);
            await updateUserSubscription(customer.email, plan);
          } else if (subscription.status === "canceled" || subscription.status === "unpaid") {
            // Downgrade para plano gratuito
            await updateUserSubscription(customer.email, "free");
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        
        if ("email" in customer && customer.email) {
          // Downgrade para plano gratuito
          await updateUserSubscription(customer.email, "free");
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Webhook] Payment succeeded for invoice: ${invoice.id}`);
        // Assinatura já foi atualizada pelos eventos de subscription
        // Aqui podemos adicionar lógica adicional se necessário (ex: enviar email de confirmação)
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`[Webhook] Payment failed for invoice: ${invoice.id}`);
        
        // Opcional: notificar usuário sobre falha no pagamento
        if (invoice.customer_email) {
          console.log(`[Webhook] Payment failed for customer: ${invoice.customer_email}`);
          // TODO: Implementar notificação ao usuário
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
