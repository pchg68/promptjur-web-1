/**
 * Helpers de cabeçalho de templates.
 */
import { eq } from "drizzle-orm";
import { InsertCabecalhoTemplate, cabecalhoTemplates } from "../../drizzle/schema";
import { getDb } from "./connection";



// ===== CABEÇALHO TEMPLATES HELPERS =====

/**
 * Salva ou atualiza o template de cabeçalho do usuário
 */
export async function salvarCabecalhoTemplate(userId: number, data: Partial<InsertCabecalhoTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se já existe template para este usuário
  const existing = await db.select().from(cabecalhoTemplates).where(eq(cabecalhoTemplates.userId, userId)).limit(1);
  
  if (existing.length > 0) {
    // Atualizar existente
    const now = new Date();
    await db.update(cabecalhoTemplates)
      .set({ ...data, updatedAt: now })
      .where(eq(cabecalhoTemplates.userId, userId));
    
    // Retornar com campos Date serializados
    return { 
      ...existing[0], 
      ...data,
      createdAt: existing[0].createdAt.toISOString(),
      updatedAt: now.toISOString()
    };
  } else {
    // Criar novo
    const now = new Date();
    const [insertResult] = await db.insert(cabecalhoTemplates).values({
      userId,
      ...data
    });
    const insertedId = (insertResult as any).insertId;
    // Retornar com campos Date serializados
    return {
      id: insertedId,
      userId,
      ...data,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
  }
}


/**
 * Busca o template de cabeçalho do usuário
 */
export async function getCabecalhoTemplate(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(cabecalhoTemplates).where(eq(cabecalhoTemplates.userId, userId)).limit(1);
  
  if (result.length === 0) return null;
  
  // Serializar campos Date para evitar erro tRPC
  const template = result[0];
  return {
    ...template,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString()
  };
}


/**
 * Gera o texto do cabeçalho formatado para inclusão em documentos
 */
export async function gerarTextoCabecalho(userId: number): Promise<string | null> {
  const template = await getCabecalhoTemplate(userId);
  
  if (!template || !template.habilitado) {
    return null;
  }
  
  const partes: string[] = [];
  
  if (template.nomeEscritorio) {
    partes.push(`**${template.nomeEscritorio}**`);
  }
  
  if (template.oab) {
    partes.push(template.oab);
  }
  
  if (template.endereco) {
    partes.push(template.endereco);
  }
  
  const contatos: string[] = [];
  if (template.telefone) contatos.push(`Tel: ${template.telefone}`);
  if (template.email) contatos.push(`Email: ${template.email}`);
  if (template.website) contatos.push(`Site: ${template.website}`);
  
  if (contatos.length > 0) {
    partes.push(contatos.join(' | '));
  }
  
  if (partes.length === 0) {
    return null;
  }
  
  return partes.join('\n') + '\n\n---\n\n';
}
