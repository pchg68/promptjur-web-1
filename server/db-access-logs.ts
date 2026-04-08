/**
 * Queries para a tabela access_logs — log de acessos de usuários.
 * Usado pelo callback OAuth para registrar cada login e pelo painel admin para auditoria.
 */

import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { accessLogs, InsertAccessLog } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Registra um novo acesso no log.
 */
export async function registrarAcesso(dados: InsertAccessLog): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[AccessLogs] Banco indisponível, acesso não registrado");
    return;
  }
  try {
    await db.insert(accessLogs).values(dados);
  } catch (err) {
    console.error("[AccessLogs] Falha ao registrar acesso:", err);
  }
}

export interface FiltrosAccessLog {
  email?: string;
  nome?: string;
  dataInicio?: Date;
  dataFim?: Date;
  apenasNegados?: boolean;
  apenasPrimeiros?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Lista logs de acesso com filtros e paginação.
 */
export async function listarAccessLogs(filtros: FiltrosAccessLog = {}) {
  const db = await getDb();
  if (!db) return { logs: [], total: 0 };

  const {
    email,
    nome,
    dataInicio,
    dataFim,
    apenasNegados,
    apenasPrimeiros,
    page = 1,
    limit = 50,
  } = filtros;

  const offset = (page - 1) * limit;

  const conditions = [];

  if (email) {
    conditions.push(like(accessLogs.email, `%${email}%`));
  }
  if (nome) {
    conditions.push(like(accessLogs.nome, `%${nome}%`));
  }
  if (dataInicio) {
    conditions.push(gte(accessLogs.createdAt, dataInicio));
  }
  if (dataFim) {
    // Inclui o dia inteiro
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);
    conditions.push(lte(accessLogs.createdAt, fim));
  }
  if (apenasNegados) {
    conditions.push(eq(accessLogs.acessoPermitido, false));
  }
  if (apenasPrimeiros) {
    conditions.push(eq(accessLogs.primeiroAcesso, true));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [logs, countResult] = await Promise.all([
    db
      .select()
      .from(accessLogs)
      .where(where)
      .orderBy(desc(accessLogs.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(accessLogs)
      .where(where),
  ]);

  return {
    logs: logs.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    })),
    total: Number(countResult[0]?.count ?? 0),
  };
}

/**
 * Estatísticas resumidas de acessos para o painel admin.
 */
export async function statsAccessLogs() {
  const db = await getDb();
  if (!db) return null;

  const agora = new Date();
  const inicio7dias = new Date(agora);
  inicio7dias.setDate(agora.getDate() - 7);
  const inicio30dias = new Date(agora);
  inicio30dias.setDate(agora.getDate() - 30);

  const [totalResult, primeirosResult, negadosResult, ultimos7Result, ultimos30Result] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(accessLogs),
      db
        .select({ count: sql<number>`count(*)` })
        .from(accessLogs)
        .where(eq(accessLogs.primeiroAcesso, true)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(accessLogs)
        .where(eq(accessLogs.acessoPermitido, false)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(accessLogs)
        .where(gte(accessLogs.createdAt, inicio7dias)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(accessLogs)
        .where(gte(accessLogs.createdAt, inicio30dias)),
    ]);

  return {
    total: Number(totalResult[0]?.count ?? 0),
    primeirosAcessos: Number(primeirosResult[0]?.count ?? 0),
    acessosNegados: Number(negadosResult[0]?.count ?? 0),
    ultimos7dias: Number(ultimos7Result[0]?.count ?? 0),
    ultimos30dias: Number(ultimos30Result[0]?.count ?? 0),
  };
}

/**
 * Exporta logs em formato CSV.
 */
export async function exportarAccessLogsCsv(filtros: FiltrosAccessLog = {}): Promise<string> {
  const { logs } = await listarAccessLogs({ ...filtros, limit: 10000, page: 1 });

  const header = [
    "ID",
    "Nome",
    "E-mail",
    "Método",
    "IP",
    "Primeiro Acesso",
    "Acesso Permitido",
    "Data/Hora",
  ].join(",");

  const rows = logs.map((l) =>
    [
      l.id,
      `"${(l.nome ?? "").replace(/"/g, '""')}"`,
      `"${(l.email ?? "").replace(/"/g, '""')}"`,
      l.loginMethod ?? "",
      l.ipOrigem ?? "",
      l.primeiroAcesso ? "Sim" : "Não",
      l.acessoPermitido ? "Sim" : "Não",
      new Date(l.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    ].join(",")
  );

  return [header, ...rows].join("\n");
}
