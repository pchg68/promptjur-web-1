/**
 * Helpers de cálculo e agregação de custos LLM.
 * Consulta a tabela llm_logs e aplica a tabela de preços para estimar gastos.
 */
import { and, desc, gte, sql, count, isNotNull } from "drizzle-orm";
import { getDb } from "./db";
import { llmLogs } from "../drizzle/schema";
import { calcularCustoUsd, PRECOS_POR_MODELO, TABELA_PRECOS } from "../shared/llm-pricing";

// ─── Tipos de retorno ─────────────────────────────────────────────────────────

export interface CustoPorModelo {
  modeloId: string;
  nomeExibicao: string;
  provider: string;
  chamadas: number;
  tokensEntrada: number;
  tokensSaida: number;
  totalTokens: number;
  custoUsd: number;
  custoBrl: number;
  custoMedioUsd: number;
  percentualDoTotal: number;
}

export interface CustoPorPeriodo {
  periodo: string;   // "YYYY-MM-DD" (dia) ou "YYYY-MM" (mês) ou "YYYY-WW" (semana)
  chamadas: number;
  tokensEntrada: number;
  tokensSaida: number;
  custoUsd: number;
  custoBrl: number;
}

export interface CustoPorUsuario {
  userId: number | null;
  userName: string;
  chamadas: number;
  tokensEntrada: number;
  tokensSaida: number;
  custoUsd: number;
  custoBrl: number;
  percentualDoTotal: number;
}

export interface ResumoCustos {
  totalCustoUsd: number;
  totalCustoBrl: number;
  totalTokens: number;
  totalChamadas: number;
  custoMedioUsd: number;
  custoMedioBrl: number;
  taxaCambio: number;
  periodo: string;
  porModelo: CustoPorModelo[];
  porProvider: {
    provider: string;
    chamadas: number;
    custoUsd: number;
    custoBrl: number;
    percentualDoTotal: number;
  }[];
  tendenciaDiaria: CustoPorPeriodo[];
  topUsuarios: CustoPorUsuario[];
  projecaoMensalUsd: number;
  projecaoMensalBrl: number;
}

// ─── Taxa de câmbio padrão (USD → BRL) ───────────────────────────────────────
const TAXA_CAMBIO_DEFAULT = 5.0;

// ─── Função principal de agregação de custos ─────────────────────────────────

