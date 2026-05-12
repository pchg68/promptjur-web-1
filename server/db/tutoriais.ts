/**
 * Helpers de tutoriais e feedback.
 */
import { and, eq, sql } from "drizzle-orm";
import { tutorialFeedback, tutorialProgresso } from "../../drizzle/schema";
import { getDb } from "./connection";



// ===== Tutorial Progresso =====

export async function marcarTutorialConcluido(userId: number, tutorialId: string) {
  const db = await getDb();
  if (!db) return null;

  // Verificar se já existe registro
  const existente = await db
    .select()
    .from(tutorialProgresso)
    .where(
      and(
        eq(tutorialProgresso.userId, userId),
        eq(tutorialProgresso.tutorialId, tutorialId)
      )
    )
    .limit(1);

  if (existente.length > 0) {
    // Já marcado como concluído
    return existente[0];
  }

  // Criar novo registro
  await db.insert(tutorialProgresso).values({
    userId,
    tutorialId,
    concluido: true,
  });

  return { userId, tutorialId, concluido: true };
}


export async function obterProgressoTutoriais(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const progresso = await db
    .select()
    .from(tutorialProgresso)
    .where(eq(tutorialProgresso.userId, userId));

  return progresso;
}


export async function verificarTutorialConcluido(userId: number, tutorialId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const resultado = await db
    .select()
    .from(tutorialProgresso)
    .where(
      and(
        eq(tutorialProgresso.userId, userId),
        eq(tutorialProgresso.tutorialId, tutorialId),
        eq(tutorialProgresso.concluido, true)
      )
    )
    .limit(1);

  return resultado.length > 0;
}



// ============= Tutorial Feedback =============

export async function registrarFeedbackTutorial(userId: number, tutorialId: string, util: boolean) {
  const db = await getDb();
  if (!db) return;
  
  // Verificar se já existe feedback deste usuário para este tutorial
  const existente = await db.select()
    .from(tutorialFeedback)
    .where(and(
      eq(tutorialFeedback.userId, userId),
      eq(tutorialFeedback.tutorialId, tutorialId)
    ))
    .limit(1);
  
  if (existente.length > 0) {
    // Atualizar feedback existente
    await db.update(tutorialFeedback)
      .set({ util, atualizadoEm: new Date() })
      .where(eq(tutorialFeedback.id, existente[0].id));
  } else {
    // Criar novo feedback
    await db.insert(tutorialFeedback).values({
      userId,
      tutorialId,
      util,
    });
  }
}


export async function obterFeedbackUsuario(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(tutorialFeedback)
    .where(eq(tutorialFeedback.userId, userId));
}


export async function obterEstatisticasFeedback() {
  const db = await getDb();
  if (!db) return [];
  
  // Retorna contagem de útil/não útil por tutorial
  const result = await db.select({
    tutorialId: tutorialFeedback.tutorialId,
    totalUtil: sql<number>`SUM(CASE WHEN ${tutorialFeedback.util} = true THEN 1 ELSE 0 END)`,
    totalNaoUtil: sql<number>`SUM(CASE WHEN ${tutorialFeedback.util} = false THEN 1 ELSE 0 END)`,
    total: sql<number>`COUNT(*)`,
  })
    .from(tutorialFeedback)
    .groupBy(tutorialFeedback.tutorialId);
  
  return result;
}
