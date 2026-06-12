/**
 * Helpers de versionamento de prompts.
 */
import { desc, eq } from "drizzle-orm";
import { InsertPromptVersao, promptVersoes } from "../../drizzle/schema";
import { getDb } from "./connection";


// ===== VERSÃO HELPERS =====

export async function salvarVersaoPrompt(data: InsertPromptVersao) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(promptVersoes).values(data);
  return (result as any).insertId;
}


export async function getVersoesPrompt(promptId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(promptVersoes)
    .where(eq(promptVersoes.promptId, promptId))
    .orderBy(desc(promptVersoes.versao));
  
  // Converter para formato serializável
  return result.map((v: any) => ({
    ...v,
    createdAt: v.createdAt.toISOString()
  }));
}
