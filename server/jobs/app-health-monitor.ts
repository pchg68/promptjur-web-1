/**
 * App Health Monitor Job
 * 
 * Executa a cada 60 segundos:
 * - Coleta métricas de heap, event loop e DB latency
 * - Envia alerta ao owner via notifyOwner quando há alertas críticos
 * - Loga warnings no console
 * 
 * Registrado em server/_core/index.ts
 */

import { collectAppMetrics, type AppAlert } from "../monitoring/app-metrics";
import { notifyOwner } from "../_core/notification";

const INTERVAL_MS = 60_000; // 1 minuto
const ALERT_COOLDOWN_MS = 15 * 60_000; // 15 minutos entre alertas do mesmo tipo

// Rastrear último alerta enviado por métrica para evitar spam
const lastAlertSent = new Map<string, number>();

function shouldSendAlert(metric: string): boolean {
  const lastSent = lastAlertSent.get(metric);
  if (!lastSent) return true;
  return Date.now() - lastSent > ALERT_COOLDOWN_MS;
}

async function runHealthCheck(): Promise<void> {
  try {
    const snapshot = await collectAppMetrics();
    
    // Filtrar apenas alertas críticos para notificação
    const criticalAlerts = snapshot.alerts.filter(a => a.level === 'critical');
    const warningAlerts = snapshot.alerts.filter(a => a.level === 'warning');
    
    // Log warnings no console
    for (const alert of warningAlerts) {
      console.warn(`[AppHealth] WARNING: ${alert.message}`);
    }
    
    // Enviar notificação para alertas críticos (com cooldown)
    for (const alert of criticalAlerts) {
      console.error(`[AppHealth] CRITICAL: ${alert.message}`);
      
      if (shouldSendAlert(alert.metric)) {
        lastAlertSent.set(alert.metric, Date.now());
        
        try {
          await notifyOwner({
            title: `[PromptJur] Alerta Crítico: ${alert.metric}`,
            content: `${alert.message}\n\nValor: ${alert.value}\nThreshold: ${alert.threshold}\nTimestamp: ${snapshot.timestamp}`,
          });
          console.log(`[AppHealth] Notificação enviada para alerta: ${alert.metric}`);
        } catch (err) {
          console.error(`[AppHealth] Falha ao enviar notificação:`, err);
        }
      }
    }
    
    // Log resumo periódico (a cada 5 minutos)
    if (Date.now() % (5 * 60_000) < INTERVAL_MS) {
      console.log(
        `[AppHealth] Heap: ${snapshot.heap.percentUsed}% | ` +
        `EventLoop: ${snapshot.eventLoop.lagMs}ms (avg: ${snapshot.eventLoop.avgLagMs}ms) | ` +
        `DB: ${snapshot.dbLatency.latencyMs}ms | ` +
        `Uptime: ${snapshot.uptime.formatted} | ` +
        `Alerts: ${snapshot.alerts.length}`
      );
    }
  } catch (err) {
    console.error('[AppHealth] Erro na coleta de métricas:', err);
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Inicia o job de monitoramento de saúde da aplicação
 */
export function scheduleAppHealthMonitor(): void {
  // Executar primeira coleta após 10 segundos (dar tempo para o servidor estabilizar)
  setTimeout(() => {
    runHealthCheck();
    
    // Agendar execuções periódicas
    intervalId = setInterval(runHealthCheck, INTERVAL_MS);
    console.log('[AppHealth] Monitor de saúde iniciado (intervalo: 60s)');
  }, 10_000);
}

/**
 * Para o job de monitoramento (para testes)
 */
export function stopAppHealthMonitor(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
