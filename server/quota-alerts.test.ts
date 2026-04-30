import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do logger
vi.mock("../server/_core/logger", () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock do email
vi.mock("../server/email", () => ({
  sendNotificationEmail: vi.fn().mockResolvedValue(true),
}));

// Mock do db
vi.mock("../server/db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
  getUserByOpenId: vi.fn(),
}));

// Mock do quota
vi.mock("../server/quota", () => ({
  getUserQuotaSummary: vi.fn().mockResolvedValue({
    usageCount: 15,
    limit: 20,
    percentUsed: 75,
    remaining: 5,
    plan: "free",
    isUnlimited: false,
  }),
  getPlanMonthlyLimit: vi.fn().mockReturnValue(20),
}));

describe("quota-alerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve exportar a função checkAndSendQuotaAlert", async () => {
    const module = await import("../server/quota-alerts");
    expect(module.checkAndSendQuotaAlert).toBeDefined();
    expect(typeof module.checkAndSendQuotaAlert).toBe("function");
  });

  it("deve aceitar userId e email como parâmetros", async () => {
    const { checkAndSendQuotaAlert } = await import("../server/quota-alerts");
    // Não deve lançar erro mesmo sem DB
    await expect(
      checkAndSendQuotaAlert(1, "test@example.com")
    ).resolves.not.toThrow();
  });
});
