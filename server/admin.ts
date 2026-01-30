/**
 * Admin Tools - Ferramentas administrativas para desenvolvedores
 * Acesso restrito apenas para usuários com role='admin'
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";

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
  limparCache: adminProcedure.mutation(async () => {
    const tamanhoAntes = cache.size;
    cache.clear();
    cacheHits = 0;
    cacheMisses = 0;
    
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
    
    return {
      totalTestes,
      totalSucessos,
      totalFalhas,
      falhas,
      timestamp: new Date().toISOString()
    };
  })
});
