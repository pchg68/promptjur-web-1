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
