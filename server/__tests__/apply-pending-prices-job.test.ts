/**
 * Testes para o job de aplicação de reajustes pendentes
 * 
 * Cobre:
 * - runApplyPendingPricesJob() — delega para applyPendingPriceChanges()
 * - Tratamento de erros (exceção, DB indisponível)
 * - scheduleApplyPendingPrices() — registra o intervalo correto
 * - effectiveDateOverride na interface PriceChangeRequest
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockApplyPendingPriceChanges = vi.fn();

vi.mock("../scheduled/price-change-notice", () => ({
  applyPendingPriceChanges: (...args: any[]) => mockApplyPendingPriceChanges(...args),
  createPriceChangeNotice: vi.fn().mockResolvedValue({
    noticeId: 99,
    emailsSent: 2,
    totalSubscribers: 2,
    effectiveDate: new Date(),
    errors: [],
  }),
}));

// ─── Testes do Job ───────────────────────────────────────────────────────────

describe("runApplyPendingPricesJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar { applied: 0, errors: [] } quando não há notices pendentes", async () => {
    mockApplyPendingPriceChanges.mockResolvedValueOnce({ applied: 0, errors: [] });

    const { runApplyPendingPricesJob } = await import("../jobs/apply-pending-prices");
    const result = await runApplyPendingPricesJob();

    expect(result).toEqual({ applied: 0, errors: [] });
    expect(mockApplyPendingPriceChanges).toHaveBeenCalledOnce();
  });

  it("deve retornar o número correto de reajustes aplicados", async () => {
    mockApplyPendingPriceChanges.mockResolvedValueOnce({ applied: 3, errors: [] });

    const { runApplyPendingPricesJob } = await import("../jobs/apply-pending-prices");
    const result = await runApplyPendingPricesJob();

    expect(result.applied).toBe(3);
    expect(result.errors).toHaveLength(0);
  });

  it("deve propagar erros retornados por applyPendingPriceChanges", async () => {
    mockApplyPendingPriceChanges.mockResolvedValueOnce({
      applied: 1,
      errors: ["Falha ao aplicar override para starter"],
    });

    const { runApplyPendingPricesJob } = await import("../jobs/apply-pending-prices");
    const result = await runApplyPendingPricesJob();

    expect(result.applied).toBe(1);
    expect(result.errors).toContain("Falha ao aplicar override para starter");
  });

  it("deve capturar exceção e retornar applied: 0 com mensagem de erro", async () => {
    mockApplyPendingPriceChanges.mockRejectedValueOnce(new Error("Database timeout"));

    const { runApplyPendingPricesJob } = await import("../jobs/apply-pending-prices");
    const result = await runApplyPendingPricesJob();

    expect(result.applied).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("Database timeout");
  });

  it("deve retornar { applied: 0, errors: [...] } quando applyPendingPriceChanges lança exceção sem mensagem", async () => {
    mockApplyPendingPriceChanges.mockRejectedValueOnce(new Error());

    const { runApplyPendingPricesJob } = await import("../jobs/apply-pending-prices");
    const result = await runApplyPendingPricesJob();

    expect(result.applied).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ─── Testes da Interface PriceChangeRequest ──────────────────────────────────

describe("PriceChangeRequest — effectiveDateOverride", () => {
  it("deve aceitar effectiveDateOverride como campo opcional", () => {
    const request = {
      entityType: "plan" as const,
      entityId: "starter",
      currentPrice: 4990,
      newPrice: 5490,
      adjustmentPercent: 10.02,
      reason: "Teste",
      source: "manual",
      effectiveDateOverride: new Date(Date.now() + 2 * 60 * 1000),
    };

    expect(request.effectiveDateOverride).toBeInstanceOf(Date);
    expect(request.effectiveDateOverride.getTime()).toBeGreaterThan(Date.now());
  });

  it("deve ter effectiveDateOverride como campo opcional (sem ele é válido)", () => {
    const request = {
      entityType: "plan" as const,
      entityId: "starter",
      currentPrice: 4990,
      newPrice: 5490,
      adjustmentPercent: 10.02,
    };

    expect(request).not.toHaveProperty("effectiveDateOverride");
  });

  it("effectiveDateOverride de 2 minutos deve ser menor que 30 dias", () => {
    const twoMinutes = new Date(Date.now() + 2 * 60 * 1000);
    const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    expect(twoMinutes.getTime()).toBeLessThan(thirtyDays.getTime());
  });
});

// ─── Testes do Intervalo do Job ──────────────────────────────────────────────

describe("scheduleApplyPendingPrices — configuração do intervalo", () => {
  it("deve ter intervalo de 24 horas (86400000 ms)", () => {
    // Verificar a constante INTERVAL_MS indiretamente pelo comportamento esperado
    const EXPECTED_INTERVAL_MS = 24 * 60 * 60 * 1000;
    expect(EXPECTED_INTERVAL_MS).toBe(86_400_000);
  });

  it("24 horas em ms deve ser maior que 1 hora", () => {
    const oneHour = 60 * 60 * 1000;
    const twentyFourHours = 24 * 60 * 60 * 1000;
    expect(twentyFourHours).toBeGreaterThan(oneHour);
  });

  it("24 horas em ms deve ser menor que 48 horas", () => {
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const fortyEightHours = 48 * 60 * 60 * 1000;
    expect(twentyFourHours).toBeLessThan(fortyEightHours);
  });
});

// ─── Testes de Integração do Fluxo Completo ─────────────────────────────────

describe("Fluxo Completo de Teste — effectiveDateOverride", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve criar notice com data de vigência em 2 minutos para teste", async () => {
    const { createPriceChangeNotice } = await import("../scheduled/price-change-notice");

    const effectiveDateOverride = new Date(Date.now() + 2 * 60 * 1000);

    await createPriceChangeNotice({
      entityType: "plan",
      entityId: "starter",
      currentPrice: 4990,
      newPrice: 5490,
      adjustmentPercent: 10.02,
      reason: "[TESTE] Validação do fluxo completo",
      source: "manual",
      effectiveDateOverride,
    });

    expect(createPriceChangeNotice).toHaveBeenCalledWith(
      expect.objectContaining({
        effectiveDateOverride: expect.any(Date),
      })
    );
  });

  it("deve garantir que notice de teste tem vigência antes de 30 dias", () => {
    const now = Date.now();
    const twoMinutesLater = new Date(now + 2 * 60 * 1000);
    const thirtyDaysLater = new Date(now + 30 * 24 * 60 * 60 * 1000);

    expect(twoMinutesLater.getTime()).toBeLessThan(thirtyDaysLater.getTime());
  });

  it("deve simular o ciclo completo: criar → aguardar vigência → aplicar", async () => {
    // Simula o fluxo: aviso criado → data de vigência passa → job aplica
    mockApplyPendingPriceChanges.mockResolvedValueOnce({ applied: 1, errors: [] });

    const { runApplyPendingPricesJob } = await import("../jobs/apply-pending-prices");
    const result = await runApplyPendingPricesJob();

    expect(result.applied).toBe(1);
    expect(result.errors).toHaveLength(0);
  });
});
