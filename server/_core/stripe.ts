import Stripe from "stripe";
import { ENV } from "./env";

if (!ENV.stripeSecretKey) {
  console.warn("[Stripe] STRIPE_SECRET_KEY not configured");
}

export const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

export const STRIPE_WEBHOOK_SECRET = ENV.stripeWebhookSecret;
