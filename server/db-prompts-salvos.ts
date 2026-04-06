/**
 * Queries do banco de dados para a tabela `prompts_salvos`.
 * Gerencia o histórico de prompts selecionados pelo usuário no assistente JurIA.
 */
import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { promptsSalvos, type InsertPromptSalvo, type PromptSalvo } from "../drizzle/schema";
import { getDb } from "./db";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type FiltrosListagem = {
  areaJuridica?: string;
  estrategia?: "direta" | "raciocinio" | "recuperacao" | "manual";
  apenasFavorito?: boolean;
  busca?: string;
  limit?: number;
  offset?: number;
};

export type PromptSalvoComContagem = PromptSalvo & { totalCount?: number };

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Salva um novo prompt no histórico do usuário.
 * Retorna o ID do registro criado.
 */
export async function salvarPrompt(dados: InsertPromptSalvo): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  const result = await db.insert(promptsSalvos).values(dados);
  return (result as unknown as { insertId: number }).insertId;
}

/**
 * Lista os prompts salvos de um usuário com filtros opcionais.
 */
export async function listarPromptsSalvos(
  userId: number,
  filtros: FiltrosListagem = {}
): Promise<PromptSalvo[]> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  const { areaJuridica, estrategia, apenasFavorito, busca, limit = 50, offset = 0 } = filtros;

  const condicoes = [eq(promptsSalvos.userId, userId)];

  if (areaJuridica) {
    condicoes.push(eq(promptsSalvos.areaJuridica, areaJuridica));
  }
  if (estrategia) {
    condicoes.push(eq(promptsSalvos.estrategia, estrategia));
  }
  if (apenasFavorito) {
    condicoes.push(eq(promptsSalvos.isFavorito, true));
  }
  if (busca) {
    condicoes.push(
      or(
        like(promptsSalvos.titulo, `%${busca}%`),
        like(promptsSalvos.conteudo, `%${busca}%`),
        like(promptsSalvos.areaJuridica, `%${busca}%`)
      )!
    );
  }

  return db
    .select()
    .from(promptsSalvos)
    .where(and(...condicoes))
    .orderBy(desc(promptsSalvos.isFavorito), desc(promptsSalvos.createdAt))
    .limit(limit)
    .offset(offset);
}

/**
 * Conta o total de prompts salvos de um usuário (para paginação).
 */
export async function contarPromptsSalvos(
  userId: number,
  filtros: Omit<FiltrosListagem, "limit" | "offset"> = {}
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  const { areaJuridica, estrategia, apenasFavorito, busca } = filtros;
  const condicoes = [eq(promptsSalvos.userId, userId)];

  if (areaJuridica) condicoes.push(eq(promptsSalvos.areaJuridica, areaJuridica));
  if (estrategia) condicoes.push(eq(promptsSalvos.estrategia, estrategia));
  if (apenasFavorito) condicoes.push(eq(promptsSalvos.isFavorito, true));
  if (busca) {
    condicoes.push(
      or(
        like(promptsSalvos.titulo, `%${busca}%`),
        like(promptsSalvos.conteudo, `%${busca}%`)
      )!
    );
  }

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(promptsSalvos)
    .where(and(...condicoes));

  return Number(result[0]?.count ?? 0);
}

/**
 * Busca um prompt salvo pelo ID, verificando que pertence ao usuário.
 */
export async function buscarPromptSalvo(
  id: number,
  userId: number
): Promise<PromptSalvo | null> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  const result = await db
    .select()
    .from(promptsSalvos)
    .where(and(eq(promptsSalvos.id, id), eq(promptsSalvos.userId, userId)))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Atualiza campos editáveis de um prompt salvo.
 */
export async function atualizarPromptSalvo(
  id: number,
  userId: number,
  dados: Partial<Pick<PromptSalvo, "titulo" | "notas" | "isFavorito" | "conteudo">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  await db
    .update(promptsSalvos)
    .set(dados)
    .where(and(eq(promptsSalvos.id, id), eq(promptsSalvos.userId, userId)));
}

/**
 * Incrementa o contador de uso de um prompt.
 */
export async function incrementarUsoPrompt(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(promptsSalvos)
    .set({ usoCount: sql`${promptsSalvos.usoCount} + 1` })
    .where(and(eq(promptsSalvos.id, id), eq(promptsSalvos.userId, userId)));
}

/**
 * Alterna o estado de favorito de um prompt.
 * Retorna o novo estado (true = favorito, false = não favorito).
 */
export async function toggleFavorito(id: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  const prompt = await buscarPromptSalvo(id, userId);
  if (!prompt) throw new Error("Prompt não encontrado");

  const novoEstado = !prompt.isFavorito;
  await db
    .update(promptsSalvos)
    .set({ isFavorito: novoEstado })
    .where(and(eq(promptsSalvos.id, id), eq(promptsSalvos.userId, userId)));

  return novoEstado;
}

/**
 * Remove um prompt salvo do histórico.
 */
export async function deletarPromptSalvo(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");

  await db
    .delete(promptsSalvos)
    .where(and(eq(promptsSalvos.id, id), eq(promptsSalvos.userId, userId)));
}

/**
 * Lista as áreas jurídicas distintas dos prompts salvos do usuário.
 * Útil para preencher o filtro de área na UI.
 */
export async function listarAreasJuridicas(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .selectDistinct({ areaJuridica: promptsSalvos.areaJuridica })
    .from(promptsSalvos)
    .where(
      and(
        eq(promptsSalvos.userId, userId),
        sql`${promptsSalvos.areaJuridica} IS NOT NULL`
      )
    )
    .orderBy(promptsSalvos.areaJuridica);

  return result
    .map((r) => r.areaJuridica)
    .filter((a): a is string => a !== null && a !== undefined);
}
