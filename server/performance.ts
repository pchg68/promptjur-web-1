/**
 * Sistema de Monitoramento de Performance
 * Rastreia tempo de resposta de rotas tRPC e calcula percentis
 */

interface PerformanceMetric {
  rota: string;
  duracao: number; // em ms
  timestamp: number;
  userId?: number;
}

// Armazenar últimas 1000 métricas em memória
const metricas: PerformanceMetric[] = [];
const MAX_METRICAS = 1000;

/**
 * Registra uma métrica de performance
 */
export function registrarMetrica(params: {
  rota: string;
  duracao: number;
  userId?: number;
}) {
  metricas.push({
    rota: params.rota,
    duracao: params.duracao,
    timestamp: Date.now(),
    userId: params.userId
  });

  // Limitar tamanho (FIFO)
  if (metricas.length > MAX_METRICAS) {
    metricas.shift();
  }

  // Verificar thresholds de performance (async, não bloqueia)
  // Apenas verifica a cada 10 métricas para evitar overhead
  if (metricas.length % 10 === 0) {
    checkPerformanceThresholds().catch(err => {
      console.error('[PerformanceAlert] Erro ao verificar thresholds:', err);
    });
  }
}

/**
 * Calcula percentil de um array ordenado
 */
function calcularPercentil(valores: number[], percentil: number): number {
  if (valores.length === 0) return 0;
  
  const index = Math.ceil((percentil / 100) * valores.length) - 1;
  return valores[Math.max(0, index)];
}

/**
 * Obtém métricas agregadas por rota
 */
export function getMetricasPorRota() {
  const metricasPorRota: Record<string, number[]> = {};
  
  // Agrupar por rota
  metricas.forEach(m => {
    if (!metricasPorRota[m.rota]) {
      metricasPorRota[m.rota] = [];
    }
    metricasPorRota[m.rota].push(m.duracao);
  });

  // Calcular estatísticas para cada rota
  const resultado = Object.entries(metricasPorRota).map(([rota, duracoes]) => {
    const duracoesOrdenadas = [...duracoes].sort((a, b) => a - b);
    const total = duracoes.length;
    const media = duracoes.reduce((a, b) => a + b, 0) / total;
    
    return {
      rota,
      total,
      media: Math.round(media),
      p50: calcularPercentil(duracoesOrdenadas, 50),
      p95: calcularPercentil(duracoesOrdenadas, 95),
      p99: calcularPercentil(duracoesOrdenadas, 99),
      min: duracoesOrdenadas[0],
      max: duracoesOrdenadas[duracoesOrdenadas.length - 1]
    };
  });

  // Ordenar por p95 (rotas mais lentas primeiro)
  return resultado.sort((a, b) => b.p95 - a.p95);
}

/**
 * Obtém estatísticas gerais de performance
 */
export function getStatsPerformance() {
  if (metricas.length === 0) {
    return {
      totalRequisicoes: 0,
      rotasUnicas: 0,
      duracaoMedia: 0,
      p50Global: 0,
      p95Global: 0,
      p99Global: 0,
      rotaMaisLenta: null
    };
  }

  const todasDuracoes = metricas.map(m => m.duracao).sort((a, b) => a - b);
  const rotasUnicas = new Set(metricas.map(m => m.rota)).size;
  const duracaoMedia = todasDuracoes.reduce((a, b) => a + b, 0) / todasDuracoes.length;

  const metricasPorRota = getMetricasPorRota();
  const rotaMaisLenta = metricasPorRota.length > 0 ? metricasPorRota[0] : null;

  return {
    totalRequisicoes: metricas.length,
    rotasUnicas,
    duracaoMedia: Math.round(duracaoMedia),
    p50Global: calcularPercentil(todasDuracoes, 50),
    p95Global: calcularPercentil(todasDuracoes, 95),
    p99Global: calcularPercentil(todasDuracoes, 99),
    rotaMaisLenta: rotaMaisLenta ? {
      rota: rotaMaisLenta.rota,
      p95: rotaMaisLenta.p95
    } : null
  };
}

/**
 * Limpa todas as métricas
 */
export function limparMetricas() {
  const total = metricas.length;
  metricas.length = 0;
  return { metricasRemovidas: total };
}

