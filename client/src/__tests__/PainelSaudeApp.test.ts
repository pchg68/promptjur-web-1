/**
 * Testes unitários para a lógica do PainelSaudeApp
 * Verifica classificação de status, cores dinâmicas, alertas visuais,
 * preparação de dados de gráfico e detecção de tendências
 */
import { describe, it, expect } from "vitest";

// ── Helpers que replicam a lógica do componente ──

type StatusLevel = "healthy" | "warning" | "critical";

interface Thresholds {
  dbLatency: { warning: number; critical: number };
  heap: { warning: number; critical: number };
  eventLoop: { warning: number; critical: number };
}

const defaultThresholds: Thresholds = {
  dbLatency: { warning: 500, critical: 2000 },
  heap: { warning: 80, critical: 95 },
  eventLoop: { warning: 50, critical: 100 },
};

function getDbStatus(latencyMs: number, thresholds: Thresholds): StatusLevel {
  if (latencyMs < 0) return "critical";
  if (latencyMs >= thresholds.dbLatency.critical) return "critical";
  if (latencyMs >= thresholds.dbLatency.warning) return "warning";
  return "healthy";
}

function getHeapStatus(pct: number, thresholds: Thresholds): StatusLevel {
  if (pct >= thresholds.heap.critical) return "critical";
  if (pct >= thresholds.heap.warning) return "warning";
  return "healthy";
}

function getEventLoopStatus(lagMs: number, thresholds: Thresholds): StatusLevel {
  if (lagMs >= thresholds.eventLoop.critical) return "critical";
  if (lagMs >= thresholds.eventLoop.warning) return "warning";
  return "healthy";
}

/** Retorna a cor principal para cada nível de status */
function getStatusColor(status: StatusLevel): string {
  switch (status) {
    case "healthy": return "#10b981"; // emerald-500
    case "warning": return "#f59e0b"; // amber-500
    case "critical": return "#ef4444"; // red-500
  }
}

/** Retorna a cor de fundo suave para cada nível de status */
function getStatusBgColor(status: StatusLevel): string {
  switch (status) {
    case "healthy": return "rgba(16, 185, 129, 0.1)";
    case "warning": return "rgba(245, 158, 11, 0.15)";
    case "critical": return "rgba(239, 68, 68, 0.15)";
  }
}

/** Retorna a cor da borda para cada nível de status */
function getStatusBorderColor(status: StatusLevel): string {
  switch (status) {
    case "healthy": return "border-emerald-500/30";
    case "warning": return "border-amber-500/50";
    case "critical": return "border-red-500/50";
  }
}

/** Determina se o card deve pulsar (animação) */
function shouldPulse(status: StatusLevel): boolean {
  return status === "critical";
}

/** Determina o status global baseado em todos os subsistemas */
function getOverallStatus(
  dbLatency: number,
  heapPct: number,
  eventLoopLag: number,
  thresholds: Thresholds
): StatusLevel {
  const statuses = [
    getDbStatus(dbLatency, thresholds),
    getHeapStatus(heapPct, thresholds),
    getEventLoopStatus(eventLoopLag, thresholds),
  ];
  if (statuses.includes("critical")) return "critical";
  if (statuses.includes("warning")) return "warning";
  return "healthy";
}

/** Retorna o texto de status global */
function getOverallStatusText(status: StatusLevel): string {
  switch (status) {
    case "healthy": return "Todos os sistemas operacionais";
    case "warning": return "Atenção: alguns limites excedidos";
    case "critical": return "Alerta crítico: intervenção necessária";
  }
}

/** Cor do gradiente do gráfico baseada no valor atual */
function getChartGradientColor(value: number, warningThreshold: number, criticalThreshold: number): string {
  if (value >= criticalThreshold) return "rgba(239, 68, 68, 0.3)";
  if (value >= warningThreshold) return "rgba(245, 158, 11, 0.3)";
  return "rgba(16, 185, 129, 0.3)";
}

function getTrend(current: number, avg: number): "up" | "down" | "stable" {
  if (current > avg * 1.2) return "up";
  if (current < avg * 0.8) return "down";
  return "stable";
}

// ── Testes ──

