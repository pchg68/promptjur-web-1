/**
 * Helpers de histórico e painel de controle.
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { InsertHistorico, historico, promptTags, prompts, tags, templates } from "../../drizzle/schema";
import { getDb } from "./connection";
import { getTagsPrompt } from "./tags";


// ===== HISTORICO HELPERS =====

export async function createHistorico(data: InsertHistorico) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(historico).values(data);
  return (result as any).insertId;
}


export async function getUserHistorico(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db.select().from(historico)
    .where(eq(historico.userId, userId))
    .orderBy(desc(historico.createdAt))
    .limit(limit);
  
  // Converter para formato serializável
  return results.map((h: any) => ({
    ...h,
    createdAt: h.createdAt.toISOString()
  }));
}


export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalAnalises: 0, totalGeracoes: 0, totalOtimizacoes: 0, totalTemplates: 0 };
  
  const hist = await db.select().from(historico)
    .where(and(
      eq(historico.userId, userId),
      eq(historico.sucesso, true)
    ));
  
  const totalAnalises = hist.filter((h: any) => h.acao === 'analise').length;
  const totalGeracoes = hist.filter((h: any) => h.acao === 'geracao').length;
  const totalOtimizacoes = hist.filter((h: any) => h.acao === 'otimizacao').length;
  
  // Contar templates do usuário
  const userTemplates = await db.select().from(templates)
    .where(and(
      eq(templates.userId, userId),
      eq(templates.isAtivo, true)
    ));
  const totalTemplates = userTemplates.length;
  
  return { totalAnalises, totalGeracoes, totalOtimizacoes, totalTemplates };
}



// ===== PAINEL DE CONTROLE - HISTÓRICO UNIFICADO =====

/**
 * Retorna estatísticas completas do histórico do usuário para o painel de controle.
 * Inclui totais por ação, por área jurídica, por modelo, taxa de sucesso e tempo médio.
 */
export async function getHistoricoStats(userId: number) {
  const db = await getDb();
  const emptyResult = {
    totalAcoes: 0,
    porAcao: {} as Record<string, number>,
    porArea: {} as Record<string, number>,
    porModelo: {} as Record<string, number>,
    taxaSucesso: 0,
    tempoMedio: 0,
    totalPrompts: 0,
    totalFavoritos: 0,
    ultimaAtividade: null as string | null,
  };
  if (!db) return emptyResult;

  try {
    // Usar SQL agregado em vez de carregar todos os registros
    const [statsRow] = await db.select({
      totalAcoes: sql<number>`COUNT(*)`,
      totalSucesso: sql<number>`SUM(CASE WHEN ${historico.sucesso} = 1 THEN 1 ELSE 0 END)`,
      tempoMedio: sql<number>`COALESCE(AVG(${historico.duracaoMs}), 0)`,
      ultimaAtividade: sql<string>`MAX(${historico.createdAt})`,
    }).from(historico).where(eq(historico.userId, userId));

    const totalAcoes = Number(statsRow?.totalAcoes) || 0;
    const totalSucesso = Number(statsRow?.totalSucesso) || 0;
    const tempoMedio = Math.round(Number(statsRow?.tempoMedio) || 0);
    const ultimaAtividade = statsRow?.ultimaAtividade
      ? new Date(statsRow.ultimaAtividade).toISOString()
      : null;

    // Contagem por ação (SQL GROUP BY)
    const acaoRows = await db.select({
      acao: historico.acao,
      count: sql<number>`COUNT(*)`,
    }).from(historico).where(eq(historico.userId, userId)).groupBy(historico.acao);

    const porAcao: Record<string, number> = {};
    acaoRows.forEach((r: any) => { porAcao[r.acao] = Number(r.count); });

    // Contagem de prompts e favoritos (SQL agregado)
    const [promptsRow] = await db.select({
      total: sql<number>`COUNT(*)`,
      favoritos: sql<number>`SUM(CASE WHEN ${prompts.isFavorito} = 1 THEN 1 ELSE 0 END)`,
    }).from(prompts).where(eq(prompts.userId, userId));

    const totalPrompts = Number(promptsRow?.total) || 0;
    const totalFavoritos = Number(promptsRow?.favoritos) || 0;

    // Por área jurídica (SQL GROUP BY)
    const areaRows = await db.select({
      area: prompts.areaJuridica,
      count: sql<number>`COUNT(*)`,
    }).from(prompts)
      .where(and(eq(prompts.userId, userId), sql`${prompts.areaJuridica} IS NOT NULL`))
      .groupBy(prompts.areaJuridica);

    const porArea: Record<string, number> = {};
    areaRows.forEach((r: any) => { if (r.area) porArea[r.area] = Number(r.count); });

    // Por modelo - manter leitura leve (últimos 200 registros com detalhes)
    const porModelo: Record<string, number> = {};
    const recentWithDetails = await db.select({
      detalhes: historico.detalhes,
    }).from(historico)
      .where(and(eq(historico.userId, userId), sql`${historico.detalhes} IS NOT NULL`))
      .orderBy(desc(historico.createdAt))
      .limit(200);

    recentWithDetails.forEach((h: any) => {
      if (h.detalhes && typeof h.detalhes === 'object') {
        const det = h.detalhes as any;
        const modelo = det.modelo || det.model || det.modeloId;
        if (modelo) {
          porModelo[modelo] = (porModelo[modelo] || 0) + 1;
        }
      }
    });

    return {
      totalAcoes,
      porAcao,
      porArea,
      porModelo,
      taxaSucesso: totalAcoes > 0 ? Math.round((totalSucesso / totalAcoes) * 100) : 0,
      tempoMedio,
      totalPrompts,
      totalFavoritos,
      ultimaAtividade,
    };
  } catch (error) {
    console.error('[getHistoricoStats] Error:', error);
    return emptyResult;
  }
}


