import { eq, sql, desc, and, gte } from "drizzle-orm";
import { getDb } from "./db";
import { prompts, users } from "../drizzle/schema";

/**
 * Funções de banco de dados para métricas administrativas
 */

/**
 * Retorna os prompts mais gerados por área jurídica (top 10)
 */
export async function getTopAreasJuridicas() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        areaJuridica: prompts.areaJuridica,
        total: sql<number>`count(*)`.as("total"),
      })
      .from(prompts)
      .groupBy(prompts.areaJuridica)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    return result;
  } catch (error) {
    console.error("[Admin] Erro ao buscar top áreas jurídicas:", error);
    return [];
  }
}

/**
 * Retorna a distribuição de uso por plataforma de IA
 * Usa dados reais do campo plataformaTeste
 */
export async function getDistribuicaoPlataformas() {
  const db = await getDb();
  if (!db) return [];

  try {
    // Buscar distribuição real de plataformas testadas
    const result = await db
      .select({
        plataforma: prompts.plataformaTeste,
        total: sql<number>`count(*)`.as("total"),
      })
      .from(prompts)
      .where(sql`${prompts.plataformaTeste} IS NOT NULL`)
      .groupBy(prompts.plataformaTeste)
      .orderBy(desc(sql`count(*)`));

    // Mapear nomes das plataformas para exibição
    const plataformaNomes: Record<string, string> = {
      manus: "Manus",
      chatgpt: "ChatGPT",
      claude: "Claude",
      gemini: "Gemini",
      perplexity: "Perplexity",
    };

    return result.map((r) => ({
      plataforma: plataformaNomes[r.plataforma || ""] || r.plataforma || "Desconhecida",
      total: Number(r.total),
    }));
  } catch (error) {
    console.error("[Admin] Erro ao buscar distribuição de plataformas:", error);
    return [];
  }
}

/**
 * Retorna estatísticas gerais da plataforma
 */
export async function getEstatisticasGerais() {
  const db = await getDb();
  if (!db) {
    return {
      totalUsuarios: 0,
      usuariosAtivos: 0,
      totalPrompts: 0,
      promptsHoje: 0,
      totalAnalises: 0,
      totalGeracoes: 0,
      totalOtimizacoes: 0,
    };
  }

  try {
    // Total de usuários
    const totalUsuariosResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const totalUsuarios = totalUsuariosResult[0]?.count || 0;

    // Usuários ativos (últimos 7 dias)
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    
    const usuariosAtivosResult = await db
      .select({ count: sql<number>`count(distinct ${users.id})` })
      .from(users)
      .where(gte(users.lastSignedIn, seteDiasAtras));
    const usuariosAtivos = usuariosAtivosResult[0]?.count || 0;

    // Total de prompts
    const totalPromptsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(prompts);
    const totalPrompts = totalPromptsResult[0]?.count || 0;

    // Prompts criados hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const promptsHojeResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(prompts)
      .where(gte(prompts.createdAt, hoje));
    const promptsHoje = promptsHojeResult[0]?.count || 0;

    // Total por tipo de ação
    const totalAnalisesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(prompts)
      .where(eq(prompts.tipo, "analise"));
    const totalAnalises = totalAnalisesResult[0]?.count || 0;

    const totalGeracoesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(prompts)
      .where(eq(prompts.tipo, "geracao"));
    const totalGeracoes = totalGeracoesResult[0]?.count || 0;

    const totalOtimizacoesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(prompts)
      .where(eq(prompts.tipo, "otimizacao"));
    const totalOtimizacoes = totalOtimizacoesResult[0]?.count || 0;

    return {
      totalUsuarios,
      usuariosAtivos,
      totalPrompts,
      promptsHoje,
      totalAnalises,
      totalGeracoes,
      totalOtimizacoes,
    };
  } catch (error) {
    console.error("[Admin] Erro ao buscar estatísticas gerais:", error);
    return {
      totalUsuarios: 0,
      usuariosAtivos: 0,
      totalPrompts: 0,
      promptsHoje: 0,
      totalAnalises: 0,
      totalGeracoes: 0,
      totalOtimizacoes: 0,
    };
  }
}

/**
 * Retorna os 10 prompts mais recentes com informações do usuário
 */
export async function getPromptsRecentes() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        id: prompts.id,
        tipo: prompts.tipo,
        areaJuridica: prompts.areaJuridica,
        conteudo: prompts.promptOriginal,
        createdAt: prompts.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(prompts)
      .leftJoin(users, eq(prompts.userId, users.id))
      .orderBy(desc(prompts.createdAt))
      .limit(10);

    return result;
  } catch (error) {
    console.error("[Admin] Erro ao buscar prompts recentes:", error);
    return [];
  }
}

/**
 * Retorna a evolução de uso nos últimos 30 dias
 */
export async function getEvolucaoUso() {
  const db = await getDb();
  if (!db) return [];

  try {
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    const result = await db
      .select({
        data: sql<string>`DATE(${prompts.createdAt})`.as("data"),
        total: sql<number>`count(*)`.as("total"),
      })
      .from(prompts)
      .where(gte(prompts.createdAt, trintaDiasAtras))
      .groupBy(sql`DATE(${prompts.createdAt})`)
      .orderBy(sql`DATE(${prompts.createdAt})`);

    return result;
  } catch (error) {
    console.error("[Admin] Erro ao buscar evolução de uso:", error);
    return [];
  }
}

/**
 * Retorna distribuição de uso por tipo de ação
 */
export async function getDistribuicaoPorTipo() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select({
        tipo: prompts.tipo,
        total: sql<number>`count(*)`.as("total"),
      })
      .from(prompts)
      .groupBy(prompts.tipo)
      .orderBy(desc(sql`count(*)`));

    return result;
  } catch (error) {
    console.error("[Admin] Erro ao buscar distribuição por tipo:", error);
    return [];
  }
}
