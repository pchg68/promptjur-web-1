import { eq, and, desc, sql, count, max } from "drizzle-orm";
import { getDb } from "./db";
import { documentVersions, InsertDocumentVersion } from "../drizzle/schema";
import { logger } from "./_core/logger";

/**
 * Salvar uma nova versão de documento gerado.
 * Calcula automaticamente o número da versão dentro do grupo.
 */
export async function salvarVersaoDocumento(data: Omit<InsertDocumentVersion, "versao">): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calcular próxima versão dentro do grupo
  const [result] = await db
    .select({ maxVersao: max(documentVersions.versao) })
    .from(documentVersions)
    .where(
      and(
        eq(documentVersions.userId, data.userId),
        eq(documentVersions.groupId, data.groupId)
      )
    );

  const proximaVersao = (result?.maxVersao ?? 0) + 1;

  const [inserted] = await db.insert(documentVersions).values({
    ...data,
    versao: proximaVersao,
  }).returning({ id: documentVersions.id });

  logger.info("[DocumentVersions] Versão salva", {
    userId: data.userId,
    groupId: data.groupId,
    versao: proximaVersao,
  });

  return inserted.id;
}

/**
 * Listar todos os grupos de documentos do usuário (agrupados por groupId).
 * Retorna o resumo de cada grupo com a última versão.
 */
export async function listarGruposDocumentos(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const grupos = await db
    .select({
      groupId: documentVersions.groupId,
      titulo: documentVersions.titulo,
      tipoDocumento: documentVersions.tipoDocumento,
      areaJuridica: documentVersions.areaJuridica,
      totalVersoes: count(documentVersions.id),
      ultimaVersao: max(documentVersions.versao),
      ultimaCriacao: max(documentVersions.createdAt),
    })
    .from(documentVersions)
    .where(eq(documentVersions.userId, userId))
    .groupBy(
      documentVersions.groupId,
      documentVersions.titulo,
      documentVersions.tipoDocumento,
      documentVersions.areaJuridica
    )
    .orderBy(desc(max(documentVersions.createdAt)));

  return grupos;
}

/**
 * Listar todas as versões de um grupo específico.
 */
export async function listarVersoesGrupo(userId: number, groupId: string) {
  const db = await getDb();
  if (!db) return [];

  const versoes = await db
    .select({
      id: documentVersions.id,
      versao: documentVersions.versao,
      titulo: documentVersions.titulo,
      tipoDocumento: documentVersions.tipoDocumento,
      areaJuridica: documentVersions.areaJuridica,
      estrategia: documentVersions.estrategia,
      contexto: documentVersions.contexto,
      documento: documentVersions.documento,
      tempoGeracaoMs: documentVersions.tempoGeracaoMs,
      metadata: documentVersions.metadata,
      notas: documentVersions.notas,
      createdAt: documentVersions.createdAt,
    })
    .from(documentVersions)
    .where(
      and(
        eq(documentVersions.userId, userId),
        eq(documentVersions.groupId, groupId)
      )
    )
    .orderBy(desc(documentVersions.versao));

  return versoes;
}

/**
 * Obter uma versão específica por ID.
 */
export async function obterVersaoDocumento(userId: number, versionId: number) {
  const db = await getDb();
  if (!db) return null;

  const [versao] = await db
    .select()
    .from(documentVersions)
    .where(
      and(
        eq(documentVersions.userId, userId),
        eq(documentVersions.id, versionId)
      )
    )
    .limit(1);

  return versao ?? null;
}

/**
 * Atualizar notas de uma versão.
 */
export async function atualizarNotasVersao(userId: number, versionId: number, notas: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(documentVersions)
    .set({ notas })
    .where(
      and(
        eq(documentVersions.userId, userId),
        eq(documentVersions.id, versionId)
      )
    );
}

/**
 * Excluir uma versão específica.
 */
export async function excluirVersaoDocumento(userId: number, versionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(documentVersions)
    .where(
      and(
        eq(documentVersions.userId, userId),
        eq(documentVersions.id, versionId)
      )
    );
}

/**
 * Excluir todas as versões de um grupo.
 */
export async function excluirGrupoDocumentos(userId: number, groupId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(documentVersions)
    .where(
      and(
        eq(documentVersions.userId, userId),
        eq(documentVersions.groupId, groupId)
      )
    );
}
