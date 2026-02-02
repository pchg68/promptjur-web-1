import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
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

/**
 * Obtém a instância do banco de dados Drizzle ORM.
 * Cria a conexão lazy (apenas quando necessário) e reutiliza a instância.
 * 
 * @returns {Promise<ReturnType<typeof drizzle> | null>} Instância do Drizzle ORM ou null se conexão falhar
 * @example
 * const db = await getDb();
 * if (!db) {
 *   console.error('Database not available');
 *   return;
 * }
 */
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

/**
 * Insere ou atualiza um usuário no banco de dados.
 * Se o usuário já existir (baseado em openId), atualiza os campos fornecidos.
 * Automaticamente promove o proprietário do projeto (ENV.ownerOpenId) para admin.
 * 
 * @param {InsertUser} user - Dados do usuário para inserir/atualizar
 * @param {string} user.openId - ID único do OAuth (obrigatório)
 * @param {string} [user.name] - Nome do usuário
 * @param {string} [user.email] - Email do usuário
 * @param {string} [user.loginMethod] - Método de login (google, github, etc)
 * @param {Date} [user.lastSignedIn] - Data do último login
 * @param {'admin' | 'user'} [user.role] - Role do usuário
 * @throws {Error} Se openId não for fornecido
 * @returns {Promise<void>}
 * @example
 * await upsertUser({
 *   openId: 'abc123',
 *   name: 'João Silva',
 *   email: 'joao@example.com',
 *   loginMethod: 'google'
 * });
 */
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

/**
 * Busca um usuário pelo openId (identificador OAuth).
 * 
 * @param {string} openId - ID único do OAuth
 * @returns {Promise<User | undefined>} Usuário encontrado ou undefined
 * @example
 * const user = await getUserByOpenId('abc123');
 * if (user) {
 *   console.log(`Usuário: ${user.name}`);
 * }
 */
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
  return Number(result[0].insertId);
}

export async function getUserPrompts(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db.select().from(prompts)
    .where(eq(prompts.userId, userId))
    .orderBy(desc(prompts.createdAt))
    .limit(limit);
  
  // Converter para formato serializável
  return results.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString()
  }));
}

export async function getPromptById(id: number, userId?: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const conditions = [eq(prompts.id, id)];
  if (userId !== undefined) {
    conditions.push(eq(prompts.userId, userId));
  }
  
  const result = await db.select().from(prompts).where(and(...conditions)).limit(1);
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

export async function excluirPrompt(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Verificar se o prompt pertence ao usuário
  const prompt = await db.select().from(prompts).where(eq(prompts.id, id)).limit(1);
  if (!prompt || prompt.length === 0) {
    throw new Error("Prompt não encontrado");
  }
  if (prompt[0].userId !== userId) {
    throw new Error("Sem permissão para excluir este prompt");
  }
  
  // Excluir prompt (cascade irá excluir relacionamentos)
  await db.delete(prompts).where(eq(prompts.id, id));
}

// ===== ANALISE HELPERS =====

export async function createAnalise(data: InsertAnalise) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(analises).values(data);
  return Number(result[0].insertId);
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
  return Number(result[0].insertId);
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
  return Number(result[0].insertId);
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
  return Number(result[0].insertId);
}

export async function getUserHistorico(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db.select().from(historico)
    .where(eq(historico.userId, userId))
    .orderBy(desc(historico.createdAt))
    .limit(limit);
  
  // Converter para formato serializável
  return results.map(h => ({
    ...h,
    createdAt: h.createdAt.toISOString()
  }));
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
  
  const result = await db.insert(templates).values(data);
  return Number(result[0].insertId);
}