/**
 * Sistema de Alertas de Performance
 */

import { eq, and, gte } from "drizzle-orm";
import { alertRules, performanceAlerts, InsertPerformanceAlert } from "../drizzle/schema";
import { getDb } from "./db";
import { notifyOwner } from "./_core/notification";

// Cache de último alerta por regra (para cooldown)
const ultimoAlertaPorRegra = new Map<number, number>();

/**
 * Verifica thresholds e dispara alertas se necessário
 * Chamado automaticamente após cada métrica registrada
 */
export async function checkPerformanceThresholds() {
  const db = await getDb();
  if (!db) return;

  // Buscar regras ativas
  const regras = await db
    .select()
    .from(alertRules)
    .where(eq(alertRules.isAtivo, true));

  if (regras.length === 0) return;

  const metricasPorRota = getMetricasPorRota();
  const statsGlobal = getStatsPerformance();
  const now = Date.now();

  for (const regra of regras) {
    // Verificar cooldown
    const ultimoAlerta = ultimoAlertaPorRegra.get(regra.id);
    if (ultimoAlerta && (now - ultimoAlerta) < (regra.cooldown * 1000)) {
      continue; // Ainda em cooldown
    }

    let valorAtual: number | null = null;
    let rotaAfetada: string | null = null;

    // Regra global (rota = null)
    if (!regra.rota) {
      switch (regra.metrica) {
        case "p50":
          valorAtual = statsGlobal.p50Global;
          rotaAfetada = "global";
          break;
        case "p95":
          valorAtual = statsGlobal.p95Global;
          rotaAfetada = "global";
          break;
        case "p99":
          valorAtual = statsGlobal.p99Global;
          rotaAfetada = "global";
          break;
        case "media":
          valorAtual = statsGlobal.duracaoMedia;
          rotaAfetada = "global";
          break;
      }
    } else {
      // Regra específica para uma rota
      const metricaRota = metricasPorRota.find(m => m.rota === regra.rota);
      if (metricaRota) {
        rotaAfetada = regra.rota;
        switch (regra.metrica) {
          case "p50":
            valorAtual = metricaRota.p50;
            break;
          case "p95":
            valorAtual = metricaRota.p95;
            break;
          case "p99":
            valorAtual = metricaRota.p99;
            break;
          case "media":
            valorAtual = metricaRota.media;
            break;
        }
      }
    }

    // Verificar se excedeu threshold
    if (valorAtual !== null && rotaAfetada && valorAtual > regra.threshold) {
      await dispararAlerta({
        ruleId: regra.id,
        rota: rotaAfetada,
        metrica: regra.metrica,
        valorAtual,
        threshold: regra.threshold
      });

      // Atualizar cooldown
      ultimoAlertaPorRegra.set(regra.id, now);
    }
  }
}

/**
 * Dispara um alerta de performance
 */
async function dispararAlerta(params: {
  ruleId: number;
  rota: string;
  metrica: string;
  valorAtual: number;
  threshold: number;
}) {
  const db = await getDb();
  if (!db) return;

  const mensagem = `⚠️ Alerta de Performance: ${params.rota} - ${params.metrica.toUpperCase()} = ${params.valorAtual}ms (threshold: ${params.threshold}ms)`;

  // Salvar no banco
  const alertData: InsertPerformanceAlert = {
    ruleId: params.ruleId,
    rota: params.rota,
    metrica: params.metrica,
    valorAtual: params.valorAtual,
    threshold: params.threshold,
    mensagem,
    resolvido: false
  };

  await db.insert(performanceAlerts).values(alertData);

  // Notificar owner
  await notifyOwner({
    title: "Alerta de Performance",
    content: mensagem
  });

  console.log(`[PerformanceAlert] ${mensagem}`);
}

/**
 * Lista alertas recentes
 */
