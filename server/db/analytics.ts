/**
 * Helpers de analytics e uso.
 */
import { and, avg, count, desc, eq, sql } from "drizzle-orm";
import { analises, historico, users } from "../../drizzle/schema";
import { getDb } from "./connection";


// ===== ANALYTICS HELPERS =====

export async function getAnalytics(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // CRITICAL FIX: Usar SQL agregado em vez de carregar TODOS os registros
  // A versão anterior carregava todo o histórico na memória, causando Out of Memory
  
  // 1. Contagens e médias por tipo via Drizzle ORM (evita carregar todos os registros)
  const statsRows = await db.select({
    acao: historico.acao,
    total: count(),
    avgDuracao: avg(historico.duracaoMs),
  }).from(historico)
    .where(and(
      eq(historico.userId, userId),
      eq(historico.sucesso, true)
    ))
    .groupBy(historico.acao);
  
  const avgTimes = { analise: 0, geracao: 0, otimizacao: 0 };
  let totalAnalises = 0, totalGeracoes = 0, totalOtimizacoes = 0;
  
  for (const row of statsRows) {
    const acao = row.acao as string;
    const total = Number(row.total) || 0;
    const avgVal = Math.round(Number(row.avgDuracao) || 0);
    
    if (acao === 'analise') { totalAnalises = total; avgTimes.analise = avgVal; }
    else if (acao === 'geracao') { totalGeracoes = total; avgTimes.geracao = avgVal; }
    else if (acao === 'otimizacao') { totalOtimizacoes = total; avgTimes.otimizacao = avgVal; }
  }
  
  // 2. Apenas os 10 registros mais recentes (NÃO todos)
  const recentHistory = await db.select().from(historico)
    .where(and(
      eq(historico.userId, userId),
      eq(historico.sucesso, true)
    ))
    .orderBy(desc(historico.createdAt))
    .limit(10);
  
  const recentHistorySerializable = recentHistory.map((item: any) => ({
    id: item.id,
    userId: item.userId,
    acao: item.acao,
    sucesso: item.sucesso,
    duracaoMs: item.duracaoMs,
    promptId: item.promptId,
    detalhes: item.detalhes,
    mensagemErro: item.mensagemErro,
    createdAt: item.createdAt.toISOString()
  }));
  
  return {
    totalAnalises,
    totalGeracoes,
    totalOtimizacoes,
    avgTimes,
    recentHistory: recentHistorySerializable
  };
}


// ===== USAGE LIMIT HELPERS =====

export async function incrementUserUsage(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar usuário atual
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("User not found");
  
  // Incrementar contador
  await db.update(users)
    .set({ usageCount: user.usageCount + 1 })
    .where(eq(users.id, userId));
}


export async function resetUserUsage(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users)
    .set({ usageCount: 0 })
    .where(eq(users.id, userId));
}


export async function getUsageByDate(userId: number, days: number = 7) {
  const db = await getDb();
  if (!db) return [];
  
  // Calcular data inicial
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // CRITICAL FIX: Filtrar por data E usar SQL GROUP BY em vez de carregar TODOS os registros
  // A versão anterior carregava todo o histórico sem filtro de data, causando Out of Memory
  const history = await db.select({
    acao: historico.acao,
    total: count(),
    dateStr: sql<string>`DATE(createdAt)`.as('dateStr'),
  }).from(historico)
    .where(and(
      eq(historico.userId, userId),
      eq(historico.sucesso, true),
      sql`${historico.createdAt} >= ${startDate}`
    ))
    .groupBy(sql`DATE(createdAt)`, historico.acao);
  
  // Agrupar por data
  const groupedByDate: Record<string, { analises: number; geracoes: number; otimizacoes: number }> = {};
  
  // Inicializar todos os dias com zero
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const dateStr = date.toISOString().split('T')[0];
    groupedByDate[dateStr] = { analises: 0, geracoes: 0, otimizacoes: 0 };
  }
  
  // Preencher com dados do SQL
  for (const row of history) {
    const dateStr = String(row.dateStr);
    if (groupedByDate[dateStr]) {
      const total = Number(row.total) || 0;
      if (row.acao === 'analise') groupedByDate[dateStr].analises = total;
      else if (row.acao === 'geracao') groupedByDate[dateStr].geracoes = total;
      else if (row.acao === 'otimizacao') groupedByDate[dateStr].otimizacoes = total;
    }
  }
  
  // Converter para array (garantir que date seja string, não Date)
  return Object.entries(groupedByDate).map(([dateStr, counts]) => {
    const [year, month, day] = dateStr.split('-');
    return {
      date: `${day}/${month}`, // Formato dd/mm como string
      ...counts
    };
  });
}
