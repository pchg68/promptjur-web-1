/**
 * Testes unitários para o módulo de monitoramento de app (Gap 3)
 * Verifica: heap metrics, event loop lag, CPU metrics, alertas, thresholds
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do getDb para evitar conexão real
vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

describe("App Metrics — Monitoramento de Saúde", () => {
  let appMetrics: typeof import("../monitoring/app-metrics");

  beforeEach(async () => {
    vi.resetModules();
    vi.mock("../db", () => ({
      getDb: vi.fn().mockResolvedValue(null),
    }));
    appMetrics = await import("../monitoring/app-metrics");
  });

  describe("getHeapMetrics()", () => {
    it("deve retornar métricas de heap válidas", async () => {
      const metrics = appMetrics.getHeapMetrics();
      expect(metrics).toHaveProperty("usedMB");
      expect(metrics).toHaveProperty("totalMB");
      expect(metrics).toHaveProperty("limitMB");
      expect(metrics).toHaveProperty("percentUsed");
      expect(metrics).toHaveProperty("rss");
      expect(metrics).toHaveProperty("external");

      expect(metrics.usedMB).toBeGreaterThan(0);
      expect(metrics.totalMB).toBeGreaterThan(0);
      expect(metrics.limitMB).toBeGreaterThan(0);
      expect(metrics.percentUsed).toBeGreaterThan(0);
      expect(metrics.percentUsed).toBeLessThan(100);
    });

    it("deve retornar valores em MB (não bytes)", () => {
      const metrics = appMetrics.getHeapMetrics();
      // Heap usado deve ser < 2000 MB em ambiente de teste
      expect(metrics.usedMB).toBeLessThan(2000);
      expect(metrics.totalMB).toBeLessThan(5000);
    });
  });

  describe("measureEventLoopLag()", () => {
    it("deve retornar latência em ms >= 0", async () => {
      const lag = await appMetrics.measureEventLoopLag();
      expect(lag).toBeGreaterThanOrEqual(0);
      // Em ambiente de teste sem carga, deve ser < 50ms
      expect(lag).toBeLessThan(50);
    });
  });

  describe("measureDbLatency()", () => {
    it("deve retornar -1 quando DB não está disponível", async () => {
      const latency = await appMetrics.measureDbLatency();
      // getDb mockado retorna null
      expect(latency).toBe(-1);
    });
  });

  describe("getCpuMetrics()", () => {
    it("deve retornar métricas de CPU válidas", () => {
      const cpu = appMetrics.getCpuMetrics();
      expect(cpu).toHaveProperty("userMs");
      expect(cpu).toHaveProperty("systemMs");
      expect(cpu).toHaveProperty("percentUser");
      expect(cpu).toHaveProperty("percentSystem");
      expect(cpu.percentUser).toBeGreaterThanOrEqual(0);
      expect(cpu.percentSystem).toBeGreaterThanOrEqual(0);
    });
  });

  describe("collectAppMetrics()", () => {
    it("deve retornar snapshot completo com todas as seções", async () => {
      const snapshot = await appMetrics.collectAppMetrics();

      expect(snapshot).toHaveProperty("heap");
      expect(snapshot).toHaveProperty("eventLoop");
      expect(snapshot).toHaveProperty("dbLatency");
      expect(snapshot).toHaveProperty("cpu");
      expect(snapshot).toHaveProperty("uptime");
      expect(snapshot).toHaveProperty("alerts");
      expect(snapshot).toHaveProperty("timestamp");

      // Uptime
      expect(snapshot.uptime.seconds).toBeGreaterThanOrEqual(0);
      expect(snapshot.uptime.formatted).toMatch(/\d+[dhms]/);

      // Timestamp ISO
      expect(new Date(snapshot.timestamp).getTime()).toBeGreaterThan(0);
    });

    it("deve gerar alerta crítico quando DB está indisponível", async () => {
      const snapshot = await appMetrics.collectAppMetrics();
      const dbAlert = snapshot.alerts.find(a => a.metric === "db_latency");
      expect(dbAlert).toBeDefined();
      expect(dbAlert!.level).toBe("critical");
      expect(dbAlert!.message).toContain("indisponível");
    });
  });

  describe("getMetricsHistory()", () => {
    it("deve retornar histórico de samples", async () => {
      // Coletar uma vez para popular samples
      await appMetrics.collectAppMetrics();

      const history = appMetrics.getMetricsHistory();
      expect(history).toHaveProperty("eventLoop");
      expect(history).toHaveProperty("dbLatency");
      expect(history.eventLoop.samples.length).toBeGreaterThan(0);
      expect(history.eventLoop.count).toBeGreaterThan(0);
    });
  });

  describe("THRESHOLDS", () => {
    it("deve ter thresholds definidos para heap, eventLoop e dbLatency", () => {
      const t = appMetrics.THRESHOLDS;
      expect(t.heap.warning).toBe(70);
      expect(t.heap.critical).toBe(85);
      expect(t.eventLoop.warning).toBe(50);
      expect(t.eventLoop.critical).toBe(100);
      expect(t.dbLatency.warning).toBe(200);
      expect(t.dbLatency.critical).toBe(500);
    });
  });

  describe("getActiveAlerts()", () => {
    it("deve retornar array de alertas", async () => {
      const alerts = await appMetrics.getActiveAlerts();
      expect(Array.isArray(alerts)).toBe(true);
      // Com DB mockado como null, deve ter pelo menos o alerta de DB
      expect(alerts.length).toBeGreaterThanOrEqual(1);
    });
  });
});