export async function calcularResumoCustos(
  horasAtras = 720,  // padrão: 30 dias
  taxaCambio = TAXA_CAMBIO_DEFAULT
): Promise<ResumoCustos> {
  const db = await getDb();
  if (!db) {
    return gerarResumoCustosVazio(horasAtras, taxaCambio);
  }

  const desde = new Date(Date.now() - horasAtras * 60 * 60 * 1000);

  // ── Agregação por modelo ─────────────────────────────────────────────────
  const porModeloRaw = await db
    .select({
      modelo: llmLogs.modeloEfetivo,
      provider: llmLogs.providerEfetivo,
      chamadas: count(),
      tokensEntrada: sql<number>`COALESCE(SUM(${llmLogs.tokensEntrada}), 0)`,
      tokensSaida: sql<number>`COALESCE(SUM(${llmLogs.tokensSaida}), 0)`,
    })
    .from(llmLogs)
    .where(and(
      gte(llmLogs.createdAt, desde),
      sql`${llmLogs.status} IN ('sucesso', 'fallback_sucesso')`
    ))
    .groupBy(llmLogs.modeloEfetivo, llmLogs.providerEfetivo)
    .orderBy(desc(sql`COALESCE(SUM(${llmLogs.tokensEntrada}), 0) + COALESCE(SUM(${llmLogs.tokensSaida}), 0)`));

  // Calcular custo para cada modelo
  const porModeloComCusto = porModeloRaw.map((r: { modelo: string; provider: string; chamadas: number; tokensEntrada: number; tokensSaida: number }) => {
    const tokEnt = Number(r.tokensEntrada);
    const tokSai = Number(r.tokensSaida);
    const custoUsd = calcularCustoUsd(r.modelo, tokEnt, tokSai) ?? estimarCustoPorProvider(r.provider, tokEnt, tokSai);
    const pricing = PRECOS_POR_MODELO[r.modelo];
    return {
      modeloId: r.modelo,
      nomeExibicao: pricing?.nomeExibicao ?? r.modelo,
      provider: r.provider,
      chamadas: Number(r.chamadas),
      tokensEntrada: tokEnt,
      tokensSaida: tokSai,
      totalTokens: tokEnt + tokSai,
      custoUsd,
      custoBrl: custoUsd * taxaCambio,
      custoMedioUsd: Number(r.chamadas) > 0 ? custoUsd / Number(r.chamadas) : 0,
      percentualDoTotal: 0, // calculado depois
    };
  });

  const totalCustoUsd = porModeloComCusto.reduce((s: number, m: { custoUsd: number }) => s + m.custoUsd, 0);
  const totalTokens = porModeloComCusto.reduce((s: number, m: { totalTokens: number }) => s + m.totalTokens, 0);
  const totalChamadas = porModeloComCusto.reduce((s: number, m: { chamadas: number }) => s + m.chamadas, 0);

  // Calcular percentual
  const porModelo: CustoPorModelo[] = porModeloComCusto.map((m: typeof porModeloComCusto[0]) => ({
    ...m,
    percentualDoTotal: totalCustoUsd > 0 ? (m.custoUsd / totalCustoUsd) * 100 : 0,
  }));

  // ── Agregação por provider ───────────────────────────────────────────────
  const porProviderMap: Record<string, { chamadas: number; custoUsd: number }> = {};
  for (const m of porModelo) {
    if (!porProviderMap[m.provider]) {
      porProviderMap[m.provider] = { chamadas: 0, custoUsd: 0 };
    }
    porProviderMap[m.provider].chamadas += m.chamadas;
    porProviderMap[m.provider].custoUsd += m.custoUsd;
  }
  const porProvider = Object.entries(porProviderMap)
    .map(([provider, dados]) => ({
      provider,
      chamadas: dados.chamadas,
      custoUsd: dados.custoUsd,
      custoBrl: dados.custoUsd * taxaCambio,
      percentualDoTotal: totalCustoUsd > 0 ? (dados.custoUsd / totalCustoUsd) * 100 : 0,
    }))
    .sort((a, b) => b.custoUsd - a.custoUsd);

  // ── Tendência diária ─────────────────────────────────────────────────────
  const tendenciaRaw = await db
    .select({
      dia: sql<string>`DATE_FORMAT(${llmLogs.createdAt}, '%Y-%m-%d')`,
      chamadas: count(),
      tokensEntrada: sql<number>`COALESCE(SUM(${llmLogs.tokensEntrada}), 0)`,
      tokensSaida: sql<number>`COALESCE(SUM(${llmLogs.tokensSaida}), 0)`,
    })
    .from(llmLogs)
    .where(and(
      gte(llmLogs.createdAt, desde),
      sql`${llmLogs.status} IN ('sucesso', 'fallback_sucesso')`
    ))
    .groupBy(sql`DATE_FORMAT(${llmLogs.createdAt}, '%Y-%m-%d')`)
    .orderBy(sql`DATE_FORMAT(${llmLogs.createdAt}, '%Y-%m-%d')`);

  const tendenciaDiaria: CustoPorPeriodo[] = tendenciaRaw.map((r: { dia: string; chamadas: number; tokensEntrada: number; tokensSaida: number }) => {
    const tokEnt = Number(r.tokensEntrada);
    const tokSai = Number(r.tokensSaida);
    // Custo estimado usando média ponderada dos modelos do período
    const custoUsd = totalTokens > 0
      ? totalCustoUsd * ((tokEnt + tokSai) / totalTokens)
      : 0;
    return {
      periodo: r.dia,
      chamadas: Number(r.chamadas),
      tokensEntrada: tokEnt,
      tokensSaida: tokSai,
      custoUsd,
      custoBrl: custoUsd * taxaCambio,
    };
  });

  // ── Top usuários ─────────────────────────────────────────────────────────
  const topUsuariosRaw = await db
    .select({
      userId: llmLogs.userId,
      chamadas: count(),
      tokensEntrada: sql<number>`COALESCE(SUM(${llmLogs.tokensEntrada}), 0)`,
      tokensSaida: sql<number>`COALESCE(SUM(${llmLogs.tokensSaida}), 0)`,
    })
    .from(llmLogs)
    .where(and(
      gte(llmLogs.createdAt, desde),
      sql`${llmLogs.status} IN ('sucesso', 'fallback_sucesso')`
    ))
    .groupBy(llmLogs.userId)
    .orderBy(desc(sql`COALESCE(SUM(${llmLogs.tokensEntrada}), 0) + COALESCE(SUM(${llmLogs.tokensSaida}), 0)`))
    .limit(10);

  const topUsuarios: CustoPorUsuario[] = topUsuariosRaw.map((r: { userId: number | null; chamadas: number; tokensEntrada: number; tokensSaida: number }) => {
    const tokEnt = Number(r.tokensEntrada);
    const tokSai = Number(r.tokensSaida);
    const custoUsd = totalTokens > 0
      ? totalCustoUsd * ((tokEnt + tokSai) / totalTokens)
      : 0;
    return {
      userId: r.userId,
      userName: r.userId ? `Usuário #${r.userId}` : "Sistema",
      chamadas: Number(r.chamadas),
      tokensEntrada: tokEnt,
      tokensSaida: tokSai,
      custoUsd,
      custoBrl: custoUsd * taxaCambio,
      percentualDoTotal: totalCustoUsd > 0 ? (custoUsd / totalCustoUsd) * 100 : 0,
    };
  });

  // ── Projeção mensal ──────────────────────────────────────────────────────
  const diasNoPeriodo = horasAtras / 24;
  const custoDiarioMedio = diasNoPeriodo > 0 ? totalCustoUsd / diasNoPeriodo : 0;
  const projecaoMensalUsd = custoDiarioMedio * 30;

  return {
    totalCustoUsd,
    totalCustoBrl: totalCustoUsd * taxaCambio,
    totalTokens,
    totalChamadas,
    custoMedioUsd: totalChamadas > 0 ? totalCustoUsd / totalChamadas : 0,
    custoMedioBrl: totalChamadas > 0 ? (totalCustoUsd * taxaCambio) / totalChamadas : 0,
    taxaCambio,
    periodo: `Últimas ${horasAtras}h`,
    porModelo,
    porProvider,
    tendenciaDiaria,
    topUsuarios,
    projecaoMensalUsd,
    projecaoMensalBrl: projecaoMensalUsd * taxaCambio,
  };
}

