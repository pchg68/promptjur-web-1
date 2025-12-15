import { eq, desc, and, sql, like, or, gte, lte, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { 
  InsertUser, users, 
  prompts, InsertPrompt,
  analises, InsertAnalise,
  templates, InsertTemplate,
  fontesJuridicas, InsertFonteJuridica,
  historico, InsertHistorico,
  configuracoes, InsertConfiguracao,
  tags, InsertTag,
  templateTags, InsertTemplateTag,
  promptTags, InsertPromptTag,
  promptVersoes, InsertPromptVersao,
  usoModelos, InsertUsoModelo
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // Create mysql2 pool connection
      _pool = mysql.createPool(process.env.DATABASE_URL);
      _db = drizzle(_pool);
      console.log("[Database] Connected successfully");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
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

export async function createPrompt(prompt: InsertPrompt): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(prompts).values(prompt);
  
  // Para Drizzle ORM com mysql2, o insertId está em result[0].insertId
  const insertId = (result as any)[0]?.insertId;
  if (!insertId) {
    console.warn("[Database] Insert succeeded but no insertId returned, using LAST_INSERT_ID()");
    const [rows] = await db.execute(sql`SELECT LAST_INSERT_ID() as id`);
    return (rows as any)[0]?.id || 0;
  }
  return insertId;
}

export async function getPromptsByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db.select().from(prompts).where(eq(prompts.userId, userId)).orderBy(desc(prompts.createdAt));
}

export async function getPromptById(id: number, userId?: number) {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  let whereClause;
  if (userId) {
    whereClause = and(eq(prompts.id, id), eq(prompts.userId, userId));
  } else {
    whereClause = eq(prompts.id, id);
  }

  const result = await db.select().from(prompts).where(whereClause).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updatePrompt(id: number, data: Partial<InsertPrompt>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(prompts).set(data).where(eq(prompts.id, id));
}

export async function deletePrompt(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(prompts).where(eq(prompts.id, id));
}

// ===== ANALISE HELPERS =====

export async function createAnalise(analise: InsertAnalise): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(analises).values(analise);
  
  const insertId = (result as any)[0]?.insertId;
  if (!insertId) {
    console.warn("[Database] Insert succeeded but no insertId returned, using LAST_INSERT_ID()");
    const [rows] = await db.execute(sql`SELECT LAST_INSERT_ID() as id`);
    return (rows as any)[0]?.id || 0;
  }
  return insertId;
}

export async function getAnalisesByPromptId(promptId: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db.select().from(analises).where(eq(analises.promptId, promptId)).orderBy(desc(analises.createdAt));
}

// ===== TEMPLATE HELPERS =====

export async function createTemplate(template: InsertTemplate): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(templates).values(template);
  
  const insertId = (result as any)[0]?.insertId;
  if (!insertId) {
    console.warn("[Database] Insert succeeded but no insertId returned, using LAST_INSERT_ID()");
    const [rows] = await db.execute(sql`SELECT LAST_INSERT_ID() as id`);
    return (rows as any)[0]?.id || 0;
  }
  return insertId;
}

export async function getTemplatesByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db.select().from(templates).where(eq(templates.userId, userId)).orderBy(desc(templates.createdAt));
}

