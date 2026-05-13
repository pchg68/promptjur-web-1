/**
 * Testes do módulo de trial de 7 dias
 * Verifica ativação, status, expiração e integração com quota
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do getDb
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
};

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

vi.mock("../../drizzle/schema", () => ({
  users: {
    id: "id",
    trialUsed: "trialUsed",
    trialEndsAt: "trialEndsAt",
    subscriptionPlan: "subscriptionPlan",
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
}));

describe("Trial Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset limit mock to return array by default
    mockDb.limit.mockResolvedValue([]);
    mockDb.where.mockReturnValue(mockDb);
    mockDb.set.mockReturnValue(mockDb);
  });

  describe("TRIAL_DURATION_DAYS", () => {
    it("deve ser 7 dias", async () => {
      const { TRIAL_DURATION_DAYS } = await import("../trial");
      expect(TRIAL_DURATION_DAYS).toBe(7);
    });
  });

  describe("getTrialStatus", () => {
    it("deve retornar trial inativo quando usuário não existe", async () => {
      mockDb.limit.mockResolvedValue([]);
      const { getTrialStatus } = await import("../trial");
      const status = await getTrialStatus(999);
      expect(status.isActive).toBe(false);
      expect(status.daysRemaining).toBe(0);
    });

    it("deve retornar trial ativo quando trialEndsAt está no futuro", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      mockDb.limit.mockResolvedValue([{
        trialEndsAt: futureDate,
        trialUsed: true,
        subscriptionPlan: "free",
      }]);
      const { getTrialStatus } = await import("../trial");
      const status = await getTrialStatus(1);
      expect(status.isActive).toBe(true);
      expect(status.daysRemaining).toBeGreaterThanOrEqual(4);
      expect(status.trialUsed).toBe(true);
      expect(status.hasPaidPlan).toBe(false);
    });

    it("deve retornar trial inativo quando trialEndsAt está no passado", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      mockDb.limit.mockResolvedValue([{
        trialEndsAt: pastDate,
        trialUsed: true,
        subscriptionPlan: "free",
      }]);
      const { getTrialStatus } = await import("../trial");
      const status = await getTrialStatus(1);
      expect(status.isActive).toBe(false);
      expect(status.daysRemaining).toBe(0);
    });

    it("deve retornar hasPaidPlan true quando usuário tem plano pago", async () => {
      mockDb.limit.mockResolvedValue([{
        trialEndsAt: null,
        trialUsed: false,
        subscriptionPlan: "pro",
      }]);
      const { getTrialStatus } = await import("../trial");
      const status = await getTrialStatus(1);
      expect(status.hasPaidPlan).toBe(true);
    });
  });

  describe("activateTrial", () => {
    it("não deve ativar trial se usuário já usou", async () => {
      mockDb.limit.mockResolvedValue([{
        id: 1,
        trialUsed: true,
        trialEndsAt: null,
        subscriptionPlan: "free",
      }]);
      const { activateTrial } = await import("../trial");
      const result = await activateTrial(1);
      expect(result).toBe(false);
    });

    it("não deve ativar trial se usuário já tem plano pago", async () => {
      mockDb.limit.mockResolvedValue([{
        id: 1,
        trialUsed: false,
        trialEndsAt: null,
        subscriptionPlan: "pro",
      }]);
      const { activateTrial } = await import("../trial");
      const result = await activateTrial(1);
      expect(result).toBe(false);
    });

    it("não deve ativar trial se usuário não existe", async () => {
      mockDb.limit.mockResolvedValue([]);
      const { activateTrial } = await import("../trial");
      const result = await activateTrial(999);
      expect(result).toBe(false);
    });
  });

  describe("isTrialActive", () => {
    it("deve retornar true quando trial está ativo e plano é free", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      mockDb.limit.mockResolvedValue([{
        trialEndsAt: futureDate,
        trialUsed: true,
        subscriptionPlan: "free",
      }]);
      const { isTrialActive } = await import("../trial");
      const result = await isTrialActive(1);
      expect(result).toBe(true);
    });

    it("deve retornar false quando trial expirou", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      mockDb.limit.mockResolvedValue([{
        trialEndsAt: pastDate,
        trialUsed: true,
        subscriptionPlan: "free",
      }]);
      const { isTrialActive } = await import("../trial");
      const result = await isTrialActive(1);
      expect(result).toBe(false);
    });
  });

  describe("getEffectivePlan", () => {
    it("deve retornar 'pro' quando trial ativo e plano é free", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      mockDb.limit.mockResolvedValue([{
        trialEndsAt: futureDate,
        trialUsed: true,
        subscriptionPlan: "free",
      }]);
      const { getEffectivePlan } = await import("../trial");
      const plan = await getEffectivePlan(1, "free");
      expect(plan).toBe("pro");
    });

    it("deve retornar plano original quando já é pago", async () => {
      const { getEffectivePlan } = await import("../trial");
      const plan = await getEffectivePlan(1, "enterprise");
      expect(plan).toBe("enterprise");
    });
  });
});
