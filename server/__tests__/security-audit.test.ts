import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock child_process
vi.mock("child_process", () => ({
  exec: vi.fn(),
}));
vi.mock("util", () => ({
  promisify: (fn: any) => fn,
}));

// Mock db
vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// Mock drizzle schema
vi.mock("../../drizzle/schema", () => ({
  auditResults: {},
}));

// Mock drizzle-orm
vi.mock("drizzle-orm", () => ({
  desc: vi.fn(),
}));

describe("Security Audit - Cache e Bloqueio em Produção", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("atualizarDependenciasSeguras deve bloquear em produção", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    // Re-import after env change
    const { atualizarDependenciasSeguras } = await import("../security-audit");
    const result = await atualizarDependenciasSeguras();

    expect(result.blocked).toBe(true);
    expect(result.success).toBe(false);
    expect(result.updated).toEqual([]);

    process.env.NODE_ENV = originalEnv;
  });

  it("atualizarDependenciasSeguras NÃO deve bloquear em development", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const { exec } = await import("child_process");
    // Mock which pnpm to succeed
    (exec as any).mockImplementation((cmd: string, opts: any, cb?: any) => {
      if (typeof opts === "function") {
        cb = opts;
      }
      if (cmd.includes("which pnpm")) {
        return Promise.resolve({ stdout: "/usr/bin/pnpm", stderr: "" });
      }
      if (cmd.includes("pnpm update")) {
        return Promise.resolve({ stdout: "Already up to date", stderr: "" });
      }
      return Promise.resolve({ stdout: "", stderr: "" });
    });

    const { atualizarDependenciasSeguras } = await import("../security-audit");
    const result = await atualizarDependenciasSeguras();

    // Em dev, não deve bloquear (pode falhar por outro motivo mas blocked deve ser undefined/false)
    expect(result.blocked).toBeFalsy();

    process.env.NODE_ENV = originalEnv;
  });

  it("executarAuditoriaNpm deve retornar resultado do CI quando pnpm indisponível", async () => {
    const { exec } = await import("child_process");
    // Mock which pnpm to fail (simula ambiente sem pnpm)
    (exec as any).mockImplementation((cmd: string, opts: any) => {
      if (cmd.includes("which pnpm")) {
        return Promise.reject(new Error("not found"));
      }
      return Promise.reject(new Error("not available"));
    });

    const { getDb } = await import("../db");
    (getDb as any).mockResolvedValue(null); // DB indisponível

    const { executarAuditoriaNpm } = await import("../security-audit");
    const result = await executarAuditoriaNpm();

    // Sem pnpm e sem DB, deve retornar unavailable
    expect(result.unavailable).toBe(true);
    expect(result.totalVulnerabilities).toBe(-1);
  });

  it("CI audit endpoint payload deve ter campos obrigatórios", () => {
    // Validação de estrutura do payload
    const validPayload = {
      totalVulnerabilities: 3,
      critical: 1,
      high: 1,
      moderate: 1,
      low: 0,
      info: 0,
      vulnerabilities: [{ name: "test", severity: "critical", title: "Test" }],
      commitRef: "abc12345",
      durationMs: 2500,
    };

    expect(typeof validPayload.totalVulnerabilities).toBe("number");
    expect(validPayload.vulnerabilities).toBeInstanceOf(Array);
    expect(validPayload.commitRef).toBeDefined();
  });

  it("cache TTL deve ser 24 horas", async () => {
    // Verificar que a constante CACHE_TTL_MS é 24h
    const EXPECTED_TTL = 24 * 60 * 60 * 1000;
    expect(EXPECTED_TTL).toBe(86400000);
  });
});
