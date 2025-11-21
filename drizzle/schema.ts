import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";
import { AREAS_JURIDICAS } from "../shared/juridico";

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

export type PromptVersion = typeof promptVersoes.$inferSelect;
export type InsertPromptVersion = typeof promptVersoes.$inferInsert;

/**
 * Tabela de prompts compartilhados publicamente
 */
export const sharedPrompts = mysqlTable("shared_prompts", {
  id: int("id").autoincrement().primaryKey(),
  promptId: int("promptId").notNull(),
  userId: int("userId").notNull(), // Dono do prompt
  shareId: varchar("shareId", { length: 32 }).notNull().unique(), // ID único para o link público
  titulo: varchar("titulo", { length: 255 }).notNull(),
  descricao: text("descricao"),
  conteudo: text("conteudo").notNull(),
  areaJuridica: varchar("areaJuridica", { length: 64 }).notNull(), // Usar varchar em vez de enum para evitar problemas de tipo
  visualizacoes: int("visualizacoes").default(0).notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // Opcional: data de expiração
});

export type SharedPrompt = typeof sharedPrompts.$inferSelect;
export type InsertSharedPrompt = typeof sharedPrompts.$inferInsert;

/**
 * Tabela de petições pessoais do usuário para aprendizado de estilo
 */
export const userPetitions = mysqlTable("user_petitions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  tipoDocumento: varchar("tipoDocumento", { length: 100 }).notNull(), // petição, parecer, contrato, etc.
  areaJuridica: varchar("areaJuridica", { length: 100 }),
  fileUrl: text("fileUrl").notNull(), // URL do arquivo no S3
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // Chave S3 para deleção
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileSize: int("fileSize").notNull(), // Tamanho em bytes
  mimeType: varchar("mimeType", { length: 100 }).notNull(), // application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document
  textoExtraido: text("textoExtraido"), // Texto extraído do PDF/DOCX
  analisado: boolean("analisado").default(false), // Se já foi analisado para perfil de estilo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPetition = typeof userPetitions.$inferSelect;
export type InsertUserPetition = typeof userPetitions.$inferInsert;

/**
 * Tabela de perfil de estilo de escrita do usuário
 */
export const userStyleProfiles = mysqlTable("user_style_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // Um perfil por usuário
  
  // Características de estrutura
  estruturaArgumentativa: text("estruturaArgumentativa"), // Como organiza fatos → direito → pedidos
  padraoOrganizacao: text("padraoOrganizacao"), // Uso de tópicos, numeração, parágrafos longos, etc.
  
  // Características de estilo
  tomEscrita: varchar("tomEscrita", { length: 100 }), // formal clássico, persuasivo moderno, técnico objetivo
  nivelFormalidade: varchar("nivelFormalidade", { length: 50 }), // alto, médio, moderado
  
  // Características de fundamentação
  tipoFundamentacao: varchar("tipoFundamentacao", { length: 100 }), // jurisprudencial, doutrinária, legalista, mista
  preferenciaCitacoes: text("preferenciaCitacoes"), // Como cita (ementas completas, trechos, apenas referência)
  
  // Vocabulário e expressões
  expressõesRecorrentes: json("expressõesRecorrentes"), // Array de strings com expressões favoritas
  vocabularioPreferido: json("vocabularioPreferido"), // Objeto com substituições preferidas
  
  // Padrões de pedidos
  estiloPedidos: text("estiloPedidos"), // Como formula pedidos (numerados, específicos, valores exatos, etc.)
  
  // Exemplos extraídos
  trechosExemplo: json("trechosExemplo"), // Array de objetos {tipo, trecho, fonte}
  
  // Metadados da análise
  peticoesAnalisadas: int("peticoesAnalisadas").default(0), // Quantas petições foram usadas
  ultimaAnalise: timestamp("ultimaAnalise"),
  confiancaPerfil: int("confiancaPerfil").default(0), // 0-100, aumenta com mais petições
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserStyleProfile = typeof userStyleProfiles.$inferSelect;
export type InsertUserStyleProfile = typeof userStyleProfiles.$inferInsert;

/**
 * Tabela de rastreamento de uso de modelos profissionais
 */
export const usoModelos = mysqlTable("uso_modelos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  modeloId: varchar("modeloId", { length: 50 }).notNull(), // ID do modelo (pet-001, par-001, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UsoModelo = typeof usoModelos.$inferSelect;
export type InsertUsoModelo = typeof usoModelos.$inferInsert;
