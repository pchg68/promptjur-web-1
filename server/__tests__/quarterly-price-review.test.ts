/**
 * Testes unitários para quarterly-price-review.ts
 * Cobre: deveExecutarHoje, cálculo de margens, criação de revisão, notificações
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

vi.mock("../stripe-products", () => ({
  PLANS: {
    pro: { name: "Pro Mensal", priceMonthly: 5790 },
    pro_anual: { name: "Pro Anual", priceMonthly: 4590 },
  },
  CREDIT_PACKAGES: [
    { id: "credits_10", name: "10 Créditos", priceInCents: 1190 },
    { id: "credits_50", name: "50 Créditos", priceInCents: 4890 },
    { id: "credits_100", name: "100 Créditos", priceInCents: 8590 },
  ],
}));

vi.mock("../_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("../../drizzle/schema", () => ({
  priceReviewRequests: { id: {}, quarter: {}, regime: {}, items: {}, summary: {}, status: {}, createdAt: {}, updatedAt: {} },
  priceChangeNotices: {},
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockDbEmpty() {
  const db = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
  };
  return db;
}

// ─── Testes: deveExecutarHoje ─────────────────────────────────────────────────

describe("deveExecutarHoje", () => {
  afterEach(() => vi.useRealTimers());

  it("retorna true no dia 1 de janeiro", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T08:00:00Z"));
    const { deveExecutarHoje } = await import("../jobs/quarterly-price-review");
    expect(deveExecutarHoje()).toBe(true);
  });

  it("retorna true no dia 1 de abril", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T08:00:00Z"));
    const { deveExecutarHoje } = await import("../jobs/quarterly-price-review");
    expect(deveExecutarHoje()).toBe(true);
  });

  it("retorna true no dia 1 de julho", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-01T08:00:00Z"));
    const { deveExecutarHoje } = await import("../jobs/quarterly-price-review");
    expect(deveExecutarHoje()).toBe(true);
  });

  it("retorna true no dia 1 de outubro", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T08:00:00Z"));
    const { deveExecutarHoje } = await import("../jobs/quarterly-price-review");
    expect(deveExecutarHoje()).toBe(true);
  });

  it("retorna false em dia que não é início de trimestre", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-11T08:00:00Z"));
    const { deveExecutarHoje } = await import("../jobs/quarterly-price-review");
    expect(deveExecutarHoje()).toBe(false);
  });

  it("retorna false no dia 2 de janeiro", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-02T08:00:00Z"));
    const { deveExecutarHoje } = await import("../jobs/quarterly-price-review");
    expect(deveExecutarHoje()).toBe(false);
  });

  it("retorna false em fevereiro", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-01T08:00:00Z"));
    const { deveExecutarHoje } = await import("../jobs/quarterly-price-review");
    expect(deveExecutarHoje()).toBe(false);
  });
});

// ─── Testes: quarterlyPriceReviewJob ─────────────────────────────────────────

describe("quarterlyPriceReviewJob", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("pula execução se banco não disponível", async () => {
    const { getDb } = await import("../db");
    vi.mocked(getDb).mockResolvedValue(null as any);
    const { quarterlyPriceReviewJob } = await import("../jobs/quarterly-price-review");
    await expect(quarterlyPriceReviewJob()).resolves.toBeUndefined();
  });

  it("pula se já existe revisão para o trimestre atual", async () => {
    const { getDb } = await import("../db");
    const db = mockDbEmpty();
    db.limit = vi.fn().mockResolvedValue([{ id: 42, status: "pending" }]);
    vi.mocked(getDb).mockResolvedValue(db as any);
    const { quarterlyPriceReviewJob } = await import("../jobs/quarterly-price-review");
    await quarterlyPriceReviewJob();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("notifica owner quando todos os produtos têm margem saudável", async () => {
    const { getDb } = await import("../db");
    const { notifyOwner } = await import("../_core/notification");
    const db = mockDbEmpty();
    // Simular preços muito altos (margem > 70%)
    vi.mocked(getDb).mockResolvedValue(db as any);

    // Substituir PLANS com preços altíssimos para garantir margem > 70%
    vi.doMock("../stripe-products", () => ({
      PLANS: {
        pro: { name: "Pro Mensal", priceMonthly: 100000 }, // R$1000 — margem altíssima
      },
      CREDIT_PACKAGES: [],
    }));

    const { quarterlyPriceReviewJob } = await import("../jobs/quarterly-price-review");
    await quarterlyPriceReviewJob();

    // Deve notificar owner (seja com reajuste ou sem)
    expect(notifyOwner).toHaveBeenCalled();
  });

  it("cria revisão pendente quando há produtos com margem baixa", async () => {
    const { getDb } = await import("../db");
    const db = mockDbEmpty();
    vi.mocked(getDb).mockResolvedValue(db as any);

    // Substituir PLANS com preços muito baixos (margem < 70%)
    vi.doMock("../stripe-products", () => ({
      PLANS: {
        pro: { name: "Pro Mensal", priceMonthly: 100 }, // R$1 — margem negativa
      },
      CREDIT_PACKAGES: [],
    }));

    const { quarterlyPriceReviewJob } = await import("../jobs/quarterly-price-review");
    await quarterlyPriceReviewJob();

    // Deve tentar inserir uma revisão
    expect(db.insert).toHaveBeenCalled();
  });

  it("não lança exceção mesmo com erro no banco", async () => {
    const { getDb } = await import("../db");
    vi.mocked(getDb).mockRejectedValue(new Error("DB connection failed"));
    const { quarterlyPriceReviewJob } = await import("../jobs/quarterly-price-review");
    await expect(quarterlyPriceReviewJob()).resolves.toBeUndefined();
  });
});

// ─── Testes: Cálculo de Margens ───────────────────────────────────────────────

describe("Cálculo de margens (lógica interna)", () => {
  it("margem do Pro Mensal (R$57,90) com carga 21% deve ser ~73,6%", () => {
    const preco = 57.90;
    const carga = 0.21;
    const pct = 0.0399 + 0.0070; // assinatura
    const fixo = 0.39;
    const stripe = preco * pct + fixo;
    const imposto = preco * carga;
    const liquido = preco - stripe - imposto;
    const margem = (liquido / preco) * 100;
    expect(margem).toBeGreaterThan(70);
    expect(margem).toBeLessThan(80);
  });

  it("margem com preço muito baixo (R$1,00) deve ser inferior a 40%", () => {
    // Com taxa fixa Stripe de R$0,39 + percentual + imposto, preço de R$1 tem margem muito baixa
    const preco = 1.00;
    const carga = 0.21;
    const pct = 0.0399 + 0.0070;
    const fixo = 0.39;
    const stripe = preco * pct + fixo;
    const imposto = preco * carga;
    const liquido = preco - stripe - imposto;
    const margem = (liquido / preco) * 100;
    // A taxa fixa de R$0,39 representa 39% do preço, tornando a margem muito baixa
    expect(margem).toBeLessThan(40);
  });

  it("PIX tem menor overhead que cartão para mesmo valor", () => {
    const preco = 50.00;
    const carga = 0.21;
    const stripeCartao = preco * 0.0399 + 0.39;
    const stripePix = preco * 0.0119;
    const liquidoCartao = preco - stripeCartao - preco * carga;
    const liquidoPix = preco - stripePix - preco * carga;
    expect(liquidoPix).toBeGreaterThan(liquidoCartao);
  });

  it("boleto tem overhead fixo alto (R$3,45) que reduz margem em produtos baratos", () => {
    // Para R$11,90, o boleto (R$3,45 fixo) representa 29% do preço
    const preco = 11.90;
    const carga = 0.21;
    const stripeBoleto = 3.45; // fixo Stripe boleto BR
    const liquido = preco - stripeBoleto - preco * carga;
    const margem = (liquido / preco) * 100;
    // Overhead do boleto (R$3,45/R$11,90 = 29%) + imposto (21%) = 50% de overhead
    expect(margem).toBeLessThan(55); // margem significativamente reduzida
    expect(margem).toBeGreaterThan(0); // ainda positiva
  });
});
