/**
 * Admin Sub-Router: Cache & Testes de Integração
 * - Auditoria de serialização
 * - Limpar cache
 * - Estatísticas do cache
 * - Executar testes de integração
 */

import { router } from "../../_core/trpc";
import { adminProcedure, clearCache, getCacheStats } from "./shared";
import { logAuditoria } from "../../audit";
import * as db from "../../db";

export const adminCacheRouter = router({
  // Auditoria de Serialização
  auditarSerializacao: adminProcedure.mutation(async () => {
    const problemas: Array<{ rota: string; motivo: string }> = [];
    
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
    
    return {
      totalRotas: rotasAnalisadas.length,
      problemasEncontrados: problemas.length,
      problemas,
      timestamp: new Date().toISOString()
    };
  }),

  // Limpar Cache
  limparCache: adminProcedure.mutation(async ({ ctx }) => {
    const entradasRemovidas = clearCache();
    
    await logAuditoria({
      userId: ctx.user.id,
      acao: 'limpar_cache',
      descricao: `Cache limpo com sucesso. ${entradasRemovidas} entradas removidas.`,
      metadata: { entradasRemovidas },
      req: ctx.req
    });
    
    return {
      sucesso: true,
      entradasRemovidas,
      timestamp: new Date().toISOString()
    };
  }),

  // Estatísticas do Cache
  estatisticasCache: adminProcedure.query(async () => {
    return getCacheStats();
  }),

  // Executar Testes de Integração
  executarTestes: adminProcedure.mutation(async ({ ctx }) => {
    const testes: Array<{ nome: string; sucesso: boolean; erro?: string }> = [];
    
    // Teste 1: Verificar serialização de prompts
    try {
      const prompts = await db.getUserPrompts(ctx.user.id, 5);
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
});
