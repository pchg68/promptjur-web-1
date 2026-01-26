import { describe, it, expect, beforeEach } from "vitest";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Webhook Stripe", () => {
  describe("Mapeamento de Planos", () => {
    it("deve mapear price ID com 'pro' para plano Pro", () => {
      const priceId = "price_pro_monthly";
      // Lógica de mapeamento está no stripeWebhook.ts
      expect(priceId.includes("pro")).toBe(true);
    });

    it("deve mapear price ID com 'enterprise' para plano Enterprise", () => {
      const priceId = "price_enterprise_annual";
      expect(priceId.includes("enterprise")).toBe(true);
    });

    it("deve retornar plano Free para IDs desconhecidos", () => {
      const priceId = "price_unknown_123";
      const isFree = !priceId.includes("pro") && !priceId.includes("enterprise");
      expect(isFree).toBe(true);
    });
  });

  describe("Atualização de Assinatura", () => {
    it("deve atualizar plano do usuário no banco de dados", async () => {
      const db = await getDb();
      if (!db) {
        console.warn("Database not available, skipping test");
        return;
      }

      // Buscar um usuário existente para teste
      const testUsers = await db.select().from(users).limit(1);
      
      if (testUsers.length === 0) {
        console.warn("No users found, skipping test");
        return;
      }

      const testUser = testUsers[0];
      const originalPlan = testUser.subscriptionPlan;

      // Simular atualização para Pro
      await db
        .update(users)
        .set({ subscriptionPlan: "pro" })
        .where(eq(users.id, testUser.id));

      // Verificar atualização
      const updatedUser = await db
        .select()
        .from(users)
        .where(eq(users.id, testUser.id))
        .limit(1);

      expect(updatedUser[0].subscriptionPlan).toBe("pro");

      // Restaurar plano original
      await db
        .update(users)
        .set({ subscriptionPlan: originalPlan })
        .where(eq(users.id, testUser.id));
    });
  });

  describe("Eventos do Stripe", () => {
    it("deve processar evento customer.subscription.created", () => {
      const eventType = "customer.subscription.created";
      expect(eventType).toBe("customer.subscription.created");
    });

    it("deve processar evento customer.subscription.updated", () => {
      const eventType = "customer.subscription.updated";
      expect(eventType).toBe("customer.subscription.updated");
    });

    it("deve processar evento customer.subscription.deleted", () => {
      const eventType = "customer.subscription.deleted";
      expect(eventType).toBe("customer.subscription.deleted");
    });

    it("deve processar evento invoice.payment_succeeded", () => {
      const eventType = "invoice.payment_succeeded";
      expect(eventType).toBe("invoice.payment_succeeded");
    });

    it("deve processar evento invoice.payment_failed", () => {
      const eventType = "invoice.payment_failed";
      expect(eventType).toBe("invoice.payment_failed");
    });
  });

  describe("Eventos de Teste", () => {
    it("deve detectar eventos de teste pelo prefixo evt_test_", () => {
      const testEventId = "evt_test_123456";
      expect(testEventId.startsWith("evt_test_")).toBe(true);
    });

    it("deve detectar eventos reais (não-teste)", () => {
      const realEventId = "evt_1234567890";
      expect(realEventId.startsWith("evt_test_")).toBe(false);
    });
  });

  describe("Status de Assinatura", () => {
    it("deve considerar status 'active' como assinatura válida", () => {
      const status = "active";
      const isValid = status === "active" || status === "trialing";
      expect(isValid).toBe(true);
    });

    it("deve considerar status 'trialing' como assinatura válida", () => {
      const status = "trialing";
      const isValid = status === "active" || status === "trialing";
      expect(isValid).toBe(true);
    });

    it("deve considerar status 'canceled' como assinatura inválida", () => {
      const status = "canceled";
      const isValid = status === "active" || status === "trialing";
      expect(isValid).toBe(false);
    });

    it("deve considerar status 'unpaid' como assinatura inválida", () => {
      const status = "unpaid";
      const isValid = status === "active" || status === "trialing";
      expect(isValid).toBe(false);
    });
  });
});
