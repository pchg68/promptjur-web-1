import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock do logger
vi.mock("../server/_core/logger", () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("abuse-detection", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("deve permitir requisições dentro do limite", async () => {
    const { checkAiRateLimit } = await import("../server/abuse-detection");
    // Primeira requisição deve passar
    expect(() => checkAiRateLimit(1)).not.toThrow();
  });

  it("deve bloquear após exceder limite de operações de IA", async () => {
    const { checkAiRateLimit } = await import("../server/abuse-detection");
    // Fazer 10 requisições (limite)
    for (let i = 0; i < 10; i++) {
      checkAiRateLimit(999);
    }
    // A 11ª deve falhar
    expect(() => checkAiRateLimit(999)).toThrow("Muitas requisições");
  });

  it("deve permitir requisições de API dentro do limite", async () => {
    const { checkApiRateLimit } = await import("../server/abuse-detection");
    expect(() => checkApiRateLimit("192.168.1.1")).not.toThrow();
  });

  it("deve bloquear IP após exceder limite de API", async () => {
    const { checkApiRateLimit } = await import("../server/abuse-detection");
    // Fazer 120 requisições (limite)
    for (let i = 0; i < 120; i++) {
      checkApiRateLimit("10.0.0.99");
    }
    // A 121ª deve falhar
    expect(() => checkApiRateLimit("10.0.0.99")).toThrow("Muitas requisições");
  });

  it("deve rastrear fingerprints e detectar múltiplas contas", async () => {
    const { trackDeviceFingerprint } = await import("../server/abuse-detection");
    
    // Primeira conta - não suspeito
    const r1 = trackDeviceFingerprint(1, "1.2.3.4", "Mozilla/5.0");
    expect(r1.suspicious).toBe(false);
    expect(r1.accountCount).toBe(1);

    // Segunda conta mesmo dispositivo - não suspeito ainda
    const r2 = trackDeviceFingerprint(2, "1.2.3.4", "Mozilla/5.0");
    expect(r2.suspicious).toBe(false);
    expect(r2.accountCount).toBe(2);

    // Terceira conta - não suspeito
    const r3 = trackDeviceFingerprint(3, "1.2.3.4", "Mozilla/5.0");
    expect(r3.suspicious).toBe(false);
    expect(r3.accountCount).toBe(3);

    // Quarta conta - agora é suspeito (> 3)
    const r4 = trackDeviceFingerprint(4, "1.2.3.4", "Mozilla/5.0");
    expect(r4.suspicious).toBe(true);
    expect(r4.accountCount).toBe(4);
  });

  it("deve retornar estatísticas de abuso", async () => {
    const { getAbuseStats } = await import("../server/abuse-detection");
    const stats = getAbuseStats();
    expect(stats).toHaveProperty("activeUserLimits");
    expect(stats).toHaveProperty("activeIpLimits");
    expect(stats).toHaveProperty("trackedFingerprints");
    expect(stats).toHaveProperty("blockedUsers");
    expect(stats).toHaveProperty("blockedIps");
  });

  it("deve verificar login rate limit", async () => {
    const { checkLoginRateLimit } = await import("../server/abuse-detection");
    expect(() => checkLoginRateLimit("192.168.1.100")).not.toThrow();
  });

  it("deve bloquear login após muitas tentativas", async () => {
    const { checkLoginRateLimit } = await import("../server/abuse-detection");
    // Fazer 10 tentativas (limite)
    for (let i = 0; i < 10; i++) {
      checkLoginRateLimit("10.0.0.200");
    }
    // A 11ª deve falhar
    expect(() => checkLoginRateLimit("10.0.0.200")).toThrow("Muitas tentativas de login");
  });
});
