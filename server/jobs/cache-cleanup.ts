/**
 * Job de limpeza automática de cache de legislação
 * Executa diariamente para remover registros expirados
 */

import { cleanExpiredCache } from "../db-legislacao-cache";

/**
 * Executa a limpeza de cache expirado
 * Retorna o número de registros removidos
 */
export async function runCacheCleanup(): Promise<number> {
  console.log("[CacheCleanup] Iniciando limpeza de cache expirado...");
  
  try {
    const removedCount = await cleanExpiredCache();
    
    console.log(`[CacheCleanup] Limpeza concluída: ${removedCount} registros removidos`);
    
    return removedCount;
  } catch (error) {
    console.error("[CacheCleanup] Erro durante limpeza:", error);
    throw error;
  }
}

/**
 * Agenda a execução diária do job de limpeza
 * Executa às 3h da manhã (horário do servidor)
 */
export function scheduleCacheCleanup(): void {
  // Calcular tempo até próxima execução (3h da manhã)
  const now = new Date();
  const next3AM = new Date(now);
  next3AM.setHours(3, 0, 0, 0);
  
  // Se já passou das 3h hoje, agendar para amanhã
  if (now.getHours() >= 3) {
    next3AM.setDate(next3AM.getDate() + 1);
  }
  
  const msUntilNext = next3AM.getTime() - now.getTime();
  
  console.log(`[CacheCleanup] Próxima limpeza agendada para: ${next3AM.toLocaleString('pt-BR')}`);
  
  // Agendar primeira execução
  setTimeout(async () => {
    await runCacheCleanup();
    
    // Agendar execuções subsequentes a cada 24 horas
    setInterval(async () => {
      await runCacheCleanup();
    }, 24 * 60 * 60 * 1000); // 24 horas em milissegundos
  }, msUntilNext);
}

/**
 * Executa limpeza imediata (útil para testes ou manutenção manual)
 */
export async function runImmediateCleanup(): Promise<void> {
  console.log("[CacheCleanup] Executando limpeza imediata...");
  await runCacheCleanup();
}
