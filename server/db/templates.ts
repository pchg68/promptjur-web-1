/**
 * Helpers de templates.
 */
import { and, desc, eq } from "drizzle-orm";
import { InsertTemplate, templates } from "../../drizzle/schema";
import { getDb } from "./connection";


// ===== TEMPLATE HELPERS =====

export async function getTemplatesByArea(areaJuridica: string) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(templates)
    .where(and(
      eq(templates.areaJuridica, areaJuridica),
      eq(templates.isAtivo, true)
    ));
}


export async function getAllTemplates() {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(templates)
    .where(eq(templates.isAtivo, true));
}


export async function createTemplate(data: InsertTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(templates).values(data);
  return (result as any).insertId;
}






// ===== TEMPLATE HELPERS =====

export async function getTemplatesUsuario(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(templates)
    .where(and(
      eq(templates.userId, userId),
      eq(templates.isAtivo, true)
    ))
    .orderBy(desc(templates.createdAt));
  
  // Converter para formato serializável
  return result.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString()
  }));
}


export async function getTemplatesSistema() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(templates)
    .where(and(
      eq(templates.userId, null as any),
      eq(templates.isAtivo, true)
    ))
    .orderBy(templates.areaJuridica);
  
  // Converter para formato serializável
  return result.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString()
  }));
}


export async function salvarTemplate(data: InsertTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(templates).values(data);
  return (result as any).insertId;
}


export async function atualizarTemplate(id: number, userId: number, data: Partial<InsertTemplate>) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.update(templates)
    .set(data)
    .where(and(eq(templates.id, id), eq(templates.userId, userId)));
  
  return result.length > 0;
}


export async function toggleTemplatePublico(templateId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  
  // Buscar template atual
  const [template] = await db.select().from(templates)
    .where(eq(templates.id, templateId))
    .limit(1);
  
  if (!template || template.userId !== userId) {
    return false;
  }
  
  // Alternar estado público
  await db.update(templates)
    .set({ isPublico: !template.isPublico })
    .where(eq(templates.id, templateId));
  
  return true;
}


export async function deletarTemplate(templateId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const [template] = await db.select().from(templates)
    .where(eq(templates.id, templateId))
    .limit(1);
    
  if (!template || template.userId !== userId) return false;
  
  await db.delete(templates).where(eq(templates.id, templateId));
  return true;
}
