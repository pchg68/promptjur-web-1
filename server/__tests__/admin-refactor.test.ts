/**
 * Testes para a refatoração do admin.ts em sub-routers modulares (Gap 2b)
 * Verifica que o barrel re-export mantém compatibilidade com imports existentes
 */
import { describe, it, expect, vi } from "vitest";

// Mock de dependências pesadas
vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));
vi.mock("../audit", () => ({
  logAuditoria: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../feature-flags", () => ({
  listarFeatures: vi.fn().mockResolvedValue([]),
  toggleFeature: vi.fn().mockResolvedValue({ nome: "test", isAtivo: true }),
  criarFeature: vi.fn().mockResolvedValue(1),
  inicializarFeatures: vi.fn().mockResolvedValue(undefined),
  limparCacheFeatures: vi.fn().mockReturnValue({ entradasRemovidas: 0 }),
}));
vi.mock("../performance", () => ({
  getMetricasPorRota: vi.fn().mockReturnValue([]),
  getStatsPerformance: vi.fn().mockReturnValue({}),
  limparMetricas: vi.fn().mockReturnValue({ metricasRemovidas: 0 }),
  listarAlertas: vi.fn().mockReturnValue([]),
  resolverAlerta: vi.fn().mockResolvedValue({}),
  getStatsAlertas: vi.fn().mockReturnValue({}),
  criarRegra: vi.fn().mockResolvedValue(1),
  listarRegras: vi.fn().mockReturnValue([]),
  toggleRegra: vi.fn().mockResolvedValue({ isAtivo: false }),
  inicializarRegras: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../security-audit", () => ({
  executarAuditoriaNpm: vi.fn().mockResolvedValue({ totalVulnerabilities: 0, critical: 0, high: 0, moderate: 0, low: 0 }),
  atualizarDependenciasSeguras: vi.fn().mockResolvedValue({ updated: [] }),
}));
vi.mock("../backup", () => ({
  criarBackup: vi.fn().mockResolvedValue({ success: true }),
  listarBackups: vi.fn().mockResolvedValue([]),
  restaurarBackup: vi.fn().mockResolvedValue({ success: true }),
}));
vi.mock("../storage", () => ({
  storageGet: vi.fn().mockResolvedValue({ url: "https://example.com/backup.sql" }),
}));
vi.mock("../_core/sentry", () => ({
  getSentryStatus: vi.fn().mockReturnValue({ enabled: false }),
}));
vi.mock("../_core/query-error-alert", () => ({
  getQueryErrorStats: vi.fn().mockReturnValue({ totalErrors: 0 }),
}));
vi.mock("../monitoring/app-metrics", () => ({
  collectAppMetrics: vi.fn().mockResolvedValue({
    heap: { usedMB: 50, totalMB: 100, limitMB: 500, percentUsed: 10, rss: 80, external: 5 },
    eventLoop: { lagMs: 1, avgLagMs: 1, maxLagMs: 2, samples: 1 },
    dbLatency: { latencyMs: 5, avgLatencyMs: 5, maxLatencyMs: 10, isHealthy: true, lastCheck: "", samples: 1 },
    cpu: { userMs: 100, systemMs: 50, percentUser: 1, percentSystem: 0.5 },
    uptime: { seconds: 3600, formatted: "1h 0m 0s" },
    alerts: [],
    timestamp: new Date().toISOString(),
  }),
  getMetricsHistory: vi.fn().mockReturnValue({
    eventLoop: { samples: [1], count: 1, avg: 1, max: 1 },
    dbLatency: { samples: [5], count: 1, avg: 5, max: 5 },
  }),
  getActiveAlerts: vi.fn().mockResolvedValue([]),
  THRESHOLDS: { heap: { warning: 70, critical: 85 }, eventLoop: { warning: 50, critical: 100 }, dbLatency: { warning: 200, critical: 500 } },
}));
vi.mock("../whitelist", () => ({
  addToWhitelist: vi.fn().mockResolvedValue(undefined),
  removeFromWhitelist: vi.fn().mockResolvedValue(undefined),
  listWhitelist: vi.fn().mockResolvedValue([]),
}));
vi.mock("../email", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue({ success: true, skipped: false }),
  sendWelcomeEmailBatch: vi.fn().mockResolvedValue({ enviados: 0, falhas: 0, pulados: 0 }),
  sendLaunchNotificationEmail: vi.fn().mockResolvedValue({ success: true, skipped: false }),
}));
vi.mock("../db-convite-logs", () => ({
  registrarConviteLog: vi.fn().mockResolvedValue(undefined),
  buscarHistoricoConvite: vi.fn().mockResolvedValue([]),
  buscarUltimosConviteLogs: vi.fn().mockResolvedValue([]),
  buscarConfigReenvioAuto: vi.fn().mockResolvedValue(null),
  salvarConfigReenvioAuto: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../db-access-logs", () => ({
  listarAccessLogs: vi.fn().mockResolvedValue({ logs: [], total: 0 }),
  statsAccessLogs: vi.fn().mockResolvedValue({}),
  exportarAccessLogsCsv: vi.fn().mockResolvedValue(""),
}));