export async function getTemplateById(id: number) {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select().from(templates).where(eq(templates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateTemplate(id: number, data: Partial<InsertTemplate>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(templates).set(data).where(eq(templates.id, id));
}

export async function deleteTemplate(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(templates).where(eq(templates.id, id));
}

// ===== FONTE JURIDICA HELPERS =====

export async function createFonteJuridica(fonte: InsertFonteJuridica): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(fontesJuridicas).values(fonte);
  
  const insertId = (result as any)[0]?.insertId;
  if (!insertId) {
    console.warn("[Database] Insert succeeded but no insertId returned, using LAST_INSERT_ID()");
    const [rows] = await db.execute(sql`SELECT LAST_INSERT_ID() as id`);
    return (rows as any)[0]?.id || 0;
  }
  return insertId;
}

export async function getFontesJuridicasByAnaliseId(analiseId: number) {
  // Nota: A tabela fontes_juridicas não tem campo analiseId no schema atual
  // Retornando array vazio por enquanto
  console.warn('[Database] getFontesJuridicasByAnaliseId: campo analiseId não existe na tabela');
  return [];
}

// ===== HISTORICO HELPERS =====

export async function createHistorico(hist: InsertHistorico): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(historico).values(hist);
  
  const insertId = (result as any)[0]?.insertId;
  if (!insertId) {
    console.warn("[Database] Insert succeeded but no insertId returned, using LAST_INSERT_ID()");
    const [rows] = await db.execute(sql`SELECT LAST_INSERT_ID() as id`);
    return (rows as any)[0]?.id || 0;
  }
  return insertId;
}

export async function getHistoricoByUserId(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db.select().from(historico).where(eq(historico.userId, userId)).orderBy(desc(historico.createdAt)).limit(limit);
}

export async function getHistoricoById(id: number) {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select().from(historico).where(eq(historico.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateHistorico(id: number, data: Partial<InsertHistorico>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(historico).set(data).where(eq(historico.id, id));
}

export async function deleteHistorico(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(historico).where(eq(historico.id, id));
}

// ===== CONFIGURACAO HELPERS =====

export async function getConfiguracao(userId: number) {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select().from(configuracoes).where(eq(configuracoes.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertConfiguracao(config: InsertConfiguracao) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.insert(configuracoes).values(config).onDuplicateKeyUpdate({
    set: {
      preferencias: config.preferencias,
      updatedAt: new Date(),
    },
  });
}

// ===== TAG HELPERS =====

export async function criarTag(tag: InsertTag): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(tags).values(tag);
  
  const insertId = (result as any)[0]?.insertId;
  if (!insertId) {
    console.warn("[Database] Insert succeeded but no insertId returned, using LAST_INSERT_ID()");
    const [rows] = await db.execute(sql`SELECT LAST_INSERT_ID() as id`);
    return (rows as any)[0]?.id || 0;
  }
  return insertId;
}

export async function getTagsByUserId(userId: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db.select().from(tags).where(eq(tags.userId, userId)).orderBy(tags.nome);
}

export async function getTagById(id: number) {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateTag(id: number, data: Partial<InsertTag>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(tags).set(data).where(eq(tags.id, id));
}

export async function deleteTag(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Remove associations first
  await db.delete(templateTags).where(eq(templateTags.tagId, id));
  await db.delete(promptTags).where(eq(promptTags.tagId, id));
  // Then delete the tag
  await db.delete(tags).where(eq(tags.id, id));
}

// ===== TEMPLATE TAG HELPERS =====

export async function adicionarTagTemplate(templateTag: InsertTemplateTag): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(templateTags).values(templateTag);
  
  const insertId = (result as any)[0]?.insertId;
  if (!insertId) {
    console.warn("[Database] Insert succeeded but no insertId returned, using LAST_INSERT_ID()");
    const [rows] = await db.execute(sql`SELECT LAST_INSERT_ID() as id`);
    return (rows as any)[0]?.id || 0;
  }
  return insertId;
}

export async function removerTagTemplate(templateId: number, tagId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(templateTags).where(
    and(
      eq(templateTags.templateId, templateId),
      eq(templateTags.tagId, tagId)
    )
  );
}

export async function getTagsDoTemplate(templateId: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const result = await db
    .select({
      id: tags.id,
      nome: tags.nome,
      cor: tags.cor,
    })
    .from(templateTags)
    .innerJoin(tags, eq(templateTags.tagId, tags.id))
    .where(eq(templateTags.templateId, templateId));

  return result;
}

// ===== PROMPT TAG HELPERS =====

export async function adicionarTagPrompt(promptTag: InsertPromptTag): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(promptTags).values(promptTag);
  
  const insertId = (result as any)[0]?.insertId;
  if (!insertId) {
    console.warn("[Database] Insert succeeded but no insertId returned, using LAST_INSERT_ID()");
    const [rows] = await db.execute(sql`SELECT LAST_INSERT_ID() as id`);
    return (rows as any)[0]?.id || 0;
  }
  return insertId;
}

export async function removerTagPrompt(promptId: number, tagId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(promptTags).where(
    and(
      eq(promptTags.promptId, promptId),
      eq(promptTags.tagId, tagId)
    )
  );
}

export async function getTagsDoPrompt(promptId: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const result = await db
    .select({
      id: tags.id,
      nome: tags.nome,
      cor: tags.cor,
    })
    .from(promptTags)
    .innerJoin(tags, eq(promptTags.tagId, tags.id))
    .where(eq(promptTags.promptId, promptId));

  return result;
}

// ===== PROMPT VERSAO HELPERS =====

export async function salvarVersaoPrompt(versao: InsertPromptVersao): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(promptVersoes).values(versao);
  
  const insertId = (result as any)[0]?.insertId;
  if (!insertId) {
    console.warn("[Database] Insert succeeded but no insertId returned, using LAST_INSERT_ID()");
    const [rows] = await db.execute(sql`SELECT LAST_INSERT_ID() as id`);
    return (rows as any)[0]?.id || 0;
  }
  return insertId;
}

export async function getVersoesPrompt(promptId: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db.select().from(promptVersoes).where(eq(promptVersoes.promptId, promptId)).orderBy(desc(promptVersoes.versao));
}

export async function getVersaoPrompt(promptId: number, versao: number) {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select().from(promptVersoes).where(
    and(
      eq(promptVersoes.promptId, promptId),
      eq(promptVersoes.versao, versao)
    )
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== USO MODELO HELPERS =====

export async function registrarUsoModelo(usoOrUserId: InsertUsoModelo | number, modeloId?: string): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Suporta ambos os formatos: objeto ou userId + modeloId
  let uso: InsertUsoModelo;
  if (typeof usoOrUserId === 'number' && modeloId) {
    uso = { userId: usoOrUserId, modeloId };
  } else {
    uso = usoOrUserId as InsertUsoModelo;
  }

  const result = await db.insert(usoModelos).values(uso);
  
  const insertId = (result as any)[0]?.insertId;
  if (!insertId) {
    console.warn("[Database] Insert succeeded but no insertId returned, using LAST_INSERT_ID()");
    const [rows] = await db.execute(sql`SELECT LAST_INSERT_ID() as id`);
    return (rows as any)[0]?.id || 0;
  }
  return insertId;
}

export async function getModelosMaisUsados(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const result = await db
    .select({
      modeloId: usoModelos.modeloId,
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(usoModelos)
    .where(eq(usoModelos.userId, userId))
    .groupBy(usoModelos.modeloId)
    .orderBy(desc(sql`count`))
    .limit(limit);

  return result;
}

// ===== STATS HELPERS =====

export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) {
    return {
      totalPrompts: 0,
      totalAnalises: 0,
      totalGeracoes: 0,
      totalOtimizacoes: 0,
      totalTemplates: 0,
      totalFavoritos: 0,
      areasMaisUsadas: [] as { area: string; count: number }[],
    };
  }

  const [promptCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(prompts).where(eq(prompts.userId, userId));
  const [templateCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(templates).where(eq(templates.userId, userId));
  
  const [analiseCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(historico).where(
    and(eq(historico.userId, userId), eq(historico.acao, 'analise'))
  );
  const [geracaoCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(historico).where(
    and(eq(historico.userId, userId), eq(historico.acao, 'geracao'))
  );
  const [otimizacaoCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(historico).where(
    and(eq(historico.userId, userId), eq(historico.acao, 'otimizacao'))
  );

  // Contar favoritos (da tabela prompts)
  const [favoritoCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(prompts).where(
    and(eq(prompts.userId, userId), eq(prompts.isFavorito, true))
  );

  // Áreas mais usadas
  // Áreas mais usadas vem da tabela prompts
  const areasMaisUsadas = await db
    .select({
      area: prompts.areaJuridica,
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(prompts)
    .where(and(eq(prompts.userId, userId), sql`${prompts.areaJuridica} IS NOT NULL`))
    .groupBy(prompts.areaJuridica)
    .orderBy(desc(sql`count`))
    .limit(5);

  return {
    totalPrompts: promptCount?.count || 0,
    totalAnalises: analiseCount?.count || 0,
    totalGeracoes: geracaoCount?.count || 0,
    totalOtimizacoes: otimizacaoCount?.count || 0,
    totalTemplates: templateCount?.count || 0,
    totalFavoritos: favoritoCount?.count || 0,
    areasMaisUsadas: areasMaisUsadas.map(a => ({ area: a.area || 'Não especificada', count: a.count })),
  };
}

// ===== FAVORITOS HELPERS =====

export async function toggleFavorito(id: number, valor?: boolean | number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Se valor for boolean, usar diretamente; se for number (userId), fazer toggle
  if (typeof valor === 'boolean') {
    await db.update(prompts).set({ isFavorito: valor }).where(eq(prompts.id, id));
    return valor;
  }

  // Comportamento original de toggle
  const item = await getPromptById(id);
  if (!item) {
    throw new Error("Item not found");
  }

  const newValue = !item.isFavorito;
  await db.update(prompts).set({ isFavorito: newValue }).where(eq(prompts.id, id));
  return newValue;
}

export async function getFavoritos(userId: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db.select().from(prompts).where(
    and(eq(prompts.userId, userId), eq(prompts.isFavorito, true))
  ).orderBy(desc(prompts.createdAt));
}

// ===== EXCLUIR PROMPT =====

export async function excluirPrompt(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const item = await getHistoricoById(id);
  if (!item || item.userId !== userId) {
    throw new Error("Item not found or access denied");
  }

  await db.delete(historico).where(eq(historico.id, id));
}

// ===== BUSCA AVANÇADA =====

export async function buscaAvancada(
  userId: number,
  filtros: {
    termo?: string;
    tipo?: 'analise' | 'geracao' | 'otimizacao';
    areaJuridica?: string;
    dataInicio?: Date;
    dataFim?: Date;
    qualidade?: 'excelente' | 'bom' | 'ruim';
    tagIds?: number[];
    ordenacao?: 'recente' | 'antigo' | 'qualidade';
    limite?: number;
    offset?: number;
  }
) {
  const db = await getDb();
  if (!db) {
    return { items: [], total: 0 };
  }

  const conditions = [eq(historico.userId, userId)];

  if (filtros.tipo) {
    conditions.push(eq(historico.acao, filtros.tipo));
  }

  if (filtros.dataInicio) {
    conditions.push(gte(historico.createdAt, filtros.dataInicio));
  }

  if (filtros.dataFim) {
    conditions.push(lte(historico.createdAt, filtros.dataFim));
  }

  const whereClause = and(...conditions);

  // Get total count
  const [countResult] = await db.select({ count: sql<number>`COUNT(*)` }).from(historico).where(whereClause);
  const total = countResult?.count || 0;

  // Get items with ordering
  let query = db.select().from(historico).where(whereClause);

  if (filtros.ordenacao === 'antigo') {
    query = query.orderBy(historico.createdAt) as any;
  } else {
    query = query.orderBy(desc(historico.createdAt)) as any;
  }

  const limite = filtros.limite || 50;
  const offset = filtros.offset || 0;
  const items = await query.limit(limite).offset(offset);

  return { items, total };
}

// ===== TEMPLATES PUBLICOS =====

export async function getTemplatePublico(id: number) {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select().from(templates).where(
    and(eq(templates.id, id), eq(templates.isPublico, true))
  ).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTemplatesPublicos(limit: number = 20) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return db.select().from(templates).where(eq(templates.isPublico, true)).orderBy(desc(templates.createdAt)).limit(limit);
}


// ===== USER USAGE HELPERS =====

export async function incrementUserUsage(userId: number): Promise<void> {
  // Esta função é um placeholder para rastreamento de uso
  // Pode ser expandida para implementar limites de uso por plano
  console.log(`[Usage] User ${userId} performed an action`);
}

export async function getUsageByDateRange(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const result = await db
    .select({
      date: sql<string>`DATE(${historico.createdAt})`.as('date'),
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(historico)
    .where(
      and(
        eq(historico.userId, userId),
        gte(historico.createdAt, startDate),
        lte(historico.createdAt, endDate)
      )
    )
    .groupBy(sql`DATE(${historico.createdAt})`)
    .orderBy(sql`DATE(${historico.createdAt})`);

  return result;
}

export async function getUserConfiguracao(userId: number) {
  return getConfiguracao(userId);
}


// Alias para compatibilidade
export async function getTagsTemplate(templateId: number) {
  return getTagsDoTemplate(templateId);
}

// ===== ANALYTICS HELPERS =====

export async function getAnalytics(userId: number) {
  const db = await getDb();
  if (!db) {
    return {
      totalAnalises: 0,
      totalGeracoes: 0,
      totalOtimizacoes: 0,
      tempoMedioAnalise: 0,
      tempoMedioGeracao: 0,
      tempoMedioOtimizacao: 0,
    };
  }

  const [analiseCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(historico).where(
    and(eq(historico.userId, userId), eq(historico.acao, 'analise'))
  );
  const [geracaoCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(historico).where(
    and(eq(historico.userId, userId), eq(historico.acao, 'geracao'))
  );
  const [otimizacaoCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(historico).where(
    and(eq(historico.userId, userId), eq(historico.acao, 'otimizacao'))
  );

  return {
    totalAnalises: analiseCount?.count || 0,
    totalGeracoes: geracaoCount?.count || 0,
    totalOtimizacoes: otimizacaoCount?.count || 0,
    tempoMedioAnalise: 2500, // placeholder em ms
    tempoMedioGeracao: 5000,
    tempoMedioOtimizacao: 3500,
  };
}


// Mais aliases para compatibilidade
export async function getTagsPrompt(promptId: number) {
  return getTagsDoPrompt(promptId);
}

export async function atribuirTagTemplate(templateId: number, tagId: number) {
  return adicionarTagTemplate({ templateId, tagId });
}

export async function atribuirTagPrompt(promptId: number, tagId: number) {
  return adicionarTagPrompt({ promptId, tagId });
}


// Mais aliases
export async function getTagsUsuario(userId: number) {
  return getTagsByUserId(userId);
}

export async function deletarTag(tagId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    return false;
  }

  // Verificar se a tag pertence ao usuário
  const tag = await getTagById(tagId);
  if (!tag || tag.userId !== userId) {
    return false;
  }

  await deleteTag(tagId);
  return true;
}


// Funções adicionais para compatibilidade

export async function toggleTemplatePublico(templateId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const template = await getTemplateById(templateId);
  if (!template || template.userId !== userId) {
    throw new Error("Template não encontrado ou sem permissão");
  }

  const newValue = !template.isPublico;
  await db.update(templates).set({ isPublico: newValue }).where(eq(templates.id, templateId));
  return newValue;
}

export async function deletarTemplate(templateId: number, userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    return false;
  }

  const template = await getTemplateById(templateId);
  if (!template || template.userId !== userId) {
    return false;
  }

  await deleteTemplate(templateId);
  return true;
}

// Alias para compatibilidade
export async function getUsageByDate(userId: number, days: number = 7) {
  return getUsageByDateDays(userId, days);
}

export async function getUsageByDateDays(userId: number, days: number = 7) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const db = await getDb();
  if (!db) {
    return [];
  }

  const result = await db
    .select({
      date: sql<string>`DATE(${historico.createdAt})`.as('date'),
      count: sql<number>`COUNT(*)`.as('count'),
    })
    .from(historico)
    .where(
      and(
        eq(historico.userId, userId),
        gte(historico.createdAt, startDate),
        lte(historico.createdAt, endDate)
      )
    )
    .groupBy(sql`DATE(${historico.createdAt})`)
    .orderBy(sql`DATE(${historico.createdAt})`);

  return result;
}

// Nota: registrarUsoModelo foi modificada para aceitar ambos os formatos


// Funções de template com validação de usuário

export async function salvarTemplate(template: InsertTemplate): Promise<number> {
  return createTemplate(template);
}

export async function atualizarTemplate(templateId: number, userId: number, data: Partial<InsertTemplate>): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    return false;
  }

  const template = await getTemplateById(templateId);
  if (!template || template.userId !== userId) {
    return false;
  }

  await updateTemplate(templateId, data);
  return true;
}


export async function getTemplatesUsuario(userId: number) {
  return getTemplatesByUserId(userId);
}

export async function getTemplatesSistema() {
  return getTemplatesPublicos(50);
}


export async function getUserHistorico(userId: number, limit: number = 50) {
  return getHistoricoByUserId(userId, limit);
}

export async function getUserPrompts(userId: number, limit?: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  let query = db.select().from(prompts).where(eq(prompts.userId, userId)).orderBy(desc(prompts.createdAt));
  if (limit) {
    return query.limit(limit);
  }
  return query;
}
