/**
 * App Metrics — Monitoramento de Saúde da Aplicação
 * 
 * Coleta métricas de:
 * - Heap memory (usage, limit, % utilizado)
 * - Event loop lag (delay entre ticks)
 * - Database latency (tempo de resposta do SELECT 1)
 * - Uptime do processo
 * - CPU usage
 * 
 * Expõe alertas quando:
 * - Heap > 80% do limite
 * - Event loop lag > 100ms
 * - DB latency > 500ms (após grace period de startup)
 */

import { getDb } from "../db";
import { sql } from "drizzle-orm";
import * as v8Module from "v8";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface HeapMetrics {
  usedMB: number;
  totalMB: number;
  limitMB: number;
  percentUsed: number;
  rss: number;
  external: number;
}

export interface EventLoopMetrics {
  lagMs: number;
  /** Média dos últimos N samples */
  avgLagMs: number;
  maxLagMs: number;
  samples: number;
}

export interface DbLatencyMetrics {
  latencyMs: number;
  avgLatencyMs: number;
  maxLatencyMs: number;
  isHealthy: boolean;
  lastCheck: string;
  samples: number;
  /** Indica se a medição foi feita durante cold start (reconexão TLS) */
  wasColdStart: boolean;
}

export interface CpuMetrics {
  userMs: number;
  systemMs: number;
  percentUser: number;
  percentSystem: number;
}

export interface AppMetricsSnapshot {
  heap: HeapMetrics;
  eventLoop: EventLoopMetrics;
  dbLatency: DbLatencyMetrics;
  cpu: CpuMetrics;
  uptime: {
    seconds: number;
    formatted: string;
  };
  alerts: AppAlert[];
  timestamp: string;
}

export interface AppAlert {
  level: 'warning' | 'critical';
  metric: string;
  message: string;
  value: number;
  threshold: number;
}

// ─── Configuração de Thresholds ──────────────────────────────────────────────

export const THRESHOLDS = {
  heap: {
    warning: 70,   // % do limite
    critical: 85,
  },
  eventLoop: {
    warning: 50,    // ms
    critical: 100,
  },
  dbLatency: {
    warning: 500,   // ms
    critical: 2000, // ms (ajustado para tolerar reconexão TLS ocasional)
  },
} as const;

/**
 * Grace period após startup do processo.
 * Durante os primeiros 3 minutos, alertas de DB latency são suprimidos
 * porque o Cloud Run (min-instances=0) faz cold start completo e
 * a primeira conexão TLS pode levar 2-7 segundos.
 */
const STARTUP_GRACE_PERIOD_MS = 3 * 60 * 1000; // 3 minutos
const processStartTime = Date.now();

/**
 * Número mínimo de samples antes de gerar alertas de DB.
 * Evita falsos positivos quando o monitor acabou de iniciar.
 */
const MIN_SAMPLES_FOR_ALERT = 3;

// ─── Histórico de Amostras ──────────────────────────────────────────────────

const MAX_SAMPLES = 60; // últimos 60 samples (1 por minuto = 1h de histórico)

const eventLoopSamples: number[] = [];
const dbLatencySamples: number[] = [];

/** Contador de cold starts detectados para diagnóstico */
let coldStartCount = 0;

let lastCpuUsage = process.cpuUsage();
let lastCpuTime = Date.now();

// ─── Coleta de Métricas ─────────────────────────────────────────────────────

export function getHeapMetrics(): HeapMetrics {
  const mem = process.memoryUsage();
  const heapStats = v8Module.getHeapStatistics();
  
  const usedMB = Math.round(mem.heapUsed / 1024 / 1024 * 100) / 100;
  const totalMB = Math.round(mem.heapTotal / 1024 / 1024 * 100) / 100;
  const limitMB = Math.round(heapStats.heap_size_limit / 1024 / 1024 * 100) / 100;
  const percentUsed = Math.round((mem.heapUsed / heapStats.heap_size_limit) * 100 * 100) / 100;
  
  return {
    usedMB,
    totalMB,
    limitMB,
    percentUsed,
    rss: Math.round(mem.rss / 1024 / 1024 * 100) / 100,
    external: Math.round(mem.external / 1024 / 1024 * 100) / 100,
  };
}

export async function measureEventLoopLag(): Promise<number> {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint();
    setImmediate(() => {
      const end = process.hrtime.bigint();
      const lagNs = Number(end - start);
      const lagMs = Math.round(lagNs / 1_000_000 * 100) / 100;
      resolve(lagMs);
    });
  });
}

/**
 * Mede a latência do banco de dados.
 * 
 * Estratégia de cold start:
 * 1. Faz SELECT 1 e mede o tempo
 * 2. Se > 1500ms, detecta como cold start (reconexão TLS)
 * 3. Faz retry imediato para obter latência real da conexão quente
 * 4. Retorna a latência do retry (warm) e marca wasColdStart=true
 * 5. O cold start NÃO é adicionado ao histórico de samples
 * 
 * @returns {{ latencyMs: number, wasColdStart: boolean }}
 */
