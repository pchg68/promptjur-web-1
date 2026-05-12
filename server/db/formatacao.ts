/**
 * Helpers de formatação de templates.
 */
import { and, desc, eq } from "drizzle-orm";
import { formatacaoTemplates, templates } from "../../drizzle/schema";
import { getDb } from "./connection";


// ==================== TEMPLATES DE FORMATAÇÃO ====================

/**
 * Criar novo template de formatação
 */
export async function criarFormatacaoTemplate(data: {
  userId: number;
  nome: string;
  fonte?: string;
  tamanhoFonte?: number;
  espacamento?: string;
  margemSuperior?: number;
  margemInferior?: number;
  margemEsquerda?: number;
  margemDireita?: number;
  incluirCabecalho?: boolean;
  incluirDataHora?: boolean;
  isPadrao?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Se isPadrao=true, remover isPadrao de outros templates do usuário
  if (data.isPadrao) {
    await db
      .update(formatacaoTemplates)
      .set({ isPadrao: false })
      .where(eq(formatacaoTemplates.userId, data.userId));
  }

  const [insertRes] = await db
    .insert(formatacaoTemplates)
    .values(data);
  const newId = (insertRes as any).insertId;
  const [template] = await db.select().from(formatacaoTemplates).where(eq(formatacaoTemplates.id, newId)).limit(1);
  return template;
}


/**
 * Listar templates de formatação do usuário
 */
export async function listarFormatacaoTemplates(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(formatacaoTemplates)
    .where(eq(formatacaoTemplates.userId, userId))
    .orderBy(desc(formatacaoTemplates.isPadrao), desc(formatacaoTemplates.createdAt));
}


/**
 * Buscar template de formatação por ID
 */
export async function buscarFormatacaoTemplate(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(formatacaoTemplates)
    .where(and(
      eq(formatacaoTemplates.id, id),
      eq(formatacaoTemplates.userId, userId)
    ))
    .limit(1);

  return result[0];
}


/**
 * Buscar template padrão do usuário
 */
export async function buscarFormatacaoTemplatePadrao(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(formatacaoTemplates)
    .where(and(
      eq(formatacaoTemplates.userId, userId),
      eq(formatacaoTemplates.isPadrao, true)
    ))
    .limit(1);

  return result[0];
}


/**
 * Atualizar template de formatação
 */
export async function atualizarFormatacaoTemplate(
  id: number,
  userId: number,
  data: Partial<{
    nome: string;
    fonte: string;
    tamanhoFonte: number;
    espacamento: string;
    margemSuperior: number;
    margemInferior: number;
    margemEsquerda: number;
    margemDireita: number;
    incluirCabecalho: boolean;
    incluirDataHora: boolean;
    isPadrao: boolean;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Se isPadrao=true, remover isPadrao de outros templates do usuário
  if (data.isPadrao) {
    await db
      .update(formatacaoTemplates)
      .set({ isPadrao: false })
      .where(eq(formatacaoTemplates.userId, userId));
  }

  await db
    .update(formatacaoTemplates)
    .set(data)
    .where(and(
      eq(formatacaoTemplates.id, id),
      eq(formatacaoTemplates.userId, userId)
    ));

  return { success: true };
}

/**
 * Deletar template de formatação
 */
export async function deletarFormatacaoTemplate(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(formatacaoTemplates)
    .where(and(
      eq(formatacaoTemplates.id, id),
      eq(formatacaoTemplates.userId, userId)
    ));

  return { success: true };
}


/**
 * Definir template como padrão
 */
export async function definirFormatacaoTemplatePadrao(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Remover isPadrao de todos os templates do usuário
  await db
    .update(formatacaoTemplates)
    .set({ isPadrao: false })
    .where(eq(formatacaoTemplates.userId, userId));

  // Definir o template especificado como padrão
  await db
    .update(formatacaoTemplates)
    .set({ isPadrao: true })
    .where(and(
      eq(formatacaoTemplates.id, id),
      eq(formatacaoTemplates.userId, userId)
    ));

  return { success: true };
}
