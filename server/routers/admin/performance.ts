/**
 * Admin Sub-Router: Monitoramento de Performance & Alertas
 * - Métricas por rota
 * - Métricas de conversão
 * - Estatísticas gerais
 * - Limpar métricas
 * - Listar/resolver alertas
 * - Regras de alertas
 * - Auditoria de dependências
 * - Backup do banco
 * - Sentry status
 * - Query error stats
 * - App metrics (heap, event loop, DB latency)
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router } from "../../_core/trpc";
import { adminProcedure } from "./shared";
import { logAuditoria } from "../../audit";
import { getMetricasPorRota, getStatsPerformance, limparMetricas, listarAlertas, resolverAlerta, getStatsAlertas, criarRegra, listarRegras, toggleRegra, inicializarRegras } from "../../performance";
import { executarAuditoriaNpm, atualizarDependenciasSeguras } from "../../security-audit";
import { criarBackup, listarBackups, restaurarBackup } from "../../backup";
import { storageGet } from "../../storage";
import { getSentryStatus } from "../../_core/sentry";
import { getQueryErrorStats } from "../../_core/query-error-alert";
import { collectAppMetrics, getMetricsHistory, getActiveAlerts, THRESHOLDS } from "../../monitoring/app-metrics";
import { sql } from "drizzle-orm";

export const adminPerformanceRouter = router({
  // ===== APP METRICS (heap, event loop, DB latency) =====
  
  appMetrics: adminProcedure.query(async () => {
    return collectAppMetrics();
  }),

  appMetricsHistory: adminProcedure.query(async () => {
    return getMetricsHistory();
  }),

  appAlerts: adminProcedure.query(async () => {
    return getActiveAlerts();
  }),

  appThresholds: adminProcedure.query(async () => {
    return THRESHOLDS;
  }),

  // ===== PERFORMANCE DE ROTAS =====

  // Métricas por rota
  metricasPorRota: adminProcedure.query(async () => {
    return getMetricasPorRota();
  }),
  
  // Métricas de conversão de convites vs logins
  metricasConversao: adminProcedure.query(async () => {
    const dbConn = await (await import('../../db')).getDb();
    if (!dbConn) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados indisponível' });

    // Totais gerais
    const totalConvitesRes = await dbConn.execute(
      sql`SELECT COALESCE(SUM(convitesEnviados), 0) as total, COUNT(*) as emails FROM access_whitelist WHERE ativo = 1`
    );
    const totalLoginsRes = await dbConn.execute(
      sql`SELECT COUNT(*) as total FROM access_logs WHERE acessoPermitido = 1`
    );
    const convertidosRes = await dbConn.execute(
      sql`SELECT COUNT(DISTINCT al.email) as total FROM access_logs al INNER JOIN access_whitelist aw ON al.email = aw.email WHERE al.acessoPermitido = 1 AND aw.ativo = 1`
    );
    const pendentesRes = await dbConn.execute(
      sql`SELECT COUNT(*) as total FROM access_whitelist aw WHERE aw.ativo = 1 AND NOT EXISTS (SELECT 1 FROM access_logs al WHERE al.email = aw.email AND al.acessoPermitido = 1)`
    );

    const row0 = (totalConvitesRes as any)[0]?.[0] ?? {};
    const totalConvites = Number(row0.total ?? 0);
    const totalEmails = Number(row0.emails ?? 0);
    const totalLogins = Number(((totalLoginsRes as any)[0]?.[0] ?? {}).total ?? 0);
    const convertidos = Number(((convertidosRes as any)[0]?.[0] ?? {}).total ?? 0);
    const pendentes = Number(((pendentesRes as any)[0]?.[0] ?? {}).total ?? 0);
    const taxaConversao = totalEmails > 0 ? Math.round((convertidos / totalEmails) * 100) : 0;

    // Dados semanais (últimas 8 semanas)
    const convitesSemanaRes = await dbConn.execute(
      sql`SELECT YEARWEEK(ultimoEnvio, 1) as semana, DATE_FORMAT(MIN(ultimoEnvio), '%d/%m') as label, COUNT(*) as convites FROM access_whitelist WHERE ultimoEnvio >= DATE_SUB(NOW(), INTERVAL 8 WEEK) GROUP BY YEARWEEK(ultimoEnvio, 1) ORDER BY semana ASC`
    );
    const loginsSemanaRes = await dbConn.execute(
      sql`SELECT YEARWEEK(createdAt, 1) as semana, DATE_FORMAT(MIN(createdAt), '%d/%m') as label, COUNT(*) as logins FROM access_logs WHERE acessoPermitido = 1 AND createdAt >= DATE_SUB(NOW(), INTERVAL 8 WEEK) GROUP BY YEARWEEK(createdAt, 1) ORDER BY semana ASC`
    );

    const semanasMap = new Map<number, { label: string; convites: number; logins: number }>();
    for (const row of ((convitesSemanaRes as any)[0] as any[])) {
      semanasMap.set(Number(row.semana), { label: String(row.label), convites: Number(row.convites), logins: 0 });
    }
    for (const row of ((loginsSemanaRes as any)[0] as any[])) {
      const semana = Number(row.semana);
      if (semanasMap.has(semana)) {
        semanasMap.get(semana)!.logins = Number(row.logins);
      } else {
        semanasMap.set(semana, { label: String(row.label), convites: 0, logins: Number(row.logins) });
      }
    }
    const graficoSemanal = Array.from(semanasMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([, v]) => v);

    return {
      totalConvites,
      totalEmails,
      totalLogins,
      convertidos,
      pendentes,
      taxaConversao,
      graficoSemanal,
    };
  }),

  // Estatísticas gerais de performance
  statsPerformance: adminProcedure.query(async () => {
    return getStatsPerformance();
  }),
  
  // Limpar métricas
  limparMetricas: adminProcedure.mutation(async ({ ctx }) => {
    const resultado = limparMetricas();
    
    await logAuditoria({
      userId: ctx.user.id,
      acao: 'limpar_metricas',
      descricao: `Métricas de performance limpas. ${resultado.metricasRemovidas} entradas removidas.`,
      metadata: resultado,
      req: ctx.req
    });
    
    return resultado;
  }),

  // ===== ALERTAS =====

  // Listar alertas
  listarAlertas: adminProcedure
    .input(z.object({
      rota: z.string().optional(),
      resolvido: z.boolean().optional(),
      limit: z.number().min(1).max(500).optional().default(100)
    }).optional())
    .query(async ({ input }) => {
      return listarAlertas(input);
    }),
  
  // Estatísticas de alertas
  statsAlertas: adminProcedure.query(async () => {
    return getStatsAlertas();
  }),
  
  // Resolver alerta
  resolverAlerta: adminProcedure
    .input(z.object({
      alertaId: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      const resultado = await resolverAlerta(input.alertaId);
      
      await logAuditoria({
        userId: ctx.user.id,
        acao: 'resolver_alerta',
        descricao: `Alerta #${input.alertaId} marcado como resolvido.`,
        metadata: resultado,
        req: ctx.req
      });
      
      return resultado;
    }),
  
  // Listar regras de alertas
  listarRegras: adminProcedure.query(async () => {
    return listarRegras();
  }),
  
  // Criar regra de alerta
  criarRegra: adminProcedure
    .input(z.object({
      rota: z.string().optional(),
      metrica: z.enum(["p50", "p95", "p99", "media"]),
      threshold: z.number().min(1),
      cooldown: z.number().min(60).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await criarRegra(input);
      
      await logAuditoria({
        userId: ctx.user.id,
        acao: 'criar_regra_alerta',
        descricao: `Nova regra de alerta criada: ${input.metrica} > ${input.threshold}ms${input.rota ? ` (rota: ${input.rota})` : ' (global)'}.`,
        metadata: { id, ...input },
        req: ctx.req
      });
      
      return { id, ...input };
    }),
  
  // Toggle regra de alerta
  toggleRegra: adminProcedure
    .input(z.object({
      regraId: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      const resultado = await toggleRegra(input.regraId);
      
      await logAuditoria({
        userId: ctx.user.id,
        acao: 'toggle_regra_alerta',
        descricao: `Regra #${input.regraId} ${resultado.isAtivo ? 'ativada' : 'desativada'}.`,
        metadata: resultado,
        req: ctx.req
      });
      
      return resultado;
    }),
  
  // Inicializar regras padrão
  inicializarRegras: adminProcedure.mutation(async ({ ctx }) => {
    await inicializarRegras();
    
    await logAuditoria({
      userId: ctx.user.id,
      acao: 'inicializar_regras',
      descricao: 'Regras de alerta padrão inicializadas.',
      req: ctx.req
    });
    
    return { sucesso: true };
  }),

  // ===== SEGURANÇA & DEPENDÊNCIAS =====

  // Auditoria de Dependências Vulneráveis
  auditarDependencias: adminProcedure.mutation(async ({ ctx }) => {
    const resultado = await executarAuditoriaNpm();
    
    await logAuditoria({
      userId: ctx.user.id,
      acao: 'auditar_dependencias',
      descricao: `Auditoria de dependências executada: ${resultado.totalVulnerabilities} vulnerabilidades encontradas.`,
      metadata: {
        total: resultado.totalVulnerabilities,
        critical: resultado.critical,
        high: resultado.high,
        moderate: resultado.moderate,
        low: resultado.low
      },
      req: ctx.req
    });
    
    return resultado;
  }),

  // Atualizar dependências seguras
  atualizarDependencias: adminProcedure.mutation(async ({ ctx }) => {
    const resultado = await atualizarDependenciasSeguras();
    
    await logAuditoria({
      userId: ctx.user.id,
      acao: 'atualizar_dependencias',
      descricao: `Dependências atualizadas: ${resultado.updated.length} pacotes.`,
      metadata: resultado,
      req: ctx.req
    });
    
    return resultado;
  }),

  // ===== BACKUP =====

  // Criar backup do banco de dados
  criarBackup: adminProcedure.mutation(async ({ ctx }) => {
    const resultado = await criarBackup(ctx.user.id);
    
    await logAuditoria({
      userId: ctx.user.id,
      acao: 'criar_backup',
      descricao: resultado.success 
        ? `Backup criado com sucesso: ${resultado.filename} (${Math.round((resultado.size || 0) / 1024 / 1024)}MB).`
        : `Falha ao criar backup: ${resultado.error}`,
      metadata: resultado,
      req: ctx.req
    });
    
    return resultado;
  }),

  // Listar backups disponíveis
  listarBackups: adminProcedure.query(async () => {
    return listarBackups();
  }),

  // Restaurar backup
  restaurarBackup: adminProcedure
    .input(z.object({
      backupId: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      const resultado = await restaurarBackup(input.backupId);
      
      await logAuditoria({
        userId: ctx.user.id,
        acao: 'restaurar_backup',
        descricao: resultado.success
          ? `Backup #${input.backupId} restaurado com sucesso.`
          : `Falha ao restaurar backup #${input.backupId}: ${resultado.error}`,
        metadata: resultado,
        req: ctx.req
      });
      
      return resultado;
    }),

  // Gerar link de download pré-assinado para um backup (validade: 15 minutos)
  gerarLinkDownloadBackup: adminProcedure
    .input(z.object({
      backupId: z.number()
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await (await import('../../db')).getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Banco de dados indisponível' });

      const { backups } = await import('../../../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      const rows = await db.select().from(backups).where(eq(backups.id, input.backupId)).limit(1);
      if (rows.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Backup não encontrado' });
      }

      const backup = rows[0];
      const { url } = await storageGet(backup.s3Key);

      await logAuditoria({
        userId: ctx.user.id,
        acao: 'download_backup',
        descricao: `Link de download gerado para backup #${input.backupId}: ${backup.filename}`,
        metadata: { backupId: input.backupId, filename: backup.filename },
        req: ctx.req
      });

      return {
        url,
        filename: backup.filename,
        expiresInMinutes: 15,
      };
    }),

  // ===== SENTRY & QUERY ERRORS =====

  // Status do Sentry
  sentryStatus: adminProcedure.query(async () => {
    const status = getSentryStatus();
    return {
      ...status,
      timestamp: new Date().toISOString(),
    };
  }),

  // Estatísticas de erros de query (alerta proativo — threshold 3+ em 1h)
  queryErrorStats: adminProcedure.query(async () => {
    return getQueryErrorStats();
  }),
});