// ─── Helpers auxiliares ───────────────────────────────────────────────────────

/** Estima custo por provider quando o modelo específico não está na tabela */
function estimarCustoPorProvider(provider: string, tokEnt: number, tokSai: number): number {
  const precosPadrao: Record<string, { entrada: number; saida: number }> = {
    openai: { entrada: 0.00015, saida: 0.0006 },    // GPT-4o Mini
    anthropic: { entrada: 0.0008, saida: 0.004 },   // Claude 3.5 Haiku
    google: { entrada: 0.000075, saida: 0.0003 },   // Gemini 1.5 Flash
    manus: { entrada: 0.00015, saida: 0.0006 },     // Equivalente GPT-4o Mini
  };
  const p = precosPadrao[provider] ?? { entrada: 0.001, saida: 0.002 };
  return (tokEnt / 1000) * p.entrada + (tokSai / 1000) * p.saida;
}

/** Retorna um resumo vazio quando o banco não está disponível */
function gerarResumoCustosVazio(horasAtras: number, taxaCambio: number): ResumoCustos {
  return {
    totalCustoUsd: 0,
    totalCustoBrl: 0,
    totalTokens: 0,
    totalChamadas: 0,
    custoMedioUsd: 0,
    custoMedioBrl: 0,
    taxaCambio,
    periodo: `Últimas ${horasAtras}h`,
    porModelo: [],
    porProvider: [],
    tendenciaDiaria: [],
    topUsuarios: [],
    projecaoMensalUsd: 0,
    projecaoMensalBrl: 0,
  };
}

/** Retorna a tabela de preços completa para exibição */
export function obterTabelaPrecos() {
  return TABELA_PRECOS.filter(m => m.ativo).map(m => ({
    modeloId: m.modeloId,
    nomeExibicao: m.nomeExibicao,
    provider: m.provider,
    categoria: m.categoria,
    custoPorMilTokensEntrada: m.custoPorMilTokensEntrada,
    custoPorMilTokensSaida: m.custoPorMilTokensSaida,
    contextoMaxTokens: m.contextoMaxTokens,
    custoExemplo1kTokens: calcularCustoUsd(m.modeloId, 750, 250) ?? 0,
  }));
}