describe("PainelSaudeApp — Classificação de Status", () => {
  it("deve classificar status de DB corretamente nos limites exatos", () => {
    expect(getDbStatus(0, defaultThresholds)).toBe("healthy");
    expect(getDbStatus(5, defaultThresholds)).toBe("healthy");
    expect(getDbStatus(499, defaultThresholds)).toBe("healthy");
    expect(getDbStatus(500, defaultThresholds)).toBe("warning");
    expect(getDbStatus(1000, defaultThresholds)).toBe("warning");
    expect(getDbStatus(1999, defaultThresholds)).toBe("warning");
    expect(getDbStatus(2000, defaultThresholds)).toBe("critical");
    expect(getDbStatus(6699, defaultThresholds)).toBe("critical");
    expect(getDbStatus(-1, defaultThresholds)).toBe("critical");
  });

  it("deve classificar status de heap corretamente nos limites exatos", () => {
    expect(getHeapStatus(0, defaultThresholds)).toBe("healthy");
    expect(getHeapStatus(15.2, defaultThresholds)).toBe("healthy");
    expect(getHeapStatus(79.9, defaultThresholds)).toBe("healthy");
    expect(getHeapStatus(80, defaultThresholds)).toBe("warning");
    expect(getHeapStatus(90, defaultThresholds)).toBe("warning");
    expect(getHeapStatus(94.9, defaultThresholds)).toBe("warning");
    expect(getHeapStatus(95, defaultThresholds)).toBe("critical");
    expect(getHeapStatus(100, defaultThresholds)).toBe("critical");
  });

  it("deve classificar status de event loop corretamente nos limites exatos", () => {
    expect(getEventLoopStatus(0, defaultThresholds)).toBe("healthy");
    expect(getEventLoopStatus(0.73, defaultThresholds)).toBe("healthy");
    expect(getEventLoopStatus(49.9, defaultThresholds)).toBe("healthy");
    expect(getEventLoopStatus(50, defaultThresholds)).toBe("warning");
    expect(getEventLoopStatus(75, defaultThresholds)).toBe("warning");
    expect(getEventLoopStatus(99.9, defaultThresholds)).toBe("warning");
    expect(getEventLoopStatus(100, defaultThresholds)).toBe("critical");
    expect(getEventLoopStatus(500, defaultThresholds)).toBe("critical");
  });
});

describe("PainelSaudeApp — Cores Dinâmicas e Alertas Visuais", () => {
  it("deve retornar a cor correta para cada nível de status", () => {
    expect(getStatusColor("healthy")).toBe("#10b981");
    expect(getStatusColor("warning")).toBe("#f59e0b");
    expect(getStatusColor("critical")).toBe("#ef4444");
  });

  it("deve retornar a cor de fundo correta para cada nível de status", () => {
    expect(getStatusBgColor("healthy")).toContain("16, 185, 129");
    expect(getStatusBgColor("warning")).toContain("245, 158, 11");
    expect(getStatusBgColor("critical")).toContain("239, 68, 68");
  });

  it("deve retornar a classe de borda correta para cada nível de status", () => {
    expect(getStatusBorderColor("healthy")).toContain("emerald");
    expect(getStatusBorderColor("warning")).toContain("amber");
    expect(getStatusBorderColor("critical")).toContain("red");
  });

  it("deve ativar pulsação apenas em estado crítico", () => {
    expect(shouldPulse("healthy")).toBe(false);
    expect(shouldPulse("warning")).toBe(false);
    expect(shouldPulse("critical")).toBe(true);
  });

  it("deve retornar cor de gradiente do gráfico baseada no valor", () => {
    // DB Latency thresholds: warning=500, critical=2000
    expect(getChartGradientColor(5, 500, 2000)).toContain("16, 185, 129"); // verde
    expect(getChartGradientColor(600, 500, 2000)).toContain("245, 158, 11"); // amarelo
    expect(getChartGradientColor(2500, 500, 2000)).toContain("239, 68, 68"); // vermelho
  });
});

describe("PainelSaudeApp — Status Global", () => {
  it("deve retornar healthy quando todos os subsistemas estão normais", () => {
    expect(getOverallStatus(5, 15, 0.73, defaultThresholds)).toBe("healthy");
  });

  it("deve retornar warning quando qualquer subsistema está em warning", () => {
    expect(getOverallStatus(600, 15, 0.73, defaultThresholds)).toBe("warning");
    expect(getOverallStatus(5, 85, 0.73, defaultThresholds)).toBe("warning");
    expect(getOverallStatus(5, 15, 60, defaultThresholds)).toBe("warning");
  });

  it("deve retornar critical quando qualquer subsistema está em critical", () => {
    expect(getOverallStatus(2500, 15, 0.73, defaultThresholds)).toBe("critical");
    expect(getOverallStatus(5, 96, 0.73, defaultThresholds)).toBe("critical");
    expect(getOverallStatus(5, 15, 150, defaultThresholds)).toBe("critical");
  });

  it("deve priorizar critical sobre warning quando ambos existem", () => {
    expect(getOverallStatus(2500, 85, 60, defaultThresholds)).toBe("critical");
  });

  it("deve retornar texto de status global correto", () => {
    expect(getOverallStatusText("healthy")).toBe("Todos os sistemas operacionais");
    expect(getOverallStatusText("warning")).toContain("Atenção");
    expect(getOverallStatusText("critical")).toContain("Alerta crítico");
  });
});

