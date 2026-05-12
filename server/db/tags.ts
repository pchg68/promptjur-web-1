/**
 * Helpers de tags.
 */
import { and, eq } from "drizzle-orm";
import { InsertTag, promptTags, tags, templateTags } from "../../drizzle/schema";
import { getDb } from "./connection";


// ===== TAG HELPERS =====

export async function getTagsUsuario(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(tags)
    .where(eq(tags.userId, userId))
    .orderBy(tags.nome);
    
  // Serializar campos Date para ISO strings
  return result.map(tag => ({
    ...tag,
    createdAt: tag.createdAt.toISOString()
  }));
}


export async function criarTag(data: InsertTag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(tags).values(data);
  return (result as any).insertId;
}


export async function deletarTag(tagId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  
  const [tag] = await db.select().from(tags)
    .where(eq(tags.id, tagId))
    .limit(1);
    
  if (!tag || tag.userId !== userId) return false;
  
  // Deletar relacionamentos primeiro
  await db.delete(templateTags).where(eq(templateTags.tagId, tagId));
  await db.delete(promptTags).where(eq(promptTags.tagId, tagId));
  
  // Deletar tag
  await db.delete(tags).where(eq(tags.id, tagId));
  return true;
}


export async function atribuirTagTemplate(templateId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se já existe
  const existing = await db.select().from(templateTags)
    .where(and(
      eq(templateTags.templateId, templateId),
      eq(templateTags.tagId, tagId)
    ))
    .limit(1);
    
  if (existing.length > 0) return existing[0].id;
  
  const [result] = await db.insert(templateTags).values({
    templateId,
    tagId
  });
  return (result as any).insertId;
}


export async function removerTagTemplate(templateId: number, tagId: number) {
  const db = await getDb();
  if (!db) return false;
  
  await db.delete(templateTags).where(and(
    eq(templateTags.templateId, templateId),
    eq(templateTags.tagId, tagId)
  ));
  return true;
}


export async function getTagsTemplate(templateId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    id: tags.id,
    nome: tags.nome,
    cor: tags.cor
  })
  .from(templateTags)
  .innerJoin(tags, eq(templateTags.tagId, tags.id))
  .where(eq(templateTags.templateId, templateId));
  
  return result;
}



export async function atribuirTagPrompt(promptId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se já existe
  const existing = await db.select().from(promptTags)
    .where(and(
      eq(promptTags.promptId, promptId),
      eq(promptTags.tagId, tagId)
    ))
    .limit(1);
    
  if (existing.length > 0) return existing[0].id;
  
  const [result] = await db.insert(promptTags).values({
    promptId,
    tagId
  });
  return (result as any).insertId;
}


export async function removerTagPrompt(promptId: number, tagId: number) {
  const db = await getDb();
  if (!db) return false;
  
  await db.delete(promptTags).where(and(
    eq(promptTags.promptId, promptId),
    eq(promptTags.tagId, tagId)
  ));
  return true;
}


export async function getTagsPrompt(promptId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select({
    id: tags.id,
    nome: tags.nome,
    cor: tags.cor
  })
  .from(promptTags)
  .innerJoin(tags, eq(promptTags.tagId, tags.id))
  .where(eq(promptTags.promptId, promptId));
  
  return result;
}