export async function measureDbLatency(): Promise<{ latencyMs: number; wasColdStart: boolean }> {
  const start = Date.now();
  try {
    const dbConn = await getDb();
    if (!dbConn) return { latencyMs: -1, wasColdStart: false };
    
    await dbConn.execute(sql`SELECT 1`);
    const firstLatency = Date.now() - start;
    
    // Cold start detection: se > 1500ms, provavelmente é reconexão TLS
    if (firstLatency > 1500) {
      coldStartCount++;
      
      // Retry para obter latência real da conexão quente
      const retryStart = Date.now();
      await dbConn.execute(sql`SELECT 1`);
      const retryLatency = Date.now() - retryStart;
      
      console.warn(
        `[AppHealth] DB cold start #${coldStartCount} detectado: ${firstLatency}ms → retry: ${retryLatency}ms. ` +
        `Pool reconectou após idle timeout.`
      );
      
      // Retornar a latência real (warm), marcando como cold start
      return { latencyMs: retryLatency, wasColdStart: true };
    }
    
    return { latencyMs: firstLatency, wasColdStart: false };
  } catch {
    return { latencyMs: -1, wasColdStart: false };
  }
}

export function getCpuMetrics(): CpuMetrics {
  const now = Date.now();
  const elapsed = now - lastCpuTime;
  const currentUsage = process.cpuUsage(lastCpuUsage);
  
  // Atualizar referência
  lastCpuUsage = process.cpuUsage();
  lastCpuTime = now;
  
  const elapsedMicros = elapsed * 1000; // converter ms para microsegundos
  
  return {
    userMs: Math.round(currentUsage.user / 1000),
    systemMs: Math.round(currentUsage.system / 1000),
    percentUser: elapsedMicros > 0 ? Math.round((currentUsage.user / elapsedMicros) * 100 * 100) / 100 : 0,
    percentSystem: elapsedMicros > 0 ? Math.round((currentUsage.system / elapsedMicros) * 100 * 100) / 100 : 0,
  };
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  
  return parts.join(' ');
}

function addSample(arr: number[], value: number): void {
  arr.push(value);
  if (arr.length > MAX_SAMPLES) {
    arr.shift();
  }
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 100) / 100;
}

function max(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.max(...arr);
}

// ─── Verificação de Grace Period ────────────────────────────────────────────

/**
 * Verifica se o processo ainda está no grace period de startup.
 * Durante o grace period, alertas de DB latency são suprimidos.
 */
function isInStartupGracePeriod(): boolean {
  return (Date.now() - processStartTime) < STARTUP_GRACE_PERIOD_MS;
}

// ─── Geração de Alertas ─────────────────────────────────────────────────────

function generateAlerts(
  heap: HeapMetrics, 
  eventLoop: EventLoopMetrics, 
  dbLatency: DbLatencyMetrics
): AppAlert[] {
  const alerts: AppAlert[] = [];
  
  // Heap alerts
  if (heap.percentUsed >= THRESHOLDS.heap.critical) {
    alerts.push({
      level: 'critical',
      metric: 'heap_memory',
      message: `Heap memory em ${heap.percentUsed}% do limite (${heap.usedMB}MB / ${heap.limitMB}MB)`,
      value: heap.percentUsed,
      threshold: THRESHOLDS.heap.critical,
    });
  } else if (heap.percentUsed >= THRESHOLDS.heap.warning) {
    alerts.push({
      level: 'warning',
      metric: 'heap_memory',
      message: `Heap memory em ${heap.percentUsed}% do limite (${heap.usedMB}MB / ${heap.limitMB}MB)`,
      value: heap.percentUsed,
      threshold: THRESHOLDS.heap.warning,
    });
  }
  
  // Event loop alerts
  if (eventLoop.lagMs >= THRESHOLDS.eventLoop.critical) {
    alerts.push({
      level: 'critical',
      metric: 'event_loop_lag',
      message: `Event loop lag de ${eventLoop.lagMs}ms (limite: ${THRESHOLDS.eventLoop.critical}ms)`,
      value: eventLoop.lagMs,
      threshold: THRESHOLDS.eventLoop.critical,
    });
  } else if (eventLoop.lagMs >= THRESHOLDS.eventLoop.warning) {
    alerts.push({
      level: 'warning',
      metric: 'event_loop_lag',
      message: `Event loop lag de ${eventLoop.lagMs}ms (limite: ${THRESHOLDS.eventLoop.warning}ms)`,
      value: eventLoop.lagMs,
      threshold: THRESHOLDS.eventLoop.warning,
    });
  }
  
  // DB latency alerts — com proteções contra falsos positivos
  const inGracePeriod = isInStartupGracePeriod();
  const hasEnoughSamples = dbLatency.samples >= MIN_SAMPLES_FOR_ALERT;
  
  if (dbLatency.latencyMs < 0) {
    // DB indisponível — sempre alertar (exceto no grace period)
    if (!inGracePeriod) {
      alerts.push({
        level: 'critical',
        metric: 'db_latency',
        message: 'Banco de dados indisponível',
        value: -1,
        threshold: 0,
      });
    }
  } else if (dbLatency.wasColdStart) {
    // Cold start detectado — logar mas NÃO gerar alerta crítico
    // O retry já retornou a latência real (warm)
    if (dbLatency.latencyMs >= THRESHOLDS.dbLatency.warning) {
      alerts.push({
        level: 'warning',
        metric: 'db_latency',
        message: `DB latency de ${dbLatency.latencyMs}ms após cold start (reconexão TLS detectada, cold starts: ${coldStartCount})`,
        value: dbLatency.latencyMs,
        threshold: THRESHOLDS.dbLatency.warning,
      });
    }
  } else if (!inGracePeriod && hasEnoughSamples) {
    // Medição normal (não cold start, fora do grace period, com samples suficientes)
    if (dbLatency.latencyMs >= THRESHOLDS.dbLatency.critical) {
      alerts.push({
        level: 'critical',
        metric: 'db_latency',
        message: `DB latency de ${dbLatency.latencyMs}ms (limite: ${THRESHOLDS.dbLatency.critical}ms)`,
        value: dbLatency.latencyMs,
        threshold: THRESHOLDS.dbLatency.critical,
      });
    } else if (dbLatency.latencyMs >= THRESHOLDS.dbLatency.warning) {
      alerts.push({
        level: 'warning',
        metric: 'db_latency',
        message: `DB latency de ${dbLatency.latencyMs}ms (limite: ${THRESHOLDS.dbLatency.warning}ms)`,
        value: dbLatency.latencyMs,
        threshold: THRESHOLDS.dbLatency.warning,
      });
    }
  } else if (inGracePeriod && dbLatency.latencyMs >= THRESHOLDS.dbLatency.critical) {
    // No grace period mas com latência muito alta — logar warning informativo
    const remainingGrace = Math.round((STARTUP_GRACE_PERIOD_MS - (Date.now() - processStartTime)) / 1000);
    console.log(
      `[AppHealth] DB latency ${dbLatency.latencyMs}ms durante grace period (${remainingGrace}s restantes). ` +
      `Alerta suprimido — aguardando estabilização pós-startup.`
    );
  }
  
  return alerts;
}

