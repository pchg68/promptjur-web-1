/**
 * Shared utilities for admin sub-routers
 * - adminProcedure middleware
 * - Cache helpers (in-memory LRU-like)
 */

import { protectedProcedure } from "../../_core/trpc";
import { TRPCError } from "@trpc/server";

// Middleware para verificar se é admin
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
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

export function clearCache() {
  const tamanhoAntes = cache.size;
  cache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  return tamanhoAntes;
}

export function getCacheStats() {
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
}
