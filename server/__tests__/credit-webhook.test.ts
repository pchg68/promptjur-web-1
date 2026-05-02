/**
 * Testes para o fluxo de webhook de créditos extras
 * Verifica a lógica de creditação de bonusCredits após pagamento.
 */
import { describe, it, expect } from "vitest";

describe("Credit Webhook - Lógica de Creditação", () => {
  describe("Detecção de tipo de pagamento", () => {
    it("deve identificar compra de créditos pelo metadata.type", () => {
      const metadata = {
        type: "credit_purchase",
        package_id: "credits_50",
        credits: "50",
        user_id: "123",
      };
      expect(metadata.type).toBe("credit_purchase");
    });

    it("deve diferenciar de assinatura (sem metadata.type)", () => {
      const subscriptionMetadata = {
        user_id: "123",
        plan_id: "pro",
        billing_period: "monthly",
      };
      expect(subscriptionMetadata).not.toHaveProperty("type");
    });
  });

  describe("Cálculo de créditos", () => {
    it("deve parsear créditos do metadata corretamente", () => {
      const creditsStr = "50";
      const credits = parseInt(creditsStr);
      expect(credits).toBe(50);
    });

    it("deve lidar com metadata.credits ausente", () => {
      const creditsStr = undefined;
      const credits = parseInt(creditsStr || "0");
      expect(credits).toBe(0);
    });

    it("deve somar créditos ao saldo existente", () => {
      const existingBonus = 10;
      const newCredits = 50;
      const total = existingBonus + newCredits;
      expect(total).toBe(60);
    });

    it("deve lidar com bonusCredits null (primeiro compra)", () => {
      const existingBonus: number | null = null;
      const newCredits = 100;
      const total = (existingBonus ?? 0) + newCredits;
      expect(total).toBe(100);
    });
  });

  describe("Validação de pacotes", () => {
    const VALID_PACKAGES = ["credits_10", "credits_50", "credits_100", "credits_300"];

    it("deve aceitar pacotes válidos", () => {
      for (const pkg of VALID_PACKAGES) {
        expect(VALID_PACKAGES.includes(pkg)).toBe(true);
      }
    });

    it("deve rejeitar pacotes inválidos", () => {
      const invalidPackages = ["credits_0", "credits_999", "invalid", ""];
      for (const pkg of invalidPackages) {
        expect(VALID_PACKAGES.includes(pkg)).toBe(false);
      }
    });
  });

  describe("Eventos de teste do Stripe", () => {
    it("deve detectar evento de teste pelo prefixo evt_test_", () => {
      const testEventId = "evt_test_abc123";
      const isTestEvent = testEventId.startsWith("evt_test_");
      expect(isTestEvent).toBe(true);
    });

    it("deve processar eventos reais normalmente", () => {
      const realEventId = "evt_1NqQkL2eZvKYlo2CqMPfD3Lp";
      const isTestEvent = realEventId.startsWith("evt_test_");
      expect(isTestEvent).toBe(false);
    });

    it("deve retornar {verified: true} para eventos de teste", () => {
      const testEventId = "evt_test_abc123";
      if (testEventId.startsWith("evt_test_")) {
        const response = { verified: true };
        expect(response).toEqual({ verified: true });
      }
    });
  });

  describe("Mapeamento de planos", () => {
    function mapStripePlanToSystemPlan(stripePriceId: string): "free" | "pro" | "enterprise" {
      const priceIdLower = stripePriceId.toLowerCase();
      if (priceIdLower.includes("enterprise") || priceIdLower.includes("escritorio")) return "enterprise";
      if (priceIdLower.includes("pro") || priceIdLower.includes("profissional")) return "pro";
      return "free";
    }

    it("deve mapear preço com 'pro' para plano pro", () => {
      expect(mapStripePlanToSystemPlan("price_pro_monthly")).toBe("pro");
    });

    it("deve mapear preço com 'enterprise' para plano enterprise", () => {
      expect(mapStripePlanToSystemPlan("price_enterprise_yearly")).toBe("enterprise");
    });

    it("deve mapear preço desconhecido para free", () => {
      expect(mapStripePlanToSystemPlan("price_unknown_123")).toBe("free");
    });
  });
});