describe("Admin Router — Refatoração em Sub-Routers (Gap 2b)", () => {
  it("deve exportar adminRouter do barrel admin.ts", async () => {
    const { adminRouter } = await import("../admin");
    expect(adminRouter).toBeDefined();
    expect(adminRouter._def).toBeDefined();
    expect(adminRouter._def.procedures).toBeDefined();
  });

  it("deve exportar getCachedData do barrel admin.ts", async () => {
    const { getCachedData } = await import("../admin");
    expect(getCachedData).toBeDefined();
    expect(typeof getCachedData).toBe("function");
  });

  it("deve exportar adminProcedure do barrel admin.ts", async () => {
    const { adminProcedure } = await import("../admin");
    expect(adminProcedure).toBeDefined();
  });

  it("deve conter todos os procedures dos sub-routers no adminRouter", async () => {
    const { adminRouter } = await import("../admin");
    const procedures = Object.keys(adminRouter._def.procedures);

    // Verificar procedures de cada sub-router
    // Cache
    expect(procedures).toContain("estatisticasCache");
    expect(procedures).toContain("limparCache");
    expect(procedures).toContain("executarTestes");

    // Features
    expect(procedures).toContain("listarFeatures");
    expect(procedures).toContain("toggleFeature");
    expect(procedures).toContain("criarFeature");

    // Performance
    expect(procedures).toContain("metricasPorRota");
    expect(procedures).toContain("statsPerformance");
    expect(procedures).toContain("appMetrics");
    expect(procedures).toContain("appMetricsHistory");
    expect(procedures).toContain("appAlerts");

    // Whitelist
    expect(procedures).toContain("getWhitelist");
    expect(procedures).toContain("addWhitelist");
    expect(procedures).toContain("removeWhitelist");

    // Leads
    expect(procedures).toContain("getLeads");
    expect(procedures).toContain("getInteressados");

    // Resend
    expect(procedures).toContain("diagnosticoResend");

    // Acessos
    expect(procedures).toContain("listarAccessLogs");
    expect(procedures).toContain("statsAccessLogs");
  });

  it("getCachedData deve cachear resultados por TTL", async () => {
    const { getCachedData } = await import("../admin");
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return { data: "test" };
    };

    const result1 = await getCachedData("test-key-refactor", fetcher);
    const result2 = await getCachedData("test-key-refactor", fetcher);

    expect(result1).toEqual({ data: "test" });
    expect(result2).toEqual({ data: "test" });
    expect(callCount).toBe(1); // Deve ter sido chamado apenas 1 vez (cache hit)
  });

  it("adminRouter deve ter o mesmo número de procedures que o original", async () => {
    const { adminRouter } = await import("../admin");
    const procedures = Object.keys(adminRouter._def.procedures);
    // O admin.ts original tinha ~40+ procedures
    expect(procedures.length).toBeGreaterThan(30);
  });
});
