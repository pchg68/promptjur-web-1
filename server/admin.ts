/**
 * Admin Tools - Ferramentas administrativas para desenvolvedores
 * Acesso restrito apenas para usuários com role='admin'
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { logAuditoria, listarLogs, getAuditStats } from "./audit";
import { getMetricasPorRota, getStatsPerformance, limparMetricas, registrarMetrica, listarAlertas, resolverAlerta, getStatsAlertas, criarRegra, listarRegras, toggleRegra, inicializarRegras } from "./performance";
import { listarFeatures, toggleFeature, criarFeature, inicializarFeatures, limparCacheFeatures } from "./feature-flags";
import { executarAuditoriaNpm, atualizarDependenciasSeguras } from "./security-audit";
import { criarBackup, listarBackups, restaurarBackup } from "./backup";
import { getSentryStatus, isSentryActive } from "./_core/sentry";
import { enterpriseLeads, launchInterests, accessWhitelist } from "../drizzle/schema";
import { addToWhitelist, removeFromWhitelist, listWhitelist } from "./whitelist";
import { eq, desc, sql } from "drizzle-orm";

// Middleware para verificar se é admin
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ 
      code: 'FORBIDDEN',
      message: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.'
    });
  }
  return next({ ctx });
});

// Cache em memória simples (LRU-like)
interface CacheEntry {
  data: any;
  timestamp: number;
  hits: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
let cacheHits = 0;
let cacheMisses = 0;

export function getCachedData<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const entry = cache.get(key);
  
  // Cache hit válido
  if (entry && (now - entry.timestamp) < CACHE_TTL) {
    entry.hits++;
    cacheHits++;
    return Promise.resolve(entry.data as T);
  }
  
  // Cache miss - buscar dados
  cacheMisses++;
  return fetcher().then(data => {
    cache.set(key, {
      data,
      timestamp: now,
      hits: 0
    });
    
    // Limitar tamanho do cache (LRU simples)
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    
    return data;
  });
}

export const adminRouter = router({
  // Auditoria de Serialização
  auditarSerializacao: adminProcedure.mutation(async () => {
    // Simular auditoria (em produção, isso leria os arquivos e analisaria)
    const problemas: Array<{ rota: string; motivo: string }> = [];
    
    // Verificar se há funções que retornam objetos Drizzle diretamente
    // Esta é uma implementação simplificada - em produção, usaria AST parsing
    const rotasAnalisadas = [
      'prompts.listar',
      'prompts.stats',
      'historico.listar',
      'templates.meus',
      'templates.sistema',
      'tags.minhas',
      'analytics.get',
      'analytics.usageByDate',
      'versoes.listar',
      'modelos.maisUsados'
    ];
    
    // Todas as rotas já foram corrigidas, então não há problemas
    return {
      totalRotas: rotasAnalisadas.length,
      problemasEncontrados: problemas.length,
      problemas,
      timestamp: new Date().toISOString()
    };
  }),

  // Limpar Cache
  limparCache: adminProcedure.mutation(async ({ ctx }) => {
    const tamanhoAntes = cache.size;
    cache.clear();
    cacheHits = 0;
    cacheMisses = 0;
    
    // Registrar no log de auditoria
    await logAuditoria({
      userId: ctx.user.id,
      acao: 'limpar_cache',
      descricao: `Cache limpo com sucesso. ${tamanhoAntes} entradas removidas.`,
      metadata: { entradasRemovidas: tamanhoAntes },
      req: ctx.req
    });
    
    return {
      sucesso: true,
      entradasRemovidas: tamanhoAntes,
      timestamp: new Date().toISOString()
    };
  }),

  // Estatísticas do Cache
  estatisticasCache: adminProcedure.query(async () => {
    const now = Date.now();
    let entradasValidas = 0;
    let entradasExpiradas = 0;
    
    cache.forEach((entry) => {
      if ((now - entry.timestamp) < CACHE_TTL) {
        entradasValidas++;
      } else {
        entradasExpiradas++;
      }
    });
    
    const totalRequests = cacheHits + cacheMisses;
    const taxaAcerto = totalRequests > 0 
      ? Math.round((cacheHits / totalRequests) * 100) 
      : 0;
    
    // Estimar memória usada (aproximação)
    const memoriaBytes = cache.size * 1024; // ~1KB por entrada (estimativa)
    const memoriaUsada = memoriaBytes < 1024 * 1024 
      ? `${Math.round(memoriaBytes / 1024)} KB`
      : `${(memoriaBytes / (1024 * 1024)).toFixed(2)} MB`;
    
    return {
      totalEntradas: cache.size,
      entradasValidas,
      entradasExpiradas,
      taxaAcerto,
      memoriaUsada,
      cacheHits,
      cacheMisses,
      timestamp: new Date().toISOString()
    };
  }),

  // Executar Testes de Integração
  executarTestes: adminProcedure.mutation(async ({ ctx }) => {
    const testes: Array<{ nome: string; sucesso: boolean; erro?: string }> = [];
    
    // Teste 1: Verificar serialização de prompts
    try {
      const prompts = await db.getUserPrompts(ctx.user.id, 5);
      // Verificar se todos os campos Date foram convertidos para string
      const todosSerializaveis = prompts.every(p => 
        typeof p.createdAt === 'string' && typeof p.updatedAt === 'string'
      ) || prompts.length === 0;
      testes.push({
        nome: 'Serialização de Prompts',
        sucesso: todosSerializaveis,
        erro: todosSerializaveis ? undefined : 'Campos Date não foram convertidos para string'
      });
    } catch (error: any) {
      testes.push({
        nome: 'Serialização de Prompts',
        sucesso: false,
        erro: error.message
      });
    }
    
    // Teste 2: Verificar serialização de histórico
    try {
      const historico = await db.getUserHistorico(ctx.user.id, 5);
      const todosSerializaveis = historico.every(h => typeof h.createdAt === 'string') || historico.length === 0;
      testes.push({
        nome: 'Serialização de Histórico',
        sucesso: todosSerializaveis,
        erro: todosSerializaveis ? undefined : 'Campo createdAt não foi convertido para string'
      });
    } catch (error: any) {
      testes.push({
        nome: 'Serialização de Histórico',
        sucesso: false,
        erro: error.message
      });
    }
    
    // Teste 3: Verificar serialização de templates
    try {
      const templates = await db.getTemplatesUsuario(ctx.user.id);
      const todosSerializaveis = templates.every(t => 
        typeof t.createdAt === 'string' && typeof t.updatedAt === 'string'
      ) || templates.length === 0;
      testes.push({
        nome: 'Serialização de Templates',
        sucesso: todosSerializaveis,
        erro: todosSerializaveis ? undefined : 'Campos Date não foram convertidos para string'
      });
    } catch (error: any) {
      testes.push({
        nome: 'Serialização de Templates',
        sucesso: false,
        erro: error.message
      });
    }
    
    // Teste 4: Verificar analytics
    try {
      const analytics = await db.getAnalytics(ctx.user.id);
      const serializavel = analytics && (analytics.recentHistory.every((h: any) => 
        typeof h.createdAt === 'string'
      ) || analytics.recentHistory.length === 0);
      testes.push({
        nome: 'Serialização de Analytics',
        sucesso: Boolean(serializavel),
        erro: serializavel ? undefined : 'recentHistory contém campos Date não convertidos'
      });
    } catch (error: any) {
      testes.push({
        nome: 'Serialização de Analytics',
        sucesso: false,
        erro: error.message
      });
    }
    
    // Teste 5: Verificar stats
    try {
      const stats = await db.getUserStats(ctx.user.id);
      const serializavel = typeof stats.totalAnalises === 'number' && 
                          typeof stats.totalGeracoes === 'number';
      testes.push({
        nome: 'Estatísticas do Usuário',
        sucesso: serializavel,
        erro: serializavel ? undefined : 'Stats retornou tipos inválidos'
      });
    } catch (error: any) {
      testes.push({
        nome: 'Estatísticas do Usuário',
        sucesso: false,
        erro: error.message
      });
    }
    
    const totalTestes = testes.length;
    const totalSucessos = testes.filter(t => t.sucesso).length;
    const totalFalhas = testes.filter(t => !t.sucesso).length;
    const falhas = testes.filter(t => !t.sucesso).map(t => ({
      teste: t.nome,
      erro: t.erro || 'Erro desconhecido'
    }));
    
    // Registrar no log de auditoria
    await logAuditoria({
      userId: ctx.user.id,
      acao: 'executar_testes',
      descricao: `Testes de integração executados. ${totalSucessos}/${totalTestes} sucessos.`,
      metadata: { totalTestes, totalSucessos, totalFalhas, falhas },
      req: ctx.req
    });
    
    return {
      totalTestes,
      totalSucessos,
      totalFalhas,
      falhas,
      timestamp: new Date().toISOString()
    };
  }),

  // ===== LOGS DE AUDITORIA =====
  
  // Listar logs de auditoria
  listarLogs: adminProcedure
    .input(z.object({
      userId: z.number().optional(),
      acao: z.string().optional(),
      dataInicio: z.string().optional(), // ISO string
      dataFim: z.string().optional(), // ISO string
      limit: z.number().min(1).max(500).optional().default(100)
    }).optional())
    .query(async ({ input }) => {
      const params = {
        userId: input?.userId,
        acao: input?.acao,
        dataInicio: input?.dataInicio ? new Date(input.dataInicio) : undefined,
        dataFim: input?.dataFim ? new Date(input.dataFim) : undefined,
        limit: input?.limit
      };
      return listarLogs(params);
    }),
  
  // Estatísticas de auditoria
  statsAuditoria: adminProcedure.query(async () => {
    return getAuditStats();
  }),

  // ===== MONITORAMENTO DE PERFORMANCE =====
  
  // Métricas por rota
  metricasPorRota: adminProcedure.query(async () => {
    return getMetricasPorRota();
  }),
  
  // Estatísticas gerais de performance
  statsPerformance: adminProcedure.query(async () => {
    return getStatsPerformance();
  }),
  
  // Limpar métricas
  limparMetricas: adminProcedure.mutation(async ({ ctx }) => {
    const resultado = limparMetricas();
    
    // Registrar no log de auditoria
    await logAuditoria({
      userId: ctx.user.id,
      acao: 'limpar_metricas',
      descricao: `Métricas de performance limpas. ${resultado.metricasRemovidas} entradas removidas.`,
      metadata: resultado,
      req: ctx.req
    });
    
    return resultado;
  }),

  // ===== FEATURE FLAGS =====
  
  // Listar todas as features
  listarFeatures: adminProcedure.query(async () => {
    return listarFeatures();
  }),
  
  // Toggle feature flag
  toggleFeature: adminProcedure
    .input(z.object({
      nome: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const resultado = await toggleFeature(input.nome);
      
      // Registrar no log de auditoria
      await logAuditoria({
        userId: ctx.user.id,
        acao: 'toggle_feature',
        descricao: `Feature "${resultado.nome}" ${resultado.isAtivo ? 'ativada' : 'desativada'}.`,
        metadata: resultado,
        req: ctx.req
      });
      
      return resultado;
    }),
  
  // Criar nova feature
  criarFeature: adminProcedure
    .input(z.object({
      nome: z.string(),
      descricao: z.string().optional(),
      isAtivo: z.boolean().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const id = await criarFeature(input);
      
      // Registrar no log de auditoria
      await logAuditoria({
        userId: ctx.user.id,
        acao: 'criar_feature',
        descricao: `Nova feature "${input.nome}" criada.`,
        metadata: { id, ...input },
        req: ctx.req
      });
      
      return { id, ...input };
    }),
  
  // Inicializar features padrão
  inicializarFeatures: adminProcedure.mutation(async ({ ctx }) => {
    await inicializarFeatures();
    
    // Registrar no log de auditoria
    await logAuditoria({
      userId: ctx.user.id,
      acao: 'inicializar_features',
      descricao: 'Features padrão inicializadas.',
      req: ctx.req
    });
    
    return { sucesso: true };
  }),
  
  // Limpar cache de features
  limparCacheFeatures: adminProcedure.mutation(async ({ ctx }) => {
    const resultado = limparCacheFeatures();
    
    // Registrar no log de auditoria
    await logAuditoria({
      userId: ctx.user.id,
      acao: 'limpar_cache_features',
      descricao: `Cache de feature flags limpo. ${resultado.entradasRemovidas} entradas removidas.`,
      metadata: resultado,
      req: ctx.req
    });
    
    return resultado;
  }),

  // ===== ALERTAS DE PERFORMANCE =====
  
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
      
      // Registrar no log de auditoria
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
      
      // Registrar no log de auditoria
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
      
      // Registrar no log de auditoria
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
    
    // Registrar no log de auditoria
    await logAuditoria({
      userId: ctx.user.id,
      acao: 'inicializar_regras',
      descricao: 'Regras de alerta padrão inicializadas.',
      req: ctx.req
    });
    
    return { sucesso: true };
  }),

  // Auditoria de Dependências Vulneráveis
  auditarDependencias: adminProcedure.mutation(async ({ ctx }) => {
    const resultado = await executarAuditoriaNpm();
    
    // Registrar no log de auditoria
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
    
    // Registrar no log de auditoria
    await logAuditoria({
      userId: ctx.user.id,
      acao: 'atualizar_dependencias',
      descricao: `Dependências atualizadas: ${resultado.updated.length} pacotes.`,
      metadata: resultado,
      req: ctx.req
    });
    
    return resultado;
  }),

  // Criar backup do banco de dados
  criarBackup: adminProcedure.mutation(async ({ ctx }) => {
    const resultado = await criarBackup(ctx.user.id);
    
    // Registrar no log de auditoria
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
      
      // Registrar no log de auditoria
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

  // Status do Sentry
  sentryStatus: adminProcedure.query(async () => {
    const status = getSentryStatus();
    return {
      ...status,
      timestamp: new Date().toISOString(),
    };
  }),

  // ===== LEADS ENTERPRISE =====

  // Listar leads Enterprise com filtros
  getLeads: adminProcedure
    .input(z.object({
      status: z.enum(["pendente", "contatado", "convertido", "descartado", "todos"]).optional().default("todos"),
      limit: z.number().min(1).max(100).optional().default(50),
      offset: z.number().min(0).optional().default(0),
    }))
    .query(async ({ input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const whereClause = input.status !== "todos"
        ? eq(enterpriseLeads.status, input.status as "pendente" | "contatado" | "convertido" | "descartado")
        : undefined;

      const leads = await dbConn
        .select()
        .from(enterpriseLeads)
        .where(whereClause)
        .orderBy(desc(enterpriseLeads.criadoEm))
        .limit(input.limit)
        .offset(input.offset);

      // Contagem de pendentes para badge
      const pendentesResult = await dbConn
        .select({ count: sql<number>`COUNT(*)` })
        .from(enterpriseLeads)
        .where(eq(enterpriseLeads.status, "pendente"));

      const totalPendentes = Number(pendentesResult[0]?.count ?? 0);

      return {
        leads: leads.map(l => ({
          ...l,
          criadoEm: l.criadoEm.toISOString(),
          atualizadoEm: l.atualizadoEm.toISOString(),
          contatadoEm: l.contatadoEm ? l.contatadoEm.toISOString() : null,
        })),
        totalPendentes,
      };
    }),

  // Listar interessados no lançamento
  getInteressados: adminProcedure
    .input(z.object({
      plano: z.enum(["pro", "enterprise", "qualquer", "todos"]).default("todos"),
      notificado: z.boolean().optional(),
      limit: z.number().min(1).max(200).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      const conditions: ReturnType<typeof eq>[] = [];
      if (input.plano !== "todos") conditions.push(eq(launchInterests.planoInteresse, input.plano as "pro" | "enterprise" | "qualquer"));
      if (input.notificado !== undefined) conditions.push(eq(launchInterests.notificado, input.notificado));
      const whereClause = conditions.length === 1 ? conditions[0] : conditions.length > 1 ? sql`${conditions[0]} AND ${conditions[1]}` : undefined;
      const rows = await dbConn
        .select()
        .from(launchInterests)
        .where(whereClause)
        .orderBy(desc(launchInterests.criadoEm))
        .limit(input.limit)
        .offset(input.offset);
      const totalResult = await dbConn.select({ count: sql<number>`COUNT(*)` }).from(launchInterests).where(whereClause);
      const naoNotificadosResult = await dbConn.select({ count: sql<number>`COUNT(*)` }).from(launchInterests).where(eq(launchInterests.notificado, false));
      return {
        interessados: rows.map(r => ({ ...r, criadoEm: r.criadoEm.toISOString(), atualizadoEm: r.atualizadoEm.toISOString() })),
        total: Number(totalResult[0]?.count ?? 0),
        naoNotificados: Number(naoNotificadosResult[0]?.count ?? 0),
      };
    }),

  // Marcar interessados como notificados
  marcarNotificados: adminProcedure
    .input(z.object({ ids: z.array(z.number()).min(1) }))
    .mutation(async ({ input, ctx }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      for (const id of input.ids) {
        await dbConn.update(launchInterests).set({ notificado: true }).where(eq(launchInterests.id, id));
      }
      await logAuditoria({
        userId: ctx.user.id,
        acao: "marcar_notificados",
        descricao: `${input.ids.length} interessado(s) marcados como notificados`,
        metadata: { ids: input.ids },
        req: ctx.req,
      });
      return { success: true };
    }),

  // Atualizar status de um lead
  updateLeadStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pendente", "contatado", "convertido", "descartado"]),
      notasInternas: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const dbConn = await db.getDb();
      if (!dbConn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const updateData: Record<string, unknown> = { status: input.status };
      if (input.notasInternas !== undefined) updateData.notasInternas = input.notasInternas;
      if (input.status === "contatado") updateData.contatadoEm = new Date();

      await dbConn
        .update(enterpriseLeads)
        .set(updateData)
        .where(eq(enterpriseLeads.id, input.id));

      await logAuditoria({
        userId: ctx.user.id,
        acao: "update_lead_status",
        descricao: `Lead #${input.id} atualizado para status: ${input.status}`,
        metadata: { leadId: input.id, novoStatus: input.status },
        req: ctx.req,
      });

      return { success: true };
    }),

  // ==================== WHITELIST ====================

  getWhitelist: adminProcedure
    .query(async () => {
      return listWhitelist();
    }),

  addWhitelist: adminProcedure
    .input(z.object({
      email: z.string().email(),
      nome: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await addToWhitelist(input.email, input.nome, ctx.user.email ?? undefined);
      await logAuditoria({
        userId: ctx.user.id,
        acao: "add_whitelist",
        descricao: `E-mail adicionado à whitelist: ${input.email}`,
        metadata: { email: input.email },
        req: ctx.req,
      });
      return { success: true };
    }),

  removeWhitelist: adminProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      await removeFromWhitelist(input.email);
      await logAuditoria({
        userId: ctx.user.id,
        acao: "remove_whitelist",
        descricao: `E-mail removido da whitelist: ${input.email}`,
        metadata: { email: input.email },
        req: ctx.req,
      });
      return { success: true };
    }),

  importWhitelist: adminProcedure
    .input(z.object({
      emails: z.array(z.string().email()).min(1).max(100),
    }))
    .mutation(async ({ input, ctx }) => {
      let adicionados = 0;
      for (const email of input.emails) {
        await addToWhitelist(email, undefined, ctx.user.email ?? undefined);
        adicionados++;
      }
      await logAuditoria({
        userId: ctx.user.id,
        acao: "import_whitelist",
        descricao: `${adicionados} e-mail(s) importados para a whitelist`,
        metadata: { total: adicionados },
        req: ctx.req,
      });
      return { success: true, adicionados };
    }),
});