/**
 * Retorna histórico unificado (historico + prompts) com filtros avançados e paginação.
 */
export async function getHistoricoUnificado(userId: number, filtros: {
  acao?: string;
  area?: string;
  modelo?: string;
  texto?: string;
  dataInicio?: Date;
  dataFim?: Date;
  sucesso?: boolean;
  limite?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const limite = filtros.limite || 20;
  const offset = filtros.offset || 0;

  // Buscar histórico com filtros
  const conditions: any[] = [eq(historico.userId, userId)];

  if (filtros.acao) {
    conditions.push(eq(historico.acao, filtros.acao as any));
  }

  if (filtros.sucesso !== undefined) {
    conditions.push(eq(historico.sucesso, filtros.sucesso));
  }

  if (filtros.dataInicio) {
    conditions.push(sql`${historico.createdAt} >= ${filtros.dataInicio}`);
  }

  if (filtros.dataFim) {
    conditions.push(sql`${historico.createdAt} <= ${filtros.dataFim}`);
  }

  // Contar total
  const countResult = await db.select({ count: sql<number>`COUNT(*)` })
    .from(historico)
    .where(and(...conditions));
  const total = countResult[0]?.count || 0;

  // Buscar itens paginados
  const items = await db.select().from(historico)
    .where(and(...conditions))
    .orderBy(desc(historico.createdAt))
    .limit(limite)
    .offset(offset);

  // Batch: coletar todos os promptIds de uma vez (evita N+1)
  const promptIdSet = new Set<number>();
  items.forEach((i: any) => { if (i.promptId) promptIdSet.add(i.promptId); });
  const promptIds = Array.from(promptIdSet);
  const promptsMap = new Map<number, any>();

  if (promptIds.length > 0) {
    const promptRows = await db.select().from(prompts)
      .where(inArray(prompts.id, promptIds));
    promptRows.forEach((p: any) => {
      promptsMap.set(p.id, {
        id: p.id,
        tipo: p.tipo,
        areaJuridica: p.areaJuridica,
        promptOriginal: p.promptOriginal?.substring(0, 200) + (p.promptOriginal && p.promptOriginal.length > 200 ? '...' : ''),
        promptOtimizado: p.promptOtimizado?.substring(0, 200) + (p.promptOtimizado && p.promptOtimizado.length > 200 ? '...' : ''),
        qualidade: p.qualidade,
        isFavorito: p.isFavorito,
      });
    });
  }

  // Enriquecer e filtrar
  const enrichedItems = items.map((item: any) => {
    const promptData = item.promptId ? promptsMap.get(item.promptId) || null : null;

    // Filtrar por área (se especificado)
    if (filtros.area && promptData && promptData.areaJuridica !== filtros.area) {
      return null;
    }

    // Filtrar por texto (se especificado)
    if (filtros.texto) {
      const searchTerm = filtros.texto.toLowerCase();
      const matchPrompt = promptData && (
        (promptData.promptOriginal || '').toLowerCase().includes(searchTerm) ||
        (promptData.promptOtimizado || '').toLowerCase().includes(searchTerm)
      );
      const matchDetalhes = item.detalhes && JSON.stringify(item.detalhes).toLowerCase().includes(searchTerm);
      if (!matchPrompt && !matchDetalhes) {
        return null;
      }
    }

    return {
      id: item.id,
      acao: item.acao,
      promptId: item.promptId,
      detalhes: item.detalhes,
      duracaoMs: item.duracaoMs,
      sucesso: item.sucesso,
      mensagemErro: item.mensagemErro,
      createdAt: item.createdAt.toISOString(),
      prompt: promptData,
    };
  });

  // Remover nulls (filtrados por área/texto)
  const filteredItems = enrichedItems.filter(Boolean);

  return {
    items: filteredItems,
    total: filtros.area || filtros.texto ? filteredItems.length : total,
  };
}


/**
 * Retorna detalhes completos de um item do histórico, incluindo prompt completo.
 */
export async function getHistoricoDetalhes(historicoId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const [item] = await db.select().from(historico)
    .where(and(
      eq(historico.id, historicoId),
      eq(historico.userId, userId)
    ))
    .limit(1);

  if (!item) return null;

  let promptCompleto = null;
  if (item.promptId) {
    const [p] = await db.select().from(prompts)
      .where(eq(prompts.id, item.promptId))
      .limit(1);
    if (p) {
      promptCompleto = {
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    }
  }

  // Buscar tags do prompt (se existir)
  let promptTags: any[] = [];
  if (item.promptId) {
    promptTags = await getTagsPrompt(item.promptId);
  }

  return {
    id: item.id,
    acao: item.acao,
    promptId: item.promptId,
    detalhes: item.detalhes,
    duracaoMs: item.duracaoMs,
    sucesso: item.sucesso,
    mensagemErro: item.mensagemErro,
    createdAt: item.createdAt.toISOString(),
    prompt: promptCompleto,
    tags: promptTags,
  };
}


/**
 * Exclui um item do histórico.
 */
export async function excluirHistorico(historicoId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [item] = await db.select().from(historico)
    .where(and(
      eq(historico.id, historicoId),
      eq(historico.userId, userId)
    ))
    .limit(1);

  if (!item) throw new Error("Item não encontrado");

  await db.delete(historico).where(eq(historico.id, historicoId));
  return { success: true };
}


/**
 * Retorna dados de uso por dia para gráfico de atividade.
 */
function buildEmptyAtividadePorDia(dias: number) {
  const groupedByDate: Record<string, Record<string, number>> = {};
  for (let i = 0; i < dias; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (dias - 1 - i));
    const dateStr = date.toISOString().split('T')[0];
    groupedByDate[dateStr] = { analise: 0, geracao: 0, otimizacao: 0, execucao_prompt: 0, verificacao: 0, exportacao_docx: 0, exportacao_pdf: 0 };
  }

  return groupedByDate;
}

function serializeAtividadePorDia(groupedByDate: Record<string, Record<string, number>>) {
  return Object.entries(groupedByDate).map(([dateStr, counts]) => {
    const [year, month, day] = dateStr.split('-');
    return {
      date: `${day}/${month}`,
      dateISO: dateStr,
      ...counts,
      total: Object.values(counts).reduce((a, b) => a + b, 0),
    };
  });
}

export async function getAtividadePorDia(userId: number, dias: number = 30) {
  const db = await getDb();
  if (!db) return serializeAtividadePorDia(buildEmptyAtividadePorDia(dias));

  try {
    // Calcular data de início
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dias);
    dataInicio.setHours(0, 0, 0, 0);

    // Usar SQL GROUP BY para agregar no banco
    const rows = await db.select({
      dateStr: sql<string>`DATE(createdAt)`,
      acao: historico.acao,
      count: sql<number>`COUNT(*)`,
    }).from(historico)
      .where(and(
        eq(historico.userId, userId),
        sql`${historico.createdAt} >= ${dataInicio}`
      ))
      .groupBy(sql`DATE(createdAt)`, sql`acao`);

    // Inicializar todos os dias
    const groupedByDate = buildEmptyAtividadePorDia(dias);

    // Preencher com dados do banco
    rows.forEach((row: any) => {
      const dateStr = typeof row.dateStr === 'string' 
        ? row.dateStr.split('T')[0] 
        : new Date(row.dateStr).toISOString().split('T')[0];
      if (groupedByDate[dateStr]) {
        groupedByDate[dateStr][row.acao] = Number(row.count);
      }
    });

    return serializeAtividadePorDia(groupedByDate);
  } catch (error) {
    console.error('[getAtividadePorDia] Error:', error);
    return [];
  }
}
