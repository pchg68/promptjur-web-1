/**
 * Testes para o módulo de onboarding drip emails
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do Resend
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: "test-id" }, error: null }),
    },
  })),
}));

// Mock do banco de dados - precisa ser definido dentro do factory para funcionar
vi.mock("./db", () => {
  const db: any = {};
  db.select = vi.fn(() => db);
  db.from = vi.fn(() => db);
  db.where = vi.fn(() => db);
  db.limit = vi.fn(() => Promise.resolve([]));
  db.insert = vi.fn(() => db);
  db.values = vi.fn(() => Promise.resolve(undefined));
  db.update = vi.fn(() => db);
  db.set = vi.fn(() => db);
  db.innerJoin = vi.fn(() => db);
  db.leftJoin = vi.fn(() => db);
  // Suporte para then (thenable)
  db.then = undefined;
  return {
    getDb: vi.fn(() => Promise.resolve(db)),
    __mockDb: db,
  };
});

// Mock do schema
vi.mock("../drizzle/schema", () => ({
  onboardingEmails: { userId: "userId", step: "step", scheduledAt: "scheduledAt", sentAt: "sentAt" },
  users: { id: "id", name: "name", email: "email", openId: "openId" },
}));

describe("Onboarding Drip Emails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve exportar scheduleOnboardingSequence como função", async () => {
    const mod = await import("./onboarding-drip");
    expect(typeof mod.scheduleOnboardingSequence).toBe("function");
  });

  it("deve exportar processOnboardingEmails como função", async () => {
    const mod = await import("./onboarding-drip");
    expect(typeof mod.processOnboardingEmails).toBe("function");
  });

  it("deve exportar cancelOnboardingSequence como função", async () => {
    const mod = await import("./onboarding-drip");
    expect(typeof mod.cancelOnboardingSequence).toBe("function");
  });

  it("scheduleOnboardingSequence não deve lançar erro com dados válidos", async () => {
    const mod = await import("./onboarding-drip");
    await expect(
      mod.scheduleOnboardingSequence(1, "test@example.com")
    ).resolves.not.toThrow();
  });

  it("scheduleOnboardingSequence deve retornar void sem DB", async () => {
    const dbMod = await import("./db");
    (dbMod.getDb as any).mockResolvedValueOnce(null);
    
    const mod = await import("./onboarding-drip");
    const result = await mod.scheduleOnboardingSequence(1, "test@example.com");
    expect(result).toBeUndefined();
  });

  it("processOnboardingEmails deve retornar objeto com enviados e falhas", async () => {
    const mod = await import("./onboarding-drip");
    const result = await mod.processOnboardingEmails();
    expect(result).toHaveProperty("enviados");
    expect(result).toHaveProperty("falhas");
    expect(result).toHaveProperty("total");
    expect(typeof result.enviados).toBe("number");
    expect(typeof result.falhas).toBe("number");
  });

  it("cancelOnboardingSequence não deve lançar erro", async () => {
    const mod = await import("./onboarding-drip");
    await expect(mod.cancelOnboardingSequence(1)).resolves.not.toThrow();
  });
});