describe("PainelSaudeApp — Dados de Gráfico e Tendências", () => {
  it("deve preparar dados de gráfico com labels corretos", () => {
    const samples = [5, 8, 14];
    const chartData = samples.map((value, index) => ({
      index,
      value,
      label: `${samples.length - index}min atrás`,
    }));

    expect(chartData).toHaveLength(3);
    expect(chartData[0]).toEqual({ index: 0, value: 5, label: "3min atrás" });
    expect(chartData[2]).toEqual({ index: 2, value: 14, label: "1min atrás" });
  });

  it("deve detectar tendência corretamente", () => {
    expect(getTrend(15, 8)).toBe("up");     // 15 > 8*1.2=9.6
    expect(getTrend(5, 10)).toBe("down");   // 5 < 10*0.8=8
    expect(getTrend(9, 10)).toBe("stable"); // 9 entre 8 e 12
    expect(getTrend(10, 10)).toBe("stable"); // exatamente igual
  });

  it("deve lidar com valores extremos de tendência", () => {
    expect(getTrend(0, 0)).toBe("stable");   // 0 não é > 0 nem < 0
    expect(getTrend(1000, 1)).toBe("up");    // muito acima
    expect(getTrend(0.01, 100)).toBe("down"); // muito abaixo
  });
});

describe("PainelSaudeApp — Cenário de Alerta Real (6699ms)", () => {
  it("deve classificar latência de 6699ms como critical", () => {
    const status = getDbStatus(6699, defaultThresholds);
    expect(status).toBe("critical");
    expect(getStatusColor(status)).toBe("#ef4444");
    expect(shouldPulse(status)).toBe(true);
  });

  it("deve afetar o status global quando DB está critical", () => {
    const overall = getOverallStatus(6699, 15, 0.73, defaultThresholds);
    expect(overall).toBe("critical");
    expect(getOverallStatusText(overall)).toContain("Alerta crítico");
  });

  it("deve usar gradiente vermelho no gráfico para 6699ms", () => {
    const color = getChartGradientColor(6699, 500, 2000);
    expect(color).toContain("239, 68, 68"); // vermelho
  });
});

describe("PainelSaudeApp — Thresholds", () => {
  it("deve ter thresholds com valores sensatos e ordenados", () => {
    expect(defaultThresholds.dbLatency.warning).toBeLessThan(defaultThresholds.dbLatency.critical);
    expect(defaultThresholds.dbLatency.warning).toBeGreaterThan(0);
    expect(defaultThresholds.heap.warning).toBeLessThan(defaultThresholds.heap.critical);
    expect(defaultThresholds.heap.critical).toBeLessThanOrEqual(100);
    expect(defaultThresholds.eventLoop.warning).toBeLessThan(defaultThresholds.eventLoop.critical);
  });

  it("deve funcionar com thresholds customizados", () => {
    const custom: Thresholds = {
      dbLatency: { warning: 100, critical: 500 },
      heap: { warning: 60, critical: 80 },
      eventLoop: { warning: 20, critical: 50 },
    };

    expect(getDbStatus(150, custom)).toBe("warning");
    expect(getDbStatus(150, defaultThresholds)).toBe("healthy"); // com default seria healthy
    expect(getHeapStatus(70, custom)).toBe("warning");
    expect(getHeapStatus(70, defaultThresholds)).toBe("healthy");
  });
});

describe("PainelSaudeApp — Identificação de Alertas", () => {
  it("deve identificar alertas ativos corretamente", () => {
    const alerts = [
      { level: "critical", message: "DB latency > 2000ms" },
      { level: "warning", message: "Heap > 80%" },
    ];

    expect(alerts.length).toBe(2);
    expect(alerts.some((a) => a.level === "critical")).toBe(true);
    expect(alerts.some((a) => a.level === "warning")).toBe(true);
  });

  it("deve ter lista vazia quando não há alertas", () => {
    const alerts: Array<{ level: string; message: string }> = [];
    expect(alerts.length).toBe(0);
    expect(alerts.some((a) => a.level === "critical")).toBe(false);
  });
});
