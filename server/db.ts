import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  prompts, InsertPrompt,
  analises, InsertAnalise,
  templates, InsertTemplate,
  fontesJuridicas, InsertFonteJuridica,
  historico, InsertHistorico,
  configuracoes, InsertConfiguracao
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ===== USER HELPERS =====

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== PROMPT HELPERS =====

export async function createPrompt(data: InsertPrompt) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(prompts).values(data);
  return result[0].insertId;
}

export async function getUserPrompts(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(prompts)
    .where(eq(prompts.userId, userId))
    .orderBy(desc(prompts.createdAt))
    .limit(limit);
}

export async function getPromptById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(prompts).where(eq(prompts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePrompt(id: number, data: Partial<InsertPrompt>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(prompts).set(data).where(eq(prompts.id, id));
}

export async function toggleFavorito(id: number, isFavorito: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(prompts).set({ isFavorito }).where(eq(prompts.id, id));
}

// ===== ANALISE HELPERS =====

export async function createAnalise(data: InsertAnalise) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(analises).values(data);
  return result[0].insertId;
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
  
  const result = await db.insert(templates).values(data);
  return result[0].insertId;
}

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
  
  const result = await db.insert(fontesJuridicas).values(data);
  return result[0].insertId;
}

export async function searchFontes(query: string, tipo?: string) {
  const db = await getDb();
  if (!db) return [];
  
  // Implementação básica - pode ser melhorada com full-text search
  return db.select().from(fontesJuridicas)
    .where(eq(fontesJuridicas.isVerificada, true))
    .limit(20);
}

// ===== HISTORICO HELPERS =====

export async function createHistorico(data: InsertHistorico) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(historico).values(data);
  return result[0].insertId;
}

export async function getUserHistorico(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(historico)
    .where(eq(historico.userId, userId))
    .orderBy(desc(historico.createdAt))
    .limit(limit);
}

export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) return { totalAnalises: 0, totalGeracoes: 0, totalOtimizacoes: 0, totalTemplates: 0 };
  
  const hist = await db.select().from(historico)
    .where(and(
      eq(historico.userId, userId),
      eq(historico.sucesso, true)
    ));
  
  const totalAnalises = hist.filter(h => h.acao === 'analise').length;
  const totalGeracoes = hist.filter(h => h.acao === 'geracao').length;
  const totalOtimizacoes = hist.filter(h => h.acao === 'otimizacao').length;
  
  // Contar templates do usuário
  const userTemplates = await db.select().from(templates)
    .where(and(
      eq(templates.userId, userId),
      eq(templates.isAtivo, true)
    ));
  const totalTemplates = userTemplates.length;
  
  return { totalAnalises, totalGeracoes, totalOtimizacoes, totalTemplates };
}

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
  
  await db.insert(configuracoes).values(data).onDuplicateKeyUpdate({
    set: {
      areaPreferida: data.areaPreferida,
      nivelDetalhePreferido: data.nivelDetalhePreferido,
      incluirReferenciasDefault: data.incluirReferenciasDefault,
      personaDefault: data.personaDefault,
      preferencias: data.preferencias,
      updatedAt: new Date(),
    },
  });
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
    
  return result;
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
    
  return result;
}

export async function salvarTemplate(data: InsertTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(templates).values(data);
  return result[0].insertId;
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
