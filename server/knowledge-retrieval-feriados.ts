/**
 * Integração com API de Feriados Brasileiros
 * Usa feriados.dev para obter feriados nacionais, estaduais e municipais
 * 
 * Documentação: https://feriados.dev/
 */

const FERIADOS_API_URL = "https://api.feriados.dev/api/v1";

/**
 * Estados brasileiros (siglas)
 */
export const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
] as const;

export type EstadoBR = typeof ESTADOS_BR[number];

/**
 * Estrutura de um feriado
 */
export interface Feriado {
  date: string; // formato: YYYY-MM-DD
  name: string;
  type: "national" | "state" | "municipal" | "optional";
}

/**
 * Cache de feriados em memória (evitar chamadas repetidas)
 */
const cacheFeriados: Map<string, Feriado[]> = new Map();

/**
 * Buscar feriados de um ano específico
 */
export async function buscarFeriadosAno(
  ano: number,
  estado?: EstadoBR
): Promise<Feriado[]> {
  const cacheKey = `${ano}-${estado || "BR"}`;

  // Verificar cache
  if (cacheFeriados.has(cacheKey)) {
    return cacheFeriados.get(cacheKey)!;
  }

  try {
    // Montar URL baseado em estado
    const url = estado
      ? `${FERIADOS_API_URL}/feriados/${ano}/${estado}`
      : `${FERIADOS_API_URL}/feriados/${ano}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[Feriados] Erro HTTP ${response.status}: ${response.statusText}`);
      return [];
    }

    const feriados: Feriado[] = await response.json();

    // Adicionar feriados forenses manualmente (não estão na API)
    const feriadosForenses = obterFeriadosForenses(ano);
    feriados.push(...feriadosForenses);

    // Salvar no cache
    cacheFeriados.set(cacheKey, feriados);

    return feriados;
  } catch (error) {
    console.error("[Feriados] Erro ao buscar feriados:", error);
    return [];
  }
}

/**
 * Feriados forenses específicos do Judiciário
 * Baseado na Lei nº 5.010/1966 e resoluções do CNJ
 */
function obterFeriadosForenses(ano: number): Feriado[] {
  return [
    {
      date: `${ano}-12-08`,
      name: "Feriado Forense (Justiça Federal)",
      type: "optional",
    },
    // Recesso judiciário (20/12 a 06/01 do ano seguinte)
    {
      date: `${ano}-12-20`,
      name: "Início do Recesso Judiciário",
      type: "optional",
    },
  ];
}

/**
 * Verificar se uma data é feriado
 */
export async function ehFeriado(
  data: Date,
  estado?: EstadoBR
): Promise<boolean> {
  const ano = data.getFullYear();
  const feriados = await buscarFeriadosAno(ano, estado);

  const dataStr = data.toISOString().split("T")[0]; // YYYY-MM-DD

  return feriados.some((feriado) => feriado.date === dataStr);
}

/**
 * Verificar se uma data é dia útil (não é sábado, domingo ou feriado)
 */
export async function ehDiaUtil(
  data: Date,
  estado?: EstadoBR
): Promise<boolean> {
  const diaSemana = data.getDay();

  // Sábado (6) ou Domingo (0)
  if (diaSemana === 0 || diaSemana === 6) {
    return false;
  }

  // Verificar se é feriado
  const feriado = await ehFeriado(data, estado);
  return !feriado;
}

/**
 * Verificar se está em recesso judiciário
 */
export function ehRecessoJudiciario(data: Date): boolean {
  const mes = data.getMonth() + 1; // 1-12
  const dia = data.getDate();

  // Recesso: 20/12 a 06/01
  if (mes === 12 && dia >= 20) return true;
  if (mes === 1 && dia <= 6) return true;

  return false;
}

/**
 * Obter próximo dia útil após uma data
 */
export async function proximoDiaUtil(
  data: Date,
  estado?: EstadoBR
): Promise<Date> {
  let proximaData = new Date(data);
  proximaData.setDate(proximaData.getDate() + 1);

  while (!(await ehDiaUtil(proximaData, estado))) {
    proximaData.setDate(proximaData.getDate() + 1);
  }

  return proximaData;
}

/**
 * Calcular data final após N dias úteis
 */
export async function calcularDataFinalDiasUteis(
  dataInicial: Date,
  diasUteis: number,
  estado?: EstadoBR
): Promise<Date> {
  let dataAtual = new Date(dataInicial);
  let diasContados = 0;

  // Começar a contar a partir do próximo dia útil
  dataAtual = await proximoDiaUtil(dataAtual, estado);

  while (diasContados < diasUteis) {
    if (await ehDiaUtil(dataAtual, estado)) {
      diasContados++;
    }

    if (diasContados < diasUteis) {
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
  }

  return dataAtual;
}

/**
 * Calcular data final após N dias corridos
 */
export function calcularDataFinalDiasCorridos(
  dataInicial: Date,
  diasCorridos: number
): Date {
  const dataFinal = new Date(dataInicial);
  dataFinal.setDate(dataFinal.getDate() + diasCorridos);
  return dataFinal;
}

/**
 * Listar todos os feriados entre duas datas
 */
export async function listarFeriadosEntreDatas(
  dataInicio: Date,
  dataFim: Date,
  estado?: EstadoBR
): Promise<Feriado[]> {
  const anos = new Set<number>();
  let dataAtual = new Date(dataInicio);

  // Coletar todos os anos no intervalo
  while (dataAtual <= dataFim) {
    anos.add(dataAtual.getFullYear());
    dataAtual.setFullYear(dataAtual.getFullYear() + 1);
  }

  // Buscar feriados de todos os anos
  const promessas = Array.from(anos).map((ano) => buscarFeriadosAno(ano, estado));
  const feriadosPorAno = await Promise.all(promessas);
  const todosFeriados = feriadosPorAno.flat();

  // Filtrar apenas feriados no intervalo
  const dataInicioStr = dataInicio.toISOString().split("T")[0];
  const dataFimStr = dataFim.toISOString().split("T")[0];

  return todosFeriados.filter(
    (feriado) => feriado.date >= dataInicioStr && feriado.date <= dataFimStr
  );
}

/**
 * Formatar feriado para exibição
 */
export function formatarFeriado(feriado: Feriado): string {
  const data = new Date(feriado.date + "T00:00:00");
  const dataFormatada = data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const tipo = {
    national: "Nacional",
    state: "Estadual",
    municipal: "Municipal",
    optional: "Facultativo/Forense",
  }[feriado.type];

  return `${dataFormatada} - ${feriado.name} (${tipo})`;
}
