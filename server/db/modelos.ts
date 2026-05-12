/**
 * Helpers de modelos de IA.
 */
import { desc, eq, sql } from "drizzle-orm";
import { usoModelos } from "../../drizzle/schema";
import { getDb } from "./connection";


// ===== USO DE MODELOS HELPERS =====

export async function registrarUsoModelo(userId: number, modeloId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(usoModelos).values({ userId, modeloId });
}


export async function getModelosMaisUsados(userId: number, limit: number = 5) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    modeloId: usoModelos.modeloId,
    count: sql<number>`COUNT(*)`
  })
  .from(usoModelos)
  .where(eq(usoModelos.userId, userId))
  .groupBy(usoModelos.modeloId)
  .orderBy(desc(sql`COUNT(*)`))
  .limit(limit);
  
  return result;
}
