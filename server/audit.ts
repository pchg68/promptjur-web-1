/**
 * Sistema de Auditoria - Logs persistentes de ações administrativas
 */

import { eq, desc, and, gte, lte } from "drizzle-orm";
import { auditLogs, InsertAuditLog } from "../drizzle/schema";
import { getDb } from "./db";
import type { Request } from "express";

/**
 * Registra uma ação administrativa no log de auditoria
 */
export async function logAuditoria(params: {
  userId: number;
  acao: string;
  descricao?: string;
  metadata?: any;
  req?: Request;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const logData: InsertAuditLog = {
    userId: params.userId,
    acao: params.acao,
    descricao: params.descricao,
    metadata: params.metadata,
    ipAddress: params.req?.ip || params.req?.headers['x-forwarded-for'] as string || undefined,
    userAgent: params.req?.headers['user-agent'] as string || undefined,
  };

  const [result] = await db.insert(auditLogs).values(logData);
  return (result as any).insertId;
}

/**
 * Lista logs de auditoria com filtros opcionais
 */
export async function listarLogs(params: {
  userId?: number;
  acao?: string;
  dataInicio?: Date;
  dataFim?: Date;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (params.userId) {
    conditions.push(eq(auditLogs.userId, params.userId));
  }
  
  if (params.acao) {
    conditions.push(eq(auditLogs.acao, params.acao));
  }
  
  if (params.dataInicio) {
    conditions.push(gte(auditLogs.createdAt, params.dataInicio));
  }
  
  if (params.dataFim) {
    conditions.push(lte(auditLogs.createdAt, params.dataFim));
  }

  const query = db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(params.limit || 100);

  if (conditions.length > 0) {
    const results = await query.where(and(...conditions));
    // Converter Date para string
    return results.map((log: any) => ({
      ...log,
      createdAt: log.createdAt.toISOString()
    }));
  }

  const results = await query;
  // Converter Date para string
  return results.map((log: any) => ({
    ...log,
    createdAt: log.createdAt.toISOString()
  }));
}

/**
 * Obtém estatísticas dos logs de auditoria
 */
export async function getAuditStats() {
  const db = await getDb();
  if (!db) return {
    totalLogs: 0,
    acoesUnicas: 0,
    ultimaAcao: null,
    topAcoes: []
  };

  const logs = await db.select().from(auditLogs);
  
  const acoesCount: Record<string, number> = {};
  logs.forEach((log: any) => {
    acoesCount[log.acao] = (acoesCount[log.acao] || 0) + 1;
  });

  const topAcoes = Object.entries(acoesCount)
    .map(([acao, count]) => ({ acao, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const ultimaAcao = logs.length > 0 
    ? {
        acao: logs[0].acao,
        descricao: logs[0].descricao,
        createdAt: logs[0].createdAt.toISOString()
      }
    : null;

  return {
    totalLogs: logs.length,
    acoesUnicas: Object.keys(acoesCount).length,
    ultimaAcao,
    topAcoes
  };
}
