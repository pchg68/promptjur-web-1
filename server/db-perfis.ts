import { eq } from "drizzle-orm";
import { perfisUso, type InsertPerfilUso } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Criar novo perfil de uso
 */
export async function criarPerfil(perfil: InsertPerfilUso) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [novoPerfil] = await db.insert(perfisUso).values(perfil);
  return novoPerfil;
}

/**
 * Listar perfis do usuário
 */
export async function listarPerfis(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(perfisUso)
    .where(eq(perfisUso.userId, userId))
    .orderBy(perfisUso.createdAt);
}

/**
 * Deletar perfil
 */
export async function deletarPerfil(perfilId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(perfisUso)
    .where(eq(perfisUso.id, perfilId));
  
  return { success: true };
}

/**
 * Buscar perfil por ID
 */
export async function buscarPerfilPorId(perfilId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [perfil] = await db
    .select()
    .from(perfisUso)
    .where(eq(perfisUso.id, perfilId))
    .limit(1);

  return perfil;
}
