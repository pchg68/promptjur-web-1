/**
 * Helpers de análises.
 */
import { desc, eq } from "drizzle-orm";
import { InsertAnalise, analises } from "../../drizzle/schema";
import { getDb } from "./connection";


// ===== ANALISE HELPERS =====

export async function createAnalise(data: InsertAnalise) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(analises).values(data);
  return (result as any).insertId;
}


export async function getAnaliseByPromptId(promptId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(analises)
    .where(eq(analises.promptId, promptId))
    .orderBy(desc(analises.createdAt))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}