export async function listarAlertas(params?: {
  rota?: string;
  resolvido?: boolean;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(performanceAlerts);

  // Aplicar filtros
  const conditions = [];
  if (params?.rota) {
    conditions.push(eq(performanceAlerts.rota, params.rota));
  }
  if (params?.resolvido !== undefined) {
    conditions.push(eq(performanceAlerts.resolvido, params.resolvido));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const alertas = await query
    .orderBy(performanceAlerts.createdAt)
    .limit(params?.limit || 100);

  // Converter Date para string
  return alertas.map(alerta => ({
    ...alerta,
    createdAt: alerta.createdAt.toISOString()
  }));
}

/**
 * Marca alerta como resolvido
 */
export async function resolverAlerta(alertaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(performanceAlerts)
    .set({ resolvido: true })
    .where(eq(performanceAlerts.id, alertaId));

  return { id: alertaId, resolvido: true };
}

/**
 * Estatísticas de alertas
 */
export async function getStatsAlertas() {
  const db = await getDb();
  if (!db) return {
    totalAlertas: 0,
    alertasAtivos: 0,
    alertasResolvidos: 0,
    rotaMaisProblematica: null
  };

  const todosAlertas = await db.select().from(performanceAlerts);
  const alertasAtivos = todosAlertas.filter(a => a.resolvido === false);
  const alertasResolvidos = todosAlertas.filter(a => a.resolvido === true);

  // Contar alertas por rota
  const alertasPorRota: Record<string, number> = {};
  todosAlertas.forEach(a => {
    alertasPorRota[a.rota] = (alertasPorRota[a.rota] || 0) + 1;
  });

  const rotaMaisProblematica = Object.entries(alertasPorRota)
    .sort((a, b) => b[1] - a[1])[0];

  return {
    totalAlertas: todosAlertas.length,
    alertasAtivos: alertasAtivos.length,
    alertasResolvidos: alertasResolvidos.length,
    rotaMaisProblematica: rotaMaisProblematica ? {
      rota: rotaMaisProblematica[0],
      total: rotaMaisProblematica[1]
    } : null
  };
}

/**
 * Gerenciamento de Regras de Alertas
 */

/**
 * Cria uma nova regra de alerta
 */
export async function criarRegra(params: {
  rota?: string;
  metrica: "p50" | "p95" | "p99" | "media";
  threshold: number;
  cooldown?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const resultado = await db.insert(alertRules).values({
    rota: params.rota || null,
    metrica: params.metrica,
    threshold: params.threshold,
    isAtivo: true,
    cooldown: params.cooldown || 300
  }).returning({ id: alertRules.id });

  return resultado[0].id;
}

/**
 * Lista todas as regras de alertas
 */
export async function listarRegras() {
  const db = await getDb();
  if (!db) return [];

  const regras = await db.select().from(alertRules);

  // Converter Date para string
  return regras.map(regra => ({
    ...regra,
    createdAt: regra.createdAt.toISOString(),
    updatedAt: regra.updatedAt.toISOString()
  }));
}

/**
 * Toggle regra de alerta (ativa/desativa)
 */
export async function toggleRegra(regraId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar regra atual
  const resultado = await db
    .select()
    .from(alertRules)
    .where(eq(alertRules.id, regraId))
    .limit(1);

  if (resultado.length === 0) {
    throw new Error(`Regra #${regraId} não encontrada`);
  }

  const novoEstado = !resultado[0].isAtivo;

  // Atualizar no banco
  await db
    .update(alertRules)
    .set({ isAtivo: novoEstado })
    .where(eq(alertRules.id, regraId));

  return { id: regraId, isAtivo: novoEstado };
}

/**
 * Inicializa regras de alerta padrão
 */
export async function inicializarRegras() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const regrasDefault = [
    {
      rota: null, // Global
      metrica: "p95" as const,
      threshold: 2000, // 2 segundos
      cooldown: 300
    },
    {
      rota: null, // Global
      metrica: "p99" as const,
      threshold: 5000, // 5 segundos
      cooldown: 300
    }
  ];

  for (const regra of regrasDefault) {
    // Verificar se já existe
    const existe = await db
      .select()
      .from(alertRules)
      .where(
        eq(alertRules.metrica, regra.metrica)
      )
      .limit(1);

    if (existe.length === 0) {
      await db.insert(alertRules).values({
        rota: regra.rota,
        metrica: regra.metrica,
        threshold: regra.threshold,
        isAtivo: true,
        cooldown: regra.cooldown
      });
    }
  }

  return { sucesso: true };
}
