/**
 * Testes unitários para stripe-products.ts
 * 
 * Valida:
 * - Estrutura dos planos (free, pro, enterprise)
 * - Pacotes de créditos (preços, descontos progressivos)
 * - Funções auxiliares (getCreditPackage, getPlan, formatPrice)
 */
import { describe, it, expect } from "vitest";
import { PLANS, CREDIT_PACKAGES, getCreditPackage, getPlan, formatPrice } from "../stripe-products";

describe("PLANS", () => {
  it("contém os 3 planos: free, pro, enterprise", () => {
    expect(Object.keys(PLANS)).toEqual(expect.arrayContaining(["free", "pro", "enterprise"]));
    expect(Object.keys(PLANS).length).toBe(3);
  });

  it("plano free tem preço zero e limite de 12 operações", () => {
    const free = PLANS.free;
    expect(free.priceMonthly).toBe(0);
    expect(free.priceYearly).toBe(0);
    expect(free.limits.promptsPerMonth).toBe(12);
    expect(free.limits.knowledgeRetrieval).toBe(false);
    expect(free.limits.multiAI).toBe(false);
  });

  it("plano pro tem preço R$ 57,90/mês e 300 operações", () => {
    const pro = PLANS.pro;
    expect(pro.priceMonthly).toBe(5790);
    expect(pro.limits.promptsPerMonth).toBe(300);
    expect(pro.popular).toBe(true);
    expect(pro.limits.knowledgeRetrieval).toBe(true);
    expect(pro.limits.multiAI).toBe(true);
  });

  it("plano enterprise é contactOnly e tem operações ilimitadas", () => {
    const enterprise = PLANS.enterprise;
    expect(enterprise.contactOnly).toBe(true);
    expect(enterprise.limits.promptsPerMonth).toBe(-1);
    expect(enterprise.limits.prioritySupport).toBe(true);
  });

  it("todos os planos têm features com texto e flag included", () => {
    for (const [, plan] of Object.entries(PLANS)) {
      expect(plan.features.length).toBeGreaterThan(0);
      for (const feature of plan.features) {
        expect(feature).toHaveProperty("text");
        expect(feature).toHaveProperty("included");
        expect(typeof feature.text).toBe("string");
        expect(typeof feature.included).toBe("boolean");
      }
    }
  });

  it("todos os planos têm modelsAvailable com pelo menos manus", () => {
    for (const [, plan] of Object.entries(PLANS)) {
      expect(plan.limits.modelsAvailable).toContain("manus");
    }
  });

  it("preço anual do pro é menor que 12x mensal (desconto)", () => {
    const pro = PLANS.pro;
    expect(pro.priceYearly).toBeLessThan(pro.priceMonthly * 12);
  });
});

describe("CREDIT_PACKAGES", () => {
  it("contém 4 pacotes de créditos", () => {
    expect(CREDIT_PACKAGES.length).toBe(4);
  });

  it("pacotes estão ordenados por quantidade crescente", () => {
    for (let i = 1; i < CREDIT_PACKAGES.length; i++) {
      expect(CREDIT_PACKAGES[i].credits).toBeGreaterThan(CREDIT_PACKAGES[i - 1].credits);
    }
  });

  it("preço por crédito diminui com pacotes maiores (desconto progressivo)", () => {
    for (let i = 1; i < CREDIT_PACKAGES.length; i++) {
      expect(CREDIT_PACKAGES[i].pricePerCredit).toBeLessThan(CREDIT_PACKAGES[i - 1].pricePerCredit);
    }
  });

  it("pacote de 50 créditos é marcado como popular", () => {
    const popular = CREDIT_PACKAGES.find(p => p.popular);
    expect(popular).toBeDefined();
    expect(popular!.id).toBe("credits_50");
  });

  it("todos os pacotes têm campos obrigatórios", () => {
    for (const pkg of CREDIT_PACKAGES) {
      expect(pkg.id).toBeTruthy();
      expect(pkg.name).toBeTruthy();
      expect(pkg.description).toBeTruthy();
      expect(pkg.credits).toBeGreaterThan(0);
      expect(pkg.priceInCents).toBeGreaterThan(0);
      expect(pkg.pricePerCredit).toBeGreaterThan(0);
    }
  });

  it("preço total é consistente com preço por crédito (margem de arredondamento)", () => {
    for (const pkg of CREDIT_PACKAGES) {
      const calculatedPrice = pkg.pricePerCredit * pkg.credits;
      // Margem de 10% para arredondamento
      expect(Math.abs(calculatedPrice - pkg.priceInCents)).toBeLessThan(pkg.priceInCents * 0.1);
    }
  });
});

describe("getCreditPackage", () => {
  it("retorna pacote correto pelo ID", () => {
    const pkg = getCreditPackage("credits_50");
    expect(pkg).toBeDefined();
    expect(pkg!.credits).toBe(50);
    expect(pkg!.id).toBe("credits_50");
  });

  it("retorna undefined para ID inexistente", () => {
    expect(getCreditPackage("credits_999")).toBeUndefined();
    expect(getCreditPackage("")).toBeUndefined();
  });
});

describe("getPlan", () => {
  it("retorna plano correto pelo ID", () => {
    const plan = getPlan("pro");
    expect(plan).toBeDefined();
    expect(plan!.name).toBe("Profissional");
  });

  it("retorna undefined para plano inexistente", () => {
    expect(getPlan("ultra")).toBeUndefined();
  });
});

describe("formatPrice", () => {
  it("formata preço zero como 'Grátis'", () => {
    expect(formatPrice(0)).toBe("Grátis");
  });

  it("formata preço em centavos para BRL", () => {
    const result = formatPrice(4990);
    expect(result).toContain("49,90");
    expect(result).toContain("R$");
  });

  it("formata preço de crédito corretamente", () => {
    const result = formatPrice(990);
    expect(result).toContain("9,90");
  });
});