// ─── API Pública ────────────────────────────────────────────────────────────

/**
 * Coleta todas as métricas de saúde da aplicação em um snapshot
 */
export async function collectAppMetrics(): Promise<AppMetricsSnapshot> {
  // Coletar em paralelo
  const [eventLoopLag, dbResult] = await Promise.all([
    measureEventLoopLag(),
    measureDbLatency(),
  ]);
  
  // Adicionar samples — NÃO adicionar cold starts ao histórico
  addSample(eventLoopSamples, eventLoopLag);
  if (dbResult.latencyMs >= 0 && !dbResult.wasColdStart) {
    addSample(dbLatencySamples, dbResult.latencyMs);
  }
  
  const heap = getHeapMetrics();
  const cpu = getCpuMetrics();
  
  const eventLoopMetrics: EventLoopMetrics = {
    lagMs: eventLoopLag,
    avgLagMs: avg(eventLoopSamples),
    maxLagMs: max(eventLoopSamples),
    samples: eventLoopSamples.length,
  };
  
  const dbLatencyMetrics: DbLatencyMetrics = {
    latencyMs: dbResult.latencyMs,
    avgLatencyMs: avg(dbLatencySamples),
    maxLatencyMs: max(dbLatencySamples),
    isHealthy: dbResult.latencyMs >= 0 && dbResult.latencyMs < THRESHOLDS.dbLatency.critical,
    lastCheck: new Date().toISOString(),
    samples: dbLatencySamples.length,
    wasColdStart: dbResult.wasColdStart,
  };
  
  const uptimeSeconds = process.uptime();
  
  const alerts = generateAlerts(heap, eventLoopMetrics, dbLatencyMetrics);
  
  return {
    heap,
    eventLoop: eventLoopMetrics,
    dbLatency: dbLatencyMetrics,
    cpu,
    uptime: {
      seconds: Math.round(uptimeSeconds),
      formatted: formatUptime(uptimeSeconds),
    },
    alerts,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Retorna apenas os alertas ativos (sem coletar todas as métricas)
 */
export async function getActiveAlerts(): Promise<AppAlert[]> {
  const snapshot = await collectAppMetrics();
  return snapshot.alerts;
}

/**
 * Retorna o histórico de samples para gráficos
 */
export function getMetricsHistory() {
  return {
    eventLoop: {
      samples: [...eventLoopSamples],
      count: eventLoopSamples.length,
      avg: avg(eventLoopSamples),
      max: max(eventLoopSamples),
    },
    dbLatency: {
      samples: [...dbLatencySamples],
      count: dbLatencySamples.length,
      avg: avg(dbLatencySamples),
      max: max(dbLatencySamples),
    },
    coldStarts: coldStartCount,
  };
}