export async function atualizarTemplate(id: number, userId: number, data: Partial<InsertTemplate>) {
  const db = await getDb();
  if (!db) return false;
  
  const result = await db.update(templates)
    .set(data)
    .where(and(eq(templates.id, id), eq(templates.userId, userId)));
  
  return Number(result[0].affectedRows) > 0;
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

// ===== TAG HELPERS =====

export async function getTagsUsuario(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(tags)
    .where(eq(tags.userId, userId))
    .orderBy(tags.nome);
    
  return result;
}

export async function criarTag(data: InsertTag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(tags).values(data);
  return Number(result[0].insertId);
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
  
  const result = await db.insert(templateTags).values({
    templateId,
    tagId
  });
  return Number(result[0].insertId);
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

// ===== VERSÃO HELPERS =====

export async function salvarVersaoPrompt(data: InsertPromptVersao) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(promptVersoes).values(data);
  return Number(result[0].insertId);
}

export async function getVersoesPrompt(promptId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(promptVersoes)
    .where(eq(promptVersoes.promptId, promptId))
    .orderBy(desc(promptVersoes.versao));
  
  // Converter para formato serializável
  return result.map(v => ({
    ...v,
    createdAt: v.createdAt.toISOString()
  }));
}

// ===== ANALYTICS HELPERS =====

export async function getAnalytics(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  // Obter histórico completo
  const recentHistory = await db.select().from(historico)
    .where(and(
      eq(historico.userId, userId),
      eq(historico.sucesso, true)
    ))
    .orderBy(desc(historico.createdAt));
  
  // Calcular tempo médio por tipo
  const avgTimes = {
    analise: 0,
    geracao: 0,
    otimizacao: 0
  };
  
  const counts = {
    analise: 0,
    geracao: 0,
    otimizacao: 0
  };
  
  recentHistory.forEach(item => {
    if (item.duracaoMs && item.acao !== "verificacao") {
      avgTimes[item.acao as keyof typeof avgTimes] += item.duracaoMs;
      counts[item.acao as keyof typeof counts]++;
    }
  });
  
  Object.keys(avgTimes).forEach(tipo => {
    if (counts[tipo as keyof typeof counts] > 0) {
      avgTimes[tipo as keyof typeof avgTimes] = Math.round(avgTimes[tipo as keyof typeof avgTimes] / counts[tipo as keyof typeof counts]);
    }
  });
  
  // Converter recentHistory para formato serializável (evitar erro de transformação do tRPC)
  const recentHistorySerializable = recentHistory.slice(0, 10).map(item => ({
    id: item.id,
    userId: item.userId,
    acao: item.acao,
    sucesso: item.sucesso,
    duracaoMs: item.duracaoMs,
    promptId: item.promptId,
    detalhes: item.detalhes,
    mensagemErro: item.mensagemErro,
    createdAt: item.createdAt.toISOString() // Converter Date para string
  }));
  
  return {
    totalAnalises: recentHistory.filter(h => h.acao === "analise").length,
    totalGeracoes: recentHistory.filter(h => h.acao === "geracao").length,
    totalOtimizacoes: recentHistory.filter(h => h.acao === "otimizacao").length,
    avgTimes,
    recentHistory: recentHistorySerializable
  };
}

// ===== USAGE LIMIT HELPERS =====

export async function incrementUserUsage(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Buscar usuário atual
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("User not found");
  
  // Incrementar contador
  await db.update(users)
    .set({ usageCount: user.usageCount + 1 })
    .where(eq(users.id, userId));
}

export async function resetUserUsage(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users)
    .set({ usageCount: 0 })
    .where(eq(users.id, userId));
}

export async function getUsageByDate(userId: number, days: number = 7) {
  const db = await getDb();
  if (!db) return [];
  
  // Calcular data inicial
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Buscar histórico dos últimos N dias
  const history = await db.select().from(historico)
    .where(and(
      eq(historico.userId, userId),
      eq(historico.sucesso, true)
    ))
    .orderBy(historico.createdAt);
  
  // Agrupar por data
  const groupedByDate: Record<string, { analises: number; geracoes: number; otimizacoes: number }> = {};
  
  // Inicializar todos os dias com zero
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const dateStr = date.toISOString().split('T')[0];
    groupedByDate[dateStr] = { analises: 0, geracoes: 0, otimizacoes: 0 };
  }
  
  // Contar operações por dia
  history.forEach(item => {
    const dateStr = new Date(item.createdAt).toISOString().split('T')[0];
    if (groupedByDate[dateStr]) {
      if (item.acao === 'analise') groupedByDate[dateStr].analises++;
      else if (item.acao === 'geracao') groupedByDate[dateStr].geracoes++;
      else if (item.acao === 'otimizacao') groupedByDate[dateStr].otimizacoes++;
    }
  });
  
  // Converter para array
  return Object.entries(groupedByDate).map(([date, counts]) => ({
    date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    ...counts
  }));
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
  
  const result = await db.insert(promptTags).values({
    promptId,
    tagId
  });
  return Number(result[0].insertId);
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
