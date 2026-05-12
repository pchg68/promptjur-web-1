/**
 * Helpers de fontes jurídicas.
 */
import { eq } from "drizzle-orm";
import { InsertFonteJuridica, fontesJuridicas } from "../../drizzle/schema";
import { getDb } from "./connection";


// ===== FONTE JURIDICA HELPERS =====

export async function getFonteByIdentificador(identificador: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(fontesJuridicas)
    .where(eq(fontesJuridicas.identificador, identificador))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}


export async function createFonteJuridica(data: InsertFonteJuridica) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(fontesJuridicas).values(data);
  return (result as any).insertId;
}


export async function searchFontes(query: string, tipo?: string) {
  const db = await getDb();
  if (!db) return [];
  
  // Implementação básica - pode ser melhorada com full-text search
  return db.select().from(fontesJuridicas)
    .where(eq(fontesJuridicas.isVerificada, true))
    .limit(20);
}
