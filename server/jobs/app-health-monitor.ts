/**
 * App Health Monitor Job
 * 
 * Executa a cada 60 segundos:
 * - Coleta métricas de heap, event loop e DB latency
 * - Envia alerta ao owner via notifyOwner quando há alertas críticos
 * - Loga warnings no console
 * - Suprime alertas de cold start (reconexão TLS) para evitar falsos positivos
 * 
 * Registrado em server/_core/index.ts
 */

import { collectAppMetrics, type AppAlert } from "../monitoring/app-metrics";
import { notifyOwner } from "../_core/notification";

const INTERVAL_MS = 60_000; // 1 minuto
const ALERT_COOLDOWN_MS = 30 * 60_000; // 30 minutos entre alertas do mesmo tipo (aumentado de 15 para 30)

/**
 * Número de alertas consecutivos necessários antes de notificar.
 * Evita notificação por picos isolados — só notifica se o problema persistir.
 * Aumentado de 2 para 3 para reduzir falsos positivos em redes instáveis.
 */
const CONSECUTIVE_ALERTS_THRESHOLD = 3;

// Rastrear último alerta enviado por métrica para evitar spam
const lastAlertSent = new Map<string, number>();

// Rastrear alertas consecutivos por métrica
const consecutiveAlerts = new Map<string, number>();

function shouldSendAlert(metric: string): boolean {
  const lastSent = lastAlertSent.get(metric);
  if (!lastSent) return true;
  return Date.now() - lastSent > ALERT_COOLDOWN_MS;
}

function trackConsecutiveAlert(metric: string, isActive: boolean): number {
  if (isActive) {
    const count = (consecutiveAlerts.get(metric) || 0) + 1;
    consecutiveAlerts.set(metric, count);
    return count;
  } else {
    consecutiveAlerts.set(metric, 0);
    return 0;
  }
}

async function runHealthCheck(): Promise<void> {
  try {
    const snapshot = await collectAppMetrics();
    
    // Filtrar apenas alertas críticos para notificação
    const criticalAlerts = snapshot.alerts.filter(a => a.level === 'critical');
    const warningAlerts = snapshot.alerts.filter(a => a.level === 'warning');
    
    // Resetar contadores para métricas que não estão mais em alerta
    const activeMetrics = new Set(snapshot.alerts.map(a => a.metric));
    for (const [metric] of consecutiveAlerts) {
      if (!activeMetrics.has(metric)) {
        const prevCount = consecutiveAlerts.get(metric) || 0;
        trackConsecutiveAlert(metric, false);
        
        // Se o alerta foi resolvido após ter sido notificado, enviar resolução
        if (prevCount >= CONSECUTIVE_ALERTS_THRESHOLD && lastAlertSent.has(metric)) {
          try {
            await notifyOwner({
              title: `[PromptJur] ✅ Resolvido: ${metric}`,
              content: [
                `O alerta de ${metric} foi resolvido automaticamente.`,
                '',
                `Heap: ${snapshot.heap.percentUsed}% | DB avg: ${snapshot.dbLatency.avgLatencyMs}ms | Uptime: ${snapshot.uptime.formatted}`,
                `Timestamp: ${snapshot.timestamp}`,
              ].join('\n'),
            });
            console.log(`[AppHealth] Notificação de resolução enviada para: ${metric}`);
          } catch {
            // Não crítico — apenas log
            console.warn(`[AppHealth] Falha ao enviar notificação de resolução para: ${metric}`);
          }
        }
      }
    }
    
    // Log warnings no console
    for (const alert of warningAlerts) {
      console.warn(`[AppHealth] WARNING: ${alert.message}`);
    }
    
    // Enviar notificação para alertas críticos (com cooldown E consecutivos)
    for (const alert of criticalAlerts) {
      console.error(`[AppHealth] CRITICAL: ${alert.message}`);
      
      const consecutive = trackConsecutiveAlert(alert.metric, true);
      
      // Só notifica se o alerta persistir por N coletas consecutivas
      if (consecutive >= CONSECUTIVE_ALERTS_THRESHOLD && shouldSendAlert(alert.metric)) {
        lastAlertSent.set(alert.metric, Date.now());
        
        try {
          await notifyOwner({
            title: `[PromptJur] Alerta Crítico: ${alert.metric}`,
            content: [
              alert.message,
              '',
              `Valor: ${alert.value}`,
              `Threshold: ${alert.threshold}`,
              `Alertas consecutivos: ${consecutive}`,
              `Timestamp: ${snapshot.timestamp}`,
              '',
              `Heap: ${snapshot.heap.percentUsed}% | DB avg: ${snapshot.dbLatency.avgLatencyMs}ms | Uptime: ${snapshot.uptime.formatted}`,
            ].join('\n'),
          });
          console.log(`[AppHealth] Notificação enviada para alerta: ${alert.metric} (${consecutive} consecutivos)`);
        } catch (err) {
          console.error(`[AppHealth] Falha ao enviar notificação:`, err);
        }
      } else if (consecutive < CONSECUTIVE_ALERTS_THRESHOLD) {
        console.log(
          `[AppHealth] Alerta ${alert.metric} aguardando confirmação ` +
          `(${consecutive}/${CONSECUTIVE_ALERTS_THRESHOLD} consecutivos)`
        );
      }
    }
    
    // Log resumo periódico (a cada 5 minutos)
    if (Date.now() % (5 * 60_000) < INTERVAL_MS) {
      console.log(
        `[AppHealth] Heap: ${snapshot.heap.percentUsed}% | ` +
        `EventLoop: ${snapshot.eventLoop.lagMs}ms (avg: ${snapshot.eventLoop.avgLagMs}ms) | ` +
        `DB: ${snapshot.dbLatency.latencyMs}ms (avg: ${snapshot.dbLatency.avgLatencyMs}ms, coldStart: ${snapshot.dbLatency.wasColdStart}) | ` +
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
 * Inicia o job de monitoramento de saúde da aplicação.
 * Aguarda 30 segundos antes da primeira coleta para dar tempo ao
 * warm-up do pool de conexões e estabilização do processo.
 */
export function scheduleAppHealthMonitor(): void {
  // Aguardar 30 segundos (antes era 10s — aumentado para dar tempo ao warm-up)
  setTimeout(() => {
    runHealthCheck();
    
    // Agendar execuções periódicas
    intervalId = setInterval(runHealthCheck, INTERVAL_MS);
    console.log('[AppHealth] Monitor de saúde iniciado (intervalo: 60s, cooldown: 30min, consecutivos: 3, com notificação de resolução)');
  }, 30_000);
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
