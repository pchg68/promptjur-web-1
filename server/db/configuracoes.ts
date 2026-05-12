/**
 * Helpers de configurações do usuário.
 */
import { eq } from "drizzle-orm";
import { InsertConfiguracao, configuracoes } from "../../drizzle/schema";
import { getDb } from "./connection";


// ===== CONFIGURACAO HELPERS =====

export async function getUserConfiguracao(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(configuracoes)
    .where(eq(configuracoes.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}


export async function upsertConfiguracao(data: InsertConfiguracao) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(configuracoes).values(data).onDuplicateKeyUpdate({ set: {
      areaPreferida: data.areaPreferida,
      nivelDetalhePreferido: data.nivelDetalhePreferido,
      incluirReferenciasDefault: data.incluirReferenciasDefault,
      personaDefault: data.personaDefault,
      preferencias: data.preferencias,
      updatedAt: new Date(),
    },
  });
}
