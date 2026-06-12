/**
 * Helpers de prompts.
 */
import { randomBytes } from "crypto";
import { and, desc, eq } from "drizzle-orm";
import { InsertPrompt, prompts } from "../../drizzle/schema";
import { getDb } from "./connection";


function generateToken(): string {
  return randomBytes(32).toString("hex");
}

// ===== PROMPT HELPERS =====

export async function createPrompt(data: InsertPrompt) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(prompts).values(data);
  return (result as any).insertId;
}


export async function getUserPrompts(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db.select().from(prompts)
    .where(eq(prompts.userId, userId))
    .orderBy(desc(prompts.createdAt))
    .limit(limit);
  
  // Converter para formato serializável
  return results.map((p: any) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString()
  }));
}


export async function getPromptById(id: number, userId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const conditions = [eq(prompts.id, id)];
  if (userId !== undefined) {
    conditions.push(eq(prompts.userId, userId));
  }
  
  const result = await db.select().from(prompts).where(and(...conditions)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}


export async function updatePrompt(id: number, data: Partial<InsertPrompt>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(prompts).set(data).where(eq(prompts.id, id));
}


export async function toggleFavorito(id: number, isFavorito: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(prompts).set({ isFavorito }).where(eq(prompts.id, id));
}


export async function excluirPrompt(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se o prompt pertence ao usuário
  const prompt = await db.select().from(prompts).where(eq(prompts.id, id)).limit(1);
  if (!prompt || prompt.length === 0) {
    throw new Error("Prompt não encontrado");
  }
  if (prompt[0].userId !== userId) {
    throw new Error("Sem permissão para excluir este prompt");
  }
  
  // Excluir prompt (cascade irá excluir relacionamentos)
  await db.delete(prompts).where(eq(prompts.id, id));
}


/**
 * Gera (ou retorna existente) um shareToken para o prompt do usuário.
 * Retorna o token gerado.
 */
export async function compartilharPrompt(promptId: number, userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  // Verificar que o prompt pertence ao usuário
  const result = await db.select({ id: prompts.id, shareToken: prompts.shareToken })
    .from(prompts)
    .where(and(eq(prompts.id, promptId), eq(prompts.userId, userId)))
    .limit(1);

  if (result.length === 0) return null;

  // Se já tem token, retorna o existente
  if (result[0].shareToken) return result[0].shareToken;

  // Gera novo token
  const token = generateToken();
  await db.update(prompts).set({ shareToken: token }).where(eq(prompts.id, promptId));
  return token;
}


/**
 * Remove o token de compartilhamento (torna privado novamente).
 */
export async function descompartilharPrompt(promptId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.update(prompts)
    .set({ shareToken: null })
    .where(and(eq(prompts.id, promptId), eq(prompts.userId, userId)));

  return true;
}


/**
 * Busca prompt público pelo shareToken (sem autenticação necessária).
 * Retorna dados limitados — sem dados sensíveis do usuário.
 */
export async function getPromptByShareToken(token: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select({
    id: prompts.id,
    tipo: prompts.tipo,
    areaJuridica: prompts.areaJuridica,
    promptOtimizado: prompts.promptOtimizado,
    qualidade: prompts.qualidade,
    createdAt: prompts.createdAt,
  })
    .from(prompts)
    .where(eq(prompts.shareToken, token))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}
