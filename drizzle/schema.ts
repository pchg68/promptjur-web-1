import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  subscriptionPlan: mysqlEnum("subscriptionPlan", ["free", "pro", "enterprise"]).default("free").notNull(),
  usageCount: int("usageCount").default(0).notNull(), // Contador de uso para plano gratuito
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de prompts salvos pelo usuário
 */
export const prompts = mysqlTable("prompts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tipo: mysqlEnum("tipo", ["analise", "geracao", "otimizacao"]).notNull(),
  areaJuridica: varchar("areaJuridica", { length: 100 }),
  promptOriginal: text("promptOriginal").notNull(),
  promptOtimizado: text("promptOtimizado"),
  qualidade: mysqlEnum("qualidade", ["excelente", "bom", "ruim"]),
  isFavorito: boolean("isFavorito").default(false),
  metadata: json("metadata"), // Para armazenar dados adicionais como palavras-chave, entidades, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Prompt = typeof prompts.$inferSelect;
export type InsertPrompt = typeof prompts.$inferInsert;

/**
 * Tabela de análises detalhadas de prompts
 */
export const analises = mysqlTable("analises", {
  id: int("id").autoincrement().primaryKey(),
  promptId: int("promptId").notNull(),
  userId: int("userId").notNull(),
  areaIdentificada: varchar("areaIdentificada", { length: 100 }),
  confiancaArea: int("confiancaArea"), // 0-100
  palavrasChave: json("palavrasChave"), // Array de strings
  entidades: json("entidades"), // Array de objetos com tipo e valor
  pontuacaoQualidade: int("pontuacaoQualidade"), // 0-100
  sugestoes: json("sugestoes"), // Array de strings com sugestões
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Analise = typeof analises.$inferSelect;
export type InsertAnalise = typeof analises.$inferInsert;

/**
 * Tabela de templates de prompts por área jurídica
 */
export const templates = mysqlTable("templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null = template do sistema, valor = template do usuário
  areaJuridica: varchar("areaJuridica", { length: 100 }).notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  template: text("template").notNull(),
  variaveis: json("variaveis"), // Array de variáveis que podem ser substituídas
  exemplos: json("exemplos"), // Array de exemplos de uso
  isAtivo: boolean("isAtivo").default(true),
  isPublico: boolean("isPublico").default(false), // Se outros usuários podem ver
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

/**
 * Tabela de fontes jurídicas verificadas
 */
export const fontesJuridicas = mysqlTable("fontes_juridicas", {
  id: int("id").autoincrement().primaryKey(),
  tipo: mysqlEnum("tipo", ["lei", "jurisprudencia", "doutrina", "artigo"]).notNull(),
  identificador: varchar("identificador", { length: 255 }).notNull(), // Ex: "Lei 10.406/2002", "STF RE 123456"
  titulo: text("titulo"),
  url: text("url"), // Link para fonte oficial
  conteudo: text("conteudo"), // Resumo ou texto completo
  tribunal: varchar("tribunal", { length: 100 }), // STF, STJ, TRF, etc.
  dataPublicacao: timestamp("dataPublicacao"),
  isVerificada: boolean("isVerificada").default(false),
  ultimaVerificacao: timestamp("ultimaVerificacao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FonteJuridica = typeof fontesJuridicas.$inferSelect;
export type InsertFonteJuridica = typeof fontesJuridicas.$inferInsert;

/**
 * Tabela de histórico de uso e métricas
 */
export const historico = mysqlTable("historico", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  acao: mysqlEnum("acao", ["analise", "geracao", "otimizacao", "verificacao"]).notNull(),
  promptId: int("promptId"),
  detalhes: json("detalhes"), // Informações adicionais sobre a ação
  duracaoMs: int("duracaoMs"), // Tempo de processamento em milissegundos
  sucesso: boolean("sucesso").default(true),
  mensagemErro: text("mensagemErro"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Historico = typeof historico.$inferSelect;
export type InsertHistorico = typeof historico.$inferInsert;

/**
 * Tabela de configurações do usuário
 */
export const configuracoes = mysqlTable("configuracoes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  areaPreferida: varchar("areaPreferida", { length: 100 }),
  nivelDetalhePreferido: int("nivelDetalhePreferido").default(5), // 1-10
  incluirReferenciasDefault: boolean("incluirReferenciasDefault").default(true),
  personaDefault: text("personaDefault"),
  preferencias: json("preferencias"), // Outras preferências do usuário
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Configuracao = typeof configuracoes.$inferSelect;
export type InsertConfiguracao = typeof configuracoes.$inferInsert;

/**
 * Tabela de tags personalizadas
 */
export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nome: varchar("nome", { length: 50 }).notNull(),
  cor: varchar("cor", { length: 7 }).default("#3b82f6"), // Hex color
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

/**
 * Tabela de relacionamento entre templates e tags
 */
export const templateTags = mysqlTable("template_tags", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  tagId: int("tagId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TemplateTag = typeof templateTags.$inferSelect;
export type InsertTemplateTag = typeof templateTags.$inferInsert;

/**
 * Tabela de relacionamento entre prompts e tags
 */
export const promptTags = mysqlTable("prompt_tags", {
  id: int("id").autoincrement().primaryKey(),
  promptId: int("promptId").notNull(),
  tagId: int("tagId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PromptTag = typeof promptTags.$inferSelect;
export type InsertPromptTag = typeof promptTags.$inferInsert;

/**
 * Tabela de versões de prompts para comparação
 */
export const promptVersoes = mysqlTable("prompt_versoes", {
  id: int("id").autoincrement().primaryKey(),
  promptId: int("promptId").notNull(),
  versao: int("versao").notNull(), // 1, 2, 3...
  conteudo: text("conteudo").notNull(),
  tipo: mysqlEnum("tipo", ["original", "otimizado", "manual"]).notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PromptVersao = typeof promptVersoes.$inferSelect;
export type InsertPromptVersao = typeof promptVersoes.$inferInsert;
