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
 * - DB latency > 500ms
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

// ─── Histórico de Amostras ──────────────────────────────────────────────────

const MAX_SAMPLES = 60; // últimos 60 samples (1 por minuto = 1h de histórico)

const eventLoopSamples: number[] = [];
const dbLatencySamples: number[] = [];

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
 * Se a primeira tentativa for muito lenta (cold start / reconexão TLS),
 * faz uma segunda medição para obter a latência real da conexão quente.
 */
export async function measureDbLatency(): Promise<number> {
  const start = Date.now();
  try {
    const dbConn = await getDb();
    if (!dbConn) return -1; // DB não disponível
    
    await dbConn.execute(sql`SELECT 1`);
    const firstLatency = Date.now() - start;
    
    // Se a primeira medição for > 2s, provavelmente é cold start (reconexão TLS).
    // Faz uma segunda medição para obter a latência real.
    if (firstLatency > 2000) {
      const retryStart = Date.now();
      await dbConn.execute(sql`SELECT 1`);
      const retryLatency = Date.now() - retryStart;
      
      // Logar o cold start para diagnóstico
      console.warn(
        `[AppHealth] DB cold start detectado: ${firstLatency}ms (retry: ${retryLatency}ms). ` +
        `Pool reconectou após idle timeout.`
      );
      
      // Retornar a latência real (warm), não o cold start
      return retryLatency;
    }
    
    return firstLatency;
  } catch {
    return -1;
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

// ─── Geração de Alertas ─────────────────────────────────────────────────────

function generateAlerts(heap: HeapMetrics, eventLoop: EventLoopMetrics, dbLatency: DbLatencyMetrics): AppAlert[] {
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
  
  // DB latency alerts
  if (dbLatency.latencyMs < 0) {
    alerts.push({
      level: 'critical',
      metric: 'db_latency',
      message: 'Banco de dados indisponível',
      value: -1,
      threshold: 0,
    });
  } else if (dbLatency.latencyMs >= THRESHOLDS.dbLatency.critical) {
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
  
  return alerts;
}

// ─── API Pública ────────────────────────────────────────────────────────────

/**
 * Coleta todas as métricas de saúde da aplicação em um snapshot
 */
export async function collectAppMetrics(): Promise<AppMetricsSnapshot> {
  // Coletar em paralelo
  const [eventLoopLag, dbLatency] = await Promise.all([
    measureEventLoopLag(),
    measureDbLatency(),
  ]);
  
  // Adicionar samples
  addSample(eventLoopSamples, eventLoopLag);
  if (dbLatency >= 0) {
    addSample(dbLatencySamples, dbLatency);
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
    latencyMs: dbLatency,
    avgLatencyMs: avg(dbLatencySamples),
    maxLatencyMs: max(dbLatencySamples),
    isHealthy: dbLatency >= 0 && dbLatency < THRESHOLDS.dbLatency.critical,
    lastCheck: new Date().toISOString(),
    samples: dbLatencySamples.length,
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
  };
}
