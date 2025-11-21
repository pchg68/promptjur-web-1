import { eq, desc, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  userPetitions,
  InsertUserPetition,
  userStyleProfiles,
  InsertUserStyleProfile,
  UserStyleProfile,
} from "../drizzle/schema";

// ===== USER PETITIONS HELPERS =====

export async function createUserPetition(data: InsertUserPetition) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(userPetitions).values(data);
  return result[0].insertId;
}

export async function getUserPetitions(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(userPetitions)
    .where(eq(userPetitions.userId, userId))
    .orderBy(desc(userPetitions.createdAt));
}

export async function getPetitionById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(userPetitions)
    .where(and(eq(userPetitions.id, id), eq(userPetitions.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updatePetition(
  id: number,
  userId: number,
  data: Partial<InsertUserPetition>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(userPetitions)
    .set(data)
    .where(and(eq(userPetitions.id, id), eq(userPetitions.userId, userId)));
}

export async function deletePetition(id: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .delete(userPetitions)
    .where(and(eq(userPetitions.id, id), eq(userPetitions.userId, userId)));

  return result[0].affectedRows > 0;
}

export async function markPetitionAsAnalyzed(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(userPetitions)
    .set({ analisado: true })
    .where(and(eq(userPetitions.id, id), eq(userPetitions.userId, userId)));
}

export async function getUnanalyzedPetitions(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(userPetitions)
    .where(
      and(eq(userPetitions.userId, userId), eq(userPetitions.analisado, false))
    )
    .orderBy(desc(userPetitions.createdAt));
}

// ===== USER STYLE PROFILE HELPERS =====

export async function getUserStyleProfile(userId: number): Promise<UserStyleProfile | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(userStyleProfiles)
    .where(eq(userStyleProfiles.userId, userId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createUserStyleProfile(data: InsertUserStyleProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(userStyleProfiles).values(data);
  return result[0].insertId;
}

export async function updateUserStyleProfile(
  userId: number,
  data: Partial<InsertUserStyleProfile>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verificar se perfil existe
  const existing = await getUserStyleProfile(userId);

  if (existing) {
    // Atualizar perfil existente
    await db
      .update(userStyleProfiles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userStyleProfiles.userId, userId));
  } else {
    // Criar novo perfil
    await db.insert(userStyleProfiles).values({
      userId,
      ...data,
    } as InsertUserStyleProfile);
  }
}

export async function incrementPeticoesAnalisadas(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const profile = await getUserStyleProfile(userId);

  if (profile) {
    const newCount = (profile.peticoesAnalisadas || 0) + 1;
    // Confiança aumenta com mais petições: min 20%, max 95%
    const newConfidence = Math.min(95, 20 + newCount * 15);

    await db
      .update(userStyleProfiles)
      .set({
        peticoesAnalisadas: newCount,
        confiancaPerfil: newConfidence,
        ultimaAnalise: new Date(),
      })
      .where(eq(userStyleProfiles.userId, userId));
  }
}
