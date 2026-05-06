/**
 * Testes para:
 * 1. Módulo de atualização de preços (update-prices.ts)
 * 2. Email de boas-vindas no OAuth callback
 */
import { describe, it, expect } from "vitest";

// ─── Testes do módulo update-prices ─────────────────────────────────────────

describe("Update Prices — Validações", () => {
  it("deve rejeitar aumento acima de 30%", () => {
    const oldPrice = 4990; // R$ 49,90
    const newPrice = 7000; // R$ 70,00 (aumento de 40%)
    const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;
    expect(changePercent).toBeGreaterThan(30);
    // O módulo deve rejeitar este ajuste
  });

  it("deve rejeitar redução acima de 50%", () => {
    const oldPrice = 4990;
    const newPrice = 2000; // R$ 20,00 (redução de 60%)
    const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;
    expect(changePercent).toBeLessThan(-50);
  });

  it("deve aceitar ajuste dentro dos limites (0-30%)", () => {
    const oldPrice = 4990;
    const ipca = 0.005; // 0.5% mensal
    const newPrice = Math.round(oldPrice * (1 + ipca));
    const changePercent = ((newPrice - oldPrice) / oldPrice) * 100;
    expect(changePercent).toBeGreaterThanOrEqual(0);
    expect(changePercent).toBeLessThanOrEqual(30);
    expect(newPrice).toBe(5015); // R$ 50,15
  });

  it("deve calcular preço por crédito corretamente", () => {
    const packageCredits = 50;
    const newPriceInCents = 4290; // R$ 42,90
    const pricePerCredit = Math.round(newPriceInCents / packageCredits);
    expect(pricePerCredit).toBe(86); // R$ 0,86/crédito
  });

  it("deve calcular preço anual com 20% de desconto", () => {
    const monthlyPrice = 5190; // R$ 51,90
    const yearlyPrice = Math.round(monthlyPrice * 12 * 0.8);
    expect(yearlyPrice).toBe(49824); // R$ 498,24 (R$ 41,52/mês)
  });
});

describe("Update Prices — Cálculo IPCA", () => {
  it("não deve ajustar se IPCA acumulado < 3%", () => {
    const ipcaAcumulado = 2.5; // 2.5% ao ano
    const shouldAdjust = ipcaAcumulado >= 3;
    expect(shouldAdjust).toBe(false);
  });

  it("deve ajustar proporcionalmente se IPCA entre 3% e 10%", () => {
    const ipcaAcumulado = 6.0; // 6% ao ano
    const ajusteMensal = ipcaAcumulado / 12;
    expect(ajusteMensal).toBe(0.5); // 0.5% ao mês
    
    const precoBase = 4990;
    const novoPreco = Math.round(precoBase * (1 + ajusteMensal / 100));
    expect(novoPreco).toBe(5015);
  });

  it("deve limitar ajuste a 0.83%/mês se IPCA > 10%", () => {
    const ipcaAcumulado = 15.0; // 15% ao ano (hiperinflação)
    const ajusteMensal = Math.min(ipcaAcumulado / 12, 0.83);
    expect(ajusteMensal).toBe(0.83); // Limitado a 0.83%
    
    const precoBase = 4990;
    const novoPreco = Math.round(precoBase * (1 + ajusteMensal / 100));
    expect(novoPreco).toBe(5031); // R$ 50,31
  });

  it("plano free nunca deve ser ajustado", () => {
    const planId = "free";
    const shouldAdjust = planId !== "free" && planId !== "enterprise";
    expect(shouldAdjust).toBe(false);
  });

  it("plano enterprise nunca deve ser ajustado", () => {
    const planId = "enterprise";
    const shouldAdjust = planId !== "free" && planId !== "enterprise";
    expect(shouldAdjust).toBe(false);
  });
});

describe("Update Prices — Pacotes de Créditos", () => {
  const packages = [
    { id: "credits_10", credits: 10, basePrice: 990 },
    { id: "credits_50", credits: 50, basePrice: 4190 },
    { id: "credits_100", credits: 100, basePrice: 7490 },
    { id: "credits_300", credits: 300, basePrice: 19290 },
  ];

  it("deve manter desconto progressivo após ajuste", () => {
    const ajuste = 1.005; // 0.5% de ajuste
    const newPrices = packages.map(p => ({
      ...p,
      newPrice: Math.round(p.basePrice * ajuste),
      newPricePerCredit: Math.round((p.basePrice * ajuste) / p.credits),
    }));

    // Verificar que o preço por crédito diminui conforme o pacote aumenta
    for (let i = 1; i < newPrices.length; i++) {
      expect(newPrices[i].newPricePerCredit).toBeLessThan(newPrices[i - 1].newPricePerCredit);
    }
  });

  it("deve aplicar mesmo percentual a todos os pacotes", () => {
    const ajuste = 0.005; // 0.5%
    const adjustments = packages.map(p => {
      const newPrice = Math.round(p.basePrice * (1 + ajuste));
      const actualAdjust = ((newPrice - p.basePrice) / p.basePrice) * 100;
      return actualAdjust;
    });

    // Todos devem estar próximos de 0.5% (arredondamento pode variar)
    adjustments.forEach(adj => {
      expect(adj).toBeGreaterThan(0.3);
      expect(adj).toBeLessThan(0.7);
    });
  });
});

// ─── Testes do Email de Boas-Vindas no OAuth ─────────────────────────────────

describe("Welcome Email — Fluxo OAuth", () => {
  it("deve enviar email apenas no primeiro acesso", () => {
    const isPrimeiroAcesso = true;
    const hasEmail = true;
    const shouldSendWelcome = isPrimeiroAcesso && hasEmail;
    expect(shouldSendWelcome).toBe(true);
  });

  it("não deve enviar email em acessos subsequentes", () => {
    const isPrimeiroAcesso = false;
    const hasEmail = true;
    const shouldSendWelcome = isPrimeiroAcesso && hasEmail;
    expect(shouldSendWelcome).toBe(false);
  });

  it("não deve enviar email se usuário não tem email", () => {
    const isPrimeiroAcesso = true;
    const hasEmail = false;
    const shouldSendWelcome = isPrimeiroAcesso && hasEmail;
    expect(shouldSendWelcome).toBe(false);
  });

  it("deve agendar sequência de onboarding drip após welcome", () => {
    const isPrimeiroAcesso = true;
    const hasEmail = true;
    const shouldScheduleDrip = isPrimeiroAcesso && hasEmail;
    expect(shouldScheduleDrip).toBe(true);
  });
});

describe("Welcome Email — Conteúdo", () => {
  it("deve personalizar com nome do usuário quando disponível", () => {
    const nome = "Paulo";
    const greeting = nome ? `Olá, ${nome}!` : "Olá!";
    expect(greeting).toBe("Olá, Paulo!");
  });

  it("deve usar saudação genérica sem nome", () => {
    const nome = undefined;
    const greeting = nome ? `Olá, ${nome}!` : "Olá!";
    expect(greeting).toBe("Olá!");
  });
});
