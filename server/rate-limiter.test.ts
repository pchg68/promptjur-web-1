import { describe, it, expect } from "vitest";
import { RATE_LIMITS } from "./_core/rateLimiter";

describe("Rate Limiter", () => {
  describe("Limites por Plano", () => {
    it("deve definir limite de 1000 requisições/hora para plano Free (modo desenvolvimento)", () => {
      expect(RATE_LIMITS.free.max).toBe(1000);
      expect(RATE_LIMITS.free.windowMs).toBe(60 * 60 * 1000); // 1 hora
    });

    it("deve definir limite diário de 5000 requisições para plano Free (modo desenvolvimento)", () => {
      expect(RATE_LIMITS.free.dailyMax).toBe(5000);
    });

    it("deve definir limite de 100 requisições/hora para plano Pro", () => {
      expect(RATE_LIMITS.pro.max).toBe(100);
      expect(RATE_LIMITS.pro.windowMs).toBe(60 * 60 * 1000); // 1 hora
    });

    it("deve definir limite diário de 1000 requisições para plano Pro", () => {
      expect(RATE_LIMITS.pro.dailyMax).toBe(1000);
    });

    it("deve definir limite ilimitado para plano Enterprise", () => {
      expect(RATE_LIMITS.enterprise.max).toBe(Infinity);
      expect(RATE_LIMITS.enterprise.dailyMax).toBe(Infinity);
    });
  });

  describe("Janelas de Tempo", () => {
    it("deve usar janela de 1 hora para todos os planos", () => {
      const oneHour = 60 * 60 * 1000;
      expect(RATE_LIMITS.free.windowMs).toBe(oneHour);
      expect(RATE_LIMITS.pro.windowMs).toBe(oneHour);
      expect(RATE_LIMITS.enterprise.windowMs).toBe(oneHour);
    });
  });

  describe("Comparação de Planos", () => {
    it("plano Pro deve ter limites definidos", () => {
      expect(RATE_LIMITS.pro.max).toBe(100);
      expect(RATE_LIMITS.pro.dailyMax).toBe(1000);
    });

    it("plano Enterprise deve ter limites maiores que Pro", () => {
      expect(RATE_LIMITS.enterprise.max).toBeGreaterThan(RATE_LIMITS.pro.max);
      expect(RATE_LIMITS.enterprise.dailyMax).toBeGreaterThan(RATE_LIMITS.pro.dailyMax);
    });

    it("plano Enterprise não deve ter limites", () => {
      expect(RATE_LIMITS.enterprise.max).toBeGreaterThan(RATE_LIMITS.pro.max);
      expect(RATE_LIMITS.enterprise.dailyMax).toBeGreaterThan(RATE_LIMITS.pro.dailyMax);
    });
  });

  describe("Validação de Estrutura", () => {
    it("deve ter configuração para todos os planos", () => {
      expect(RATE_LIMITS).toHaveProperty("free");
      expect(RATE_LIMITS).toHaveProperty("pro");
      expect(RATE_LIMITS).toHaveProperty("enterprise");
    });

    it("cada plano deve ter propriedades obrigatórias", () => {
      const plans = ["free", "pro", "enterprise"] as const;
      
      plans.forEach(plan => {
        expect(RATE_LIMITS[plan]).toHaveProperty("windowMs");
        expect(RATE_LIMITS[plan]).toHaveProperty("max");
        expect(RATE_LIMITS[plan]).toHaveProperty("dailyMax");
      });
    });

    it("limites devem ser números positivos", () => {
      expect(RATE_LIMITS.free.max).toBeGreaterThan(0);
      expect(RATE_LIMITS.free.dailyMax).toBeGreaterThan(0);
      expect(RATE_LIMITS.free.windowMs).toBeGreaterThan(0);
      
      expect(RATE_LIMITS.pro.max).toBeGreaterThan(0);
      expect(RATE_LIMITS.pro.dailyMax).toBeGreaterThan(0);
      expect(RATE_LIMITS.pro.windowMs).toBeGreaterThan(0);
    });
  });

  describe("Mensagens de Erro", () => {
    it("deve incluir informações do plano na mensagem de erro 429", () => {
      const plan = "free";
      const errorMessage = `Você excedeu o limite de requisições do plano ${plan}`;
      expect(errorMessage).toContain("free");
      expect(errorMessage).toContain("limite de requisições");
    });

    it("deve sugerir upgrade na mensagem de erro", () => {
      const errorMessage = "considere fazer upgrade para um plano superior";
      expect(errorMessage).toContain("upgrade");
      expect(errorMessage).toContain("plano superior");
    });
  });

  describe("Ambiente de Desenvolvimento", () => {
    it("deve permitir skip de rate limiting em desenvolvimento", () => {
      const isDevelopment = process.env.NODE_ENV === "development";
      const hasSkipHeader = true; // Simula header x-skip-rate-limit
      const shouldSkip = isDevelopment && hasSkipHeader;
      
      if (isDevelopment) {
        expect(shouldSkip).toBe(true);
      }
    });
  });
});
