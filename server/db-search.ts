import { eq, and, or, gte, lte, like, inArray, desc, asc, sql } from "drizzle-orm";
import { prompts, promptTags, tags } from "../drizzle/schema";
import { getDb } from "./db";

export interface SearchFilters {
  userId: number;
  texto?: string; // Busca em título/conteúdo
  areasJuridicas?: string[]; // Filtro por múltiplas áreas
  dataInicio?: Date; // Data de criação >= dataInicio
  dataFim?: Date; // Data de criação <= dataFim
  tagIds?: number[]; // Filtro por tags
  qualidade?: ("excelente" | "bom" | "ruim")[]; // Filtro por qualidade
  ordenacao?: "data_desc" | "data_asc" | "qualidade" | "relevancia";
  limite?: number;
  offset?: number;
}

export async function searchPrompts(filters: SearchFilters) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  // Construir condições WHERE
  const conditions: any[] = [eq(prompts.userId, filters.userId)];

  // Filtro de texto (busca em promptOriginal e promptOtimizado)
  if (filters.texto && filters.texto.trim()) {
    const searchTerm = `%${filters.texto.trim()}%`;
    conditions.push(
      or(
        like(prompts.promptOriginal, searchTerm),
        like(prompts.promptOtimizado, searchTerm)
      )
    );
  }

  // Filtro por áreas jurídicas
  if (filters.areasJuridicas && filters.areasJuridicas.length > 0) {
    conditions.push(inArray(prompts.areaJuridica, filters.areasJuridicas));
  }

  // Filtro por intervalo de datas
  if (filters.dataInicio) {
    conditions.push(gte(prompts.createdAt, filters.dataInicio));
  }
  if (filters.dataFim) {
    conditions.push(lte(prompts.createdAt, filters.dataFim));
  }

  // Filtro por qualidade
  if (filters.qualidade && filters.qualidade.length > 0) {
    conditions.push(inArray(prompts.qualidade, filters.qualidade));
  }

  // Determinar ordenação
  const ordenacao = filters.ordenacao || "data_desc";
  let orderByClause: any;
  
  if (ordenacao === "data_asc") {
    orderByClause = asc(prompts.createdAt);
  } else if (ordenacao === "qualidade") {
    orderByClause = sql`CASE 
      WHEN ${prompts.qualidade} = 'excelente' THEN 1
      WHEN ${prompts.qualidade} = 'bom' THEN 2
      WHEN ${prompts.qualidade} = 'ruim' THEN 3
      ELSE 4
    END`;
  } else {
    orderByClause = desc(prompts.createdAt);
  }

  // Paginação
  const limite = filters.limite || 20;
  const offset = filters.offset || 0;

  // Query completa
  const results = await database
    .select({
      id: prompts.id,
      userId: prompts.userId,
      tipo: prompts.tipo,
      areaJuridica: prompts.areaJuridica,
      promptOriginal: prompts.promptOriginal,
      promptOtimizado: prompts.promptOtimizado,
      qualidade: prompts.qualidade,
      isFavorito: prompts.isFavorito,
      metadata: prompts.metadata,
      createdAt: prompts.createdAt,
      updatedAt: prompts.updatedAt,
    })
    .from(prompts)
    .where(and(...conditions))
    .orderBy(orderByClause)
    .limit(limite)
    .offset(offset);

  // Se houver filtro de tags, fazer join manual
  if (filters.tagIds && filters.tagIds.length > 0) {
    const promptIds = results.map((p) => p.id);
    if (promptIds.length === 0) return [];

    // Buscar prompts que possuem TODAS as tags especificadas
    const promptsComTags = await database
      .select({ promptId: promptTags.promptId })
      .from(promptTags)
      .where(
        and(
          inArray(promptTags.promptId, promptIds),
          inArray(promptTags.tagId, filters.tagIds)
        )
      )
      .groupBy(promptTags.promptId)
      .having(sql`COUNT(DISTINCT ${promptTags.tagId}) = ${filters.tagIds.length}`);

    const idsComTodasTags = new Set(promptsComTags.map((p) => p.promptId));
    return results.filter((p) => idsComTodasTags.has(p.id));
  }

  return results;
}

/**
 * Contar total de resultados (para paginação)
 */
export async function countSearchResults(filters: SearchFilters): Promise<number> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const conditions: any[] = [eq(prompts.userId, filters.userId)];

  if (filters.texto && filters.texto.trim()) {
    const searchTerm = `%${filters.texto.trim()}%`;
    conditions.push(
      or(
        like(prompts.promptOriginal, searchTerm),
        like(prompts.promptOtimizado, searchTerm)
      )
    );
  }

  if (filters.areasJuridicas && filters.areasJuridicas.length > 0) {
    conditions.push(inArray(prompts.areaJuridica, filters.areasJuridicas));
  }

  if (filters.dataInicio) {
    conditions.push(gte(prompts.createdAt, filters.dataInicio));
  }
  if (filters.dataFim) {
    conditions.push(lte(prompts.createdAt, filters.dataFim));
  }

  if (filters.qualidade && filters.qualidade.length > 0) {
    conditions.push(inArray(prompts.qualidade, filters.qualidade));
  }

  const result = await database
    .select({ count: sql<number>`COUNT(*)` })
    .from(prompts)
    .where(and(...conditions));

  return result[0]?.count || 0;
}
