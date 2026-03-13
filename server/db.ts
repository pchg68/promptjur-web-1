import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { logger } from './_core/logger';
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
  usoModelos, InsertUsoModelo,
  cabecalhoTemplates, InsertCabecalhoTemplate,
  formatacaoTemplates, InsertFormatacaoTemplate,
  tutorialProgresso, InsertTutorialProgresso,
  tutorialFeedback, InsertTutorialFeedback
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
      logger.warn('[Database] Failed to connect', { error });
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
    logger.warn('[Database] Cannot upsert user: database not available');
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
    logger.error('[Database] Failed to upsert user', { error });
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
    logger.warn('[Database] Cannot get user: database not available');
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
    
  // Serializar campos Date para ISO strings
  return result.map(tag => ({
    ...tag,
    createdAt: tag.createdAt.toISOString()
  }));
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
  
  // Converter para array (garantir que date seja string, não Date)
  return Object.entries(groupedByDate).map(([dateStr, counts]) => {
    const [year, month, day] = dateStr.split('-');
    return {
      date: `${day}/${month}`, // Formato dd/mm como string
      ...counts
    };
  });
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
    const result = await db.insert(cabecalhoTemplates).values({
      userId,
      ...data
    });
    
    // Retornar com campos Date serializados
    return {
      id: result[0].insertId,
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

// ==================== TEMPLATES DE FORMATAÇÃO ====================

/**
 * Criar novo template de formatação
 */
export async function criarFormatacaoTemplate(data: {
  userId: number;
  nome: string;
  fonte?: string;
  tamanhoFonte?: number;
  espacamento?: string;
  margemSuperior?: number;
  margemInferior?: number;
  margemEsquerda?: number;
  margemDireita?: number;
  incluirCabecalho?: boolean;
  incluirDataHora?: boolean;
  isPadrao?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Se isPadrao=true, remover isPadrao de outros templates do usuário
  if (data.isPadrao) {
    await db
      .update(formatacaoTemplates)
      .set({ isPadrao: false })
      .where(eq(formatacaoTemplates.userId, data.userId));
  }

  const [template] = await db
    .insert(formatacaoTemplates)
    .values(data)
    .$returningId();

  return template;
}

/**
 * Listar templates de formatação do usuário
 */
export async function listarFormatacaoTemplates(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(formatacaoTemplates)
    .where(eq(formatacaoTemplates.userId, userId))
    .orderBy(desc(formatacaoTemplates.isPadrao), desc(formatacaoTemplates.createdAt));
}

/**
 * Buscar template de formatação por ID
 */
export async function buscarFormatacaoTemplate(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(formatacaoTemplates)
    .where(and(
      eq(formatacaoTemplates.id, id),
      eq(formatacaoTemplates.userId, userId)
    ))
    .limit(1);

  return result[0];
}

/**
 * Buscar template padrão do usuário
 */
export async function buscarFormatacaoTemplatePadrao(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(formatacaoTemplates)
    .where(and(
      eq(formatacaoTemplates.userId, userId),
      eq(formatacaoTemplates.isPadrao, true)
    ))
    .limit(1);

  return result[0];
}

/**
 * Atualizar template de formatação
 */
export async function atualizarFormatacaoTemplate(
  id: number,
  userId: number,
  data: Partial<{
    nome: string;
    fonte: string;
    tamanhoFonte: number;
    espacamento: string;
    margemSuperior: number;
    margemInferior: number;
    margemEsquerda: number;
    margemDireita: number;
    incluirCabecalho: boolean;
    incluirDataHora: boolean;
    isPadrao: boolean;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Se isPadrao=true, remover isPadrao de outros templates do usuário
  if (data.isPadrao) {
    await db
      .update(formatacaoTemplates)
      .set({ isPadrao: false })
      .where(eq(formatacaoTemplates.userId, userId));
  }

  await db
    .update(formatacaoTemplates)
    .set(data)
    .where(and(
      eq(formatacaoTemplates.id, id),
      eq(formatacaoTemplates.userId, userId)
    ));

  return { success: true };
}

/**
 * Deletar template de formatação
 */
export async function deletarFormatacaoTemplate(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(formatacaoTemplates)
    .where(and(
      eq(formatacaoTemplates.id, id),
      eq(formatacaoTemplates.userId, userId)
    ));

  return { success: true };
}

/**
 * Definir template como padrão
 */
export async function definirFormatacaoTemplatePadrao(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Remover isPadrao de todos os templates do usuário
  await db
    .update(formatacaoTemplates)
    .set({ isPadrao: false })
    .where(eq(formatacaoTemplates.userId, userId));

  // Definir o template especificado como padrão
  await db
    .update(formatacaoTemplates)
    .set({ isPadrao: true })
    .where(and(
      eq(formatacaoTemplates.id, id),
      eq(formatacaoTemplates.userId, userId)
    ));

  return { success: true };
}


// ===== Tutorial Progresso =====

export async function marcarTutorialConcluido(userId: number, tutorialId: string) {
  const db = await getDb();
  if (!db) return null;

  // Verificar se já existe registro
  const existente = await db
    .select()
    .from(tutorialProgresso)
    .where(
      and(
        eq(tutorialProgresso.userId, userId),
        eq(tutorialProgresso.tutorialId, tutorialId)
      )
    )
    .limit(1);

  if (existente.length > 0) {
    // Já marcado como concluído
    return existente[0];
  }

  // Criar novo registro
  await db.insert(tutorialProgresso).values({
    userId,
    tutorialId,
    concluido: true,
  });

  return { userId, tutorialId, concluido: true };
}

export async function obterProgressoTutoriais(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const progresso = await db
    .select()
    .from(tutorialProgresso)
    .where(eq(tutorialProgresso.userId, userId));

  return progresso;
}

export async function verificarTutorialConcluido(userId: number, tutorialId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const resultado = await db
    .select()
    .from(tutorialProgresso)
    .where(
      and(
        eq(tutorialProgresso.userId, userId),
        eq(tutorialProgresso.tutorialId, tutorialId),
        eq(tutorialProgresso.concluido, true)
      )
    )
    .limit(1);

  return resultado.length > 0;
}


// ============= Tutorial Feedback =============

export async function registrarFeedbackTutorial(userId: number, tutorialId: string, util: boolean) {
  const db = await getDb();
  if (!db) return;
  
  // Verificar se já existe feedback deste usuário para este tutorial
  const existente = await db.select()
    .from(tutorialFeedback)
    .where(and(
      eq(tutorialFeedback.userId, userId),
      eq(tutorialFeedback.tutorialId, tutorialId)
    ))
    .limit(1);
  
  if (existente.length > 0) {
    // Atualizar feedback existente
    await db.update(tutorialFeedback)
      .set({ util, atualizadoEm: new Date() })
      .where(eq(tutorialFeedback.id, existente[0].id));
  } else {
    // Criar novo feedback
    await db.insert(tutorialFeedback).values({
      userId,
      tutorialId,
      util,
    });
  }
}

export async function obterFeedbackUsuario(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(tutorialFeedback)
    .where(eq(tutorialFeedback.userId, userId));
}

export async function obterEstatisticasFeedback() {
  const db = await getDb();
  if (!db) return [];
  
  // Retorna contagem de útil/não útil por tutorial
  const result = await db.select({
    tutorialId: tutorialFeedback.tutorialId,
    totalUtil: sql<number>`SUM(CASE WHEN ${tutorialFeedback.util} = true THEN 1 ELSE 0 END)`,
    totalNaoUtil: sql<number>`SUM(CASE WHEN ${tutorialFeedback.util} = false THEN 1 ELSE 0 END)`,
    total: sql<number>`COUNT(*)`,
  })
    .from(tutorialFeedback)
    .groupBy(tutorialFeedback.tutorialId);
  
  return result;
}


// ===== PAINEL DE CONTROLE - HISTÓRICO UNIFICADO =====

/**
 * Retorna estatísticas completas do histórico do usuário para o painel de controle.
 * Inclui totais por ação, por área jurídica, por modelo, taxa de sucesso e tempo médio.
 */
export async function getHistoricoStats(userId: number) {
  const db = await getDb();
  const emptyResult = {
    totalAcoes: 0,
    porAcao: {} as Record<string, number>,
    porArea: {} as Record<string, number>,
    porModelo: {} as Record<string, number>,
    taxaSucesso: 0,
    tempoMedio: 0,
    totalPrompts: 0,
    totalFavoritos: 0,
    ultimaAtividade: null as string | null,
  };
  if (!db) return emptyResult;

  try {
    // Usar SQL agregado em vez de carregar todos os registros
    const [statsRow] = await db.select({
      totalAcoes: sql<number>`COUNT(*)`,
      totalSucesso: sql<number>`SUM(CASE WHEN ${historico.sucesso} = 1 THEN 1 ELSE 0 END)`,
      tempoMedio: sql<number>`COALESCE(AVG(${historico.duracaoMs}), 0)`,
      ultimaAtividade: sql<string>`MAX(${historico.createdAt})`,
    }).from(historico).where(eq(historico.userId, userId));

    const totalAcoes = Number(statsRow?.totalAcoes) || 0;
    const totalSucesso = Number(statsRow?.totalSucesso) || 0;
    const tempoMedio = Math.round(Number(statsRow?.tempoMedio) || 0);
    const ultimaAtividade = statsRow?.ultimaAtividade
      ? new Date(statsRow.ultimaAtividade).toISOString()
      : null;

    // Contagem por ação (SQL GROUP BY)
    const acaoRows = await db.select({
      acao: historico.acao,
      count: sql<number>`COUNT(*)`,
    }).from(historico).where(eq(historico.userId, userId)).groupBy(historico.acao);

    const porAcao: Record<string, number> = {};
    acaoRows.forEach(r => { porAcao[r.acao] = Number(r.count); });

    // Contagem de prompts e favoritos (SQL agregado)
    const [promptsRow] = await db.select({
      total: sql<number>`COUNT(*)`,
      favoritos: sql<number>`SUM(CASE WHEN ${prompts.isFavorito} = 1 THEN 1 ELSE 0 END)`,
    }).from(prompts).where(eq(prompts.userId, userId));

    const totalPrompts = Number(promptsRow?.total) || 0;
    const totalFavoritos = Number(promptsRow?.favoritos) || 0;

    // Por área jurídica (SQL GROUP BY)
    const areaRows = await db.select({
      area: prompts.areaJuridica,
      count: sql<number>`COUNT(*)`,
    }).from(prompts)
      .where(and(eq(prompts.userId, userId), sql`${prompts.areaJuridica} IS NOT NULL`))
      .groupBy(prompts.areaJuridica);

    const porArea: Record<string, number> = {};
    areaRows.forEach(r => { if (r.area) porArea[r.area] = Number(r.count); });

    // Por modelo - manter leitura leve (últimos 200 registros com detalhes)
    const porModelo: Record<string, number> = {};
    const recentWithDetails = await db.select({
      detalhes: historico.detalhes,
    }).from(historico)
      .where(and(eq(historico.userId, userId), sql`${historico.detalhes} IS NOT NULL`))
      .orderBy(desc(historico.createdAt))
      .limit(200);

    recentWithDetails.forEach(h => {
      if (h.detalhes && typeof h.detalhes === 'object') {
        const det = h.detalhes as any;
        const modelo = det.modelo || det.model || det.modeloId;
        if (modelo) {
          porModelo[modelo] = (porModelo[modelo] || 0) + 1;
        }
      }
    });

    return {
      totalAcoes,
      porAcao,
      porArea,
      porModelo,
      taxaSucesso: totalAcoes > 0 ? Math.round((totalSucesso / totalAcoes) * 100) : 0,
      tempoMedio,
      totalPrompts,
      totalFavoritos,
      ultimaAtividade,
    };
  } catch (error) {
    console.error('[getHistoricoStats] Error:', error);
    return emptyResult;
  }
}

/**
 * Retorna histórico unificado (historico + prompts) com filtros avançados e paginação.
 */
export async function getHistoricoUnificado(userId: number, filtros: {
  acao?: string;
  area?: string;
  modelo?: string;
  texto?: string;
  dataInicio?: Date;
  dataFim?: Date;
  sucesso?: boolean;
  limite?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const limite = filtros.limite || 20;
  const offset = filtros.offset || 0;

  // Buscar histórico com filtros
  const conditions: any[] = [eq(historico.userId, userId)];

  if (filtros.acao) {
    conditions.push(eq(historico.acao, filtros.acao as any));
  }

  if (filtros.sucesso !== undefined) {
    conditions.push(eq(historico.sucesso, filtros.sucesso));
  }

  if (filtros.dataInicio) {
    conditions.push(sql`${historico.createdAt} >= ${filtros.dataInicio}`);
  }

  if (filtros.dataFim) {
    conditions.push(sql`${historico.createdAt} <= ${filtros.dataFim}`);
  }

  // Contar total
  const countResult = await db.select({ count: sql<number>`COUNT(*)` })
    .from(historico)
    .where(and(...conditions));
  const total = countResult[0]?.count || 0;

  // Buscar itens paginados
  const items = await db.select().from(historico)
    .where(and(...conditions))
    .orderBy(desc(historico.createdAt))
    .limit(limite)
    .offset(offset);

  // Batch: coletar todos os promptIds de uma vez (evita N+1)
  const promptIdSet = new Set<number>();
  items.forEach(i => { if (i.promptId) promptIdSet.add(i.promptId); });
  const promptIds = Array.from(promptIdSet);
  const promptsMap = new Map<number, any>();

  if (promptIds.length > 0) {
    const promptRows = await db.select().from(prompts)
      .where(inArray(prompts.id, promptIds));
    promptRows.forEach(p => {
      promptsMap.set(p.id, {
        id: p.id,
        tipo: p.tipo,
        areaJuridica: p.areaJuridica,
        promptOriginal: p.promptOriginal?.substring(0, 200) + (p.promptOriginal && p.promptOriginal.length > 200 ? '...' : ''),
        promptOtimizado: p.promptOtimizado?.substring(0, 200) + (p.promptOtimizado && p.promptOtimizado.length > 200 ? '...' : ''),
        qualidade: p.qualidade,
        isFavorito: p.isFavorito,
      });
    });
  }

  // Enriquecer e filtrar
  const enrichedItems = items.map(item => {
    const promptData = item.promptId ? promptsMap.get(item.promptId) || null : null;

    // Filtrar por área (se especificado)
    if (filtros.area && promptData && promptData.areaJuridica !== filtros.area) {
      return null;
    }

    // Filtrar por texto (se especificado)
    if (filtros.texto) {
      const searchTerm = filtros.texto.toLowerCase();
      const matchPrompt = promptData && (
        (promptData.promptOriginal || '').toLowerCase().includes(searchTerm) ||
        (promptData.promptOtimizado || '').toLowerCase().includes(searchTerm)
      );
      const matchDetalhes = item.detalhes && JSON.stringify(item.detalhes).toLowerCase().includes(searchTerm);
      if (!matchPrompt && !matchDetalhes) {
        return null;
      }
    }

    return {
      id: item.id,
      acao: item.acao,
      promptId: item.promptId,
      detalhes: item.detalhes,
      duracaoMs: item.duracaoMs,
      sucesso: item.sucesso,
      mensagemErro: item.mensagemErro,
      createdAt: item.createdAt.toISOString(),
      prompt: promptData,
    };
  });

  // Remover nulls (filtrados por área/texto)
  const filteredItems = enrichedItems.filter(Boolean);

  return {
    items: filteredItems,
    total: filtros.area || filtros.texto ? filteredItems.length : total,
  };
}

/**
 * Retorna detalhes completos de um item do histórico, incluindo prompt completo.
 */
export async function getHistoricoDetalhes(historicoId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const [item] = await db.select().from(historico)
    .where(and(
      eq(historico.id, historicoId),
      eq(historico.userId, userId)
    ))
    .limit(1);

  if (!item) return null;

  let promptCompleto = null;
  if (item.promptId) {
    const [p] = await db.select().from(prompts)
      .where(eq(prompts.id, item.promptId))
      .limit(1);
    if (p) {
      promptCompleto = {
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    }
  }

  // Buscar tags do prompt (se existir)
  let promptTags: any[] = [];
  if (item.promptId) {
    promptTags = await getTagsPrompt(item.promptId);
  }

  return {
    id: item.id,
    acao: item.acao,
    promptId: item.promptId,
    detalhes: item.detalhes,
    duracaoMs: item.duracaoMs,
    sucesso: item.sucesso,
    mensagemErro: item.mensagemErro,
    createdAt: item.createdAt.toISOString(),
    prompt: promptCompleto,
    tags: promptTags,
  };
}

/**
 * Exclui um item do histórico.
 */
export async function excluirHistorico(historicoId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [item] = await db.select().from(historico)
    .where(and(
      eq(historico.id, historicoId),
      eq(historico.userId, userId)
    ))
    .limit(1);

  if (!item) throw new Error("Item não encontrado");

  await db.delete(historico).where(eq(historico.id, historicoId));
  return { success: true };
}

/**
 * Retorna dados de uso por dia para gráfico de atividade.
 */
export async function getAtividadePorDia(userId: number, dias: number = 30) {
  const db = await getDb();
  if (!db) return [];

  try {
    // Calcular data de início
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dias);
    dataInicio.setHours(0, 0, 0, 0);

    // Usar SQL GROUP BY para agregar no banco
    const rows = await db.select({
      dateStr: sql<string>`DATE(createdAt)`,
      acao: historico.acao,
      count: sql<number>`COUNT(*)`,
    }).from(historico)
      .where(and(
        eq(historico.userId, userId),
        sql`${historico.createdAt} >= ${dataInicio}`
      ))
      .groupBy(sql`DATE(createdAt)`, sql`acao`);

    // Inicializar todos os dias
    const groupedByDate: Record<string, Record<string, number>> = {};
    for (let i = 0; i < dias; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (dias - 1 - i));
      const dateStr = date.toISOString().split('T')[0];
      groupedByDate[dateStr] = { analise: 0, geracao: 0, otimizacao: 0, execucao_prompt: 0, verificacao: 0, exportacao_docx: 0, exportacao_pdf: 0 };
    }

    // Preencher com dados do banco
    rows.forEach(row => {
      const dateStr = typeof row.dateStr === 'string' 
        ? row.dateStr.split('T')[0] 
        : new Date(row.dateStr).toISOString().split('T')[0];
      if (groupedByDate[dateStr]) {
        groupedByDate[dateStr][row.acao] = Number(row.count);
      }
    });

    return Object.entries(groupedByDate).map(([dateStr, counts]) => {
      const [year, month, day] = dateStr.split('-');
      return {
        date: `${day}/${month}`,
        dateISO: dateStr,
        ...counts,
        total: Object.values(counts).reduce((a, b) => a + b, 0),
      };
    });
  } catch (error) {
    console.error('[getAtividadePorDia] Error:', error);
    return [];
  }
}
