import { eq, and } from "drizzle-orm";
import { tags } from "../drizzle/schema";
import { getDb } from "./db";

export async function atualizarTag(
  tagId: number,
  userId: number,
  data: { nome?: string; cor?: string }
) {
  const db = await getDb();
  if (!db) return false;

  const [tag] = await db
    .select()
    .from(tags)
    .where(eq(tags.id, tagId))
    .limit(1);

  if (!tag || tag.userId !== userId) return false;

  const updateData: any = {};
  if (data.nome !== undefined) updateData.nome = data.nome;
  if (data.cor !== undefined) updateData.cor = data.cor;

  if (Object.keys(updateData).length === 0) return true;

  await db.update(tags).set(updateData).where(eq(tags.id, tagId));

  return true;
}

export async function atribuirTagPrompt(
  promptId: number,
  tagId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se a tag pertence ao usuário
  const [tag] = await db
    .select()
    .from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .limit(1);

  if (!tag) {
    throw new Error("Tag não encontrada ou sem permissão");
  }

  // Delegar para função existente
  const { atribuirTagPrompt: originalFn } = await import("./db");
  return originalFn(promptId, tagId);
}
