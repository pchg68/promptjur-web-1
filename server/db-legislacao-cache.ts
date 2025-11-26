/**
 * Helpers de cache de validação de legislação
 * Otimiza performance armazenando resultados de validações anteriores
 */

import { eq, lt } from "drizzle-orm";
import { legislacaoCache, InsertLegislacaoCache, type LegislacaoCache } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Busca uma validação no cache
 * Retorna null se não encontrada ou expirada
 */
export async function getCachedValidation(citacao: string): Promise<LegislacaoCache | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(legislacaoCache)
      .where(eq(legislacaoCache.citacao, citacao.trim()))
      .limit(1);

    if (result.length === 0) return null;

    const cached = result[0];

    // Verificar se expirou
    if (cached.expiresAt && new Date() > new Date(cached.expiresAt)) {
      // Cache expirado, remover
      await db.delete(legislacaoCache).where(eq(legislacaoCache.id, cached.id));
      return null;
    }

    return cached;
  } catch (error) {
    console.error("[Cache] Erro ao buscar validação:", error);
    return null;
  }
}

/**
 * Salva uma validação no cache
 * TTL padrão: 30 dias
 */
export async function setCachedValidation(
  citacao: string,
  tipo: "artigo" | "lei" | "codigo" | "decreto" | "portaria",
  confiabilidade: "alta" | "media" | "baixa",
  motivo: string,
  linkOficial?: string,
  ttlDays: number = 30
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    const cacheEntry: InsertLegislacaoCache = {
      citacao: citacao.trim(),
      tipo,
      confiabilidade,
      motivo,
      linkOficial: linkOficial || null,
      expiresAt,
    };

    // Usar INSERT ... ON DUPLICATE KEY UPDATE para atualizar se já existir
    await db
      .insert(legislacaoCache)
      .values(cacheEntry)
      .onDuplicateKeyUpdate({
        set: {
          confiabilidade,
          motivo,
          linkOficial: linkOficial || null,
          expiresAt,
        },
      });

    return true;
  } catch (error) {
    console.error("[Cache] Erro ao salvar validação:", error);
    return false;
  }
}

/**
 * Limpa registros expirados do cache
 * Deve ser executado periodicamente (cron job)
 */
export async function cleanExpiredCache(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const now = new Date();
    const result = await db
      .delete(legislacaoCache)
      .where(lt(legislacaoCache.expiresAt, now));

    console.log(`[Cache] ${result.rowsAffected || 0} registros expirados removidos`);
    return result.rowsAffected || 0;
  } catch (error) {
    console.error("[Cache] Erro ao limpar cache expirado:", error);
    return 0;
  }
}

/**
 * Obtém estatísticas do cache
 */
export async function getCacheStatistics(): Promise<{
  total: number;
  porTipo: Record<string, number>;
  porConfiabilidade: Record<string, number>;
}> {
  const db = await getDb();
  if (!db) {
    return { total: 0, porTipo: {}, porConfiabilidade: {} };
  }

  try {
    const allEntries = await db.select().from(legislacaoCache);

    const porTipo: Record<string, number> = {};
    const porConfiabilidade: Record<string, number> = {};

    allEntries.forEach((entry) => {
      porTipo[entry.tipo] = (porTipo[entry.tipo] || 0) + 1;
      porConfiabilidade[entry.confiabilidade] = (porConfiabilidade[entry.confiabilidade] || 0) + 1;
    });

    return {
      total: allEntries.length,
      porTipo,
      porConfiabilidade,
    };
  } catch (error) {
    console.error("[Cache] Erro ao obter estatísticas:", error);
    return { total: 0, porTipo: {}, porConfiabilidade: {} };
  }
}

/**
 * Popular cache com leis mais comuns (para inicialização)
 */
export async function populateCommonLaws(): Promise<number> {
  const commonLaws = [
    { citacao: "Lei 8.078/90", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Código de Defesa do Consumidor", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm" },
    { citacao: "Lei 13.105/2015", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Código de Processo Civil", linkOficial: "http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm" },
    { citacao: "Lei 10.406/2002", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Código Civil", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm" },
    { citacao: "Lei 13.709/2018", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei Geral de Proteção de Dados (LGPD)", linkOficial: "http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm" },
    { citacao: "Lei 11.101/2005", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei de Recuperação Judicial e Falência", linkOficial: "http://www.planalto.gov.br/ccivil_03/_ato2004-2006/2005/lei/l11101.htm" },
    { citacao: "Lei 5.172/1966", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Código Tributário Nacional (CTN)", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l5172compilado.htm" },
    { citacao: "Lei 8.069/90", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Estatuto da Criança e do Adolescente (ECA)", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l8069.htm" },
    { citacao: "Lei 9.099/95", tipo: "lei" as const, confiabilidade: "alta" as const, motivo: "Lei dos Juizados Especiais", linkOficial: "http://www.planalto.gov.br/ccivil_03/leis/l9099.htm" },
  ];

  let count = 0;
  for (const law of commonLaws) {
    const success = await setCachedValidation(
      law.citacao,
      law.tipo,
      law.confiabilidade,
      law.motivo,
      law.linkOficial,
      90 // 90 dias para leis comuns
    );
    if (success) count++;
  }

  console.log(`[Cache] ${count} leis comuns populadas no cache`);
  return count;
}
