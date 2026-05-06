import {
  mysqlTable, mysqlEnum, text, timestamp, varchar, boolean,
  json, bigint, int, uniqueIndex, index, mysqlTableCreator
} from "drizzle-orm/mysql-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  subscriptionPlan: mysqlEnum("subscriptionPlan", ["free", "pro", "enterprise"]).default("free").notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  bonusCredits: int("bonusCredits").default(0).notNull(),
  monthlyUsageResetAt: timestamp("monthlyUsageResetAt").defaultNow().notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const prompts = mysqlTable("prompts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tipo: mysqlEnum("tipo", ["analise", "geracao", "otimizacao"]).notNull(),
  areaJuridica: varchar("areaJuridica", { length: 100 }),
  promptOriginal: text("promptOriginal").notNull(),
  promptOtimizado: text("promptOtimizado"),
  qualidade: mysqlEnum("qualidade", ["excelente", "bom", "ruim"]),
  isFavorito: boolean("isFavorito").default(false),
  shareToken: varchar("shareToken", { length: 64 }).unique(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Prompt = typeof prompts.$inferSelect;
export type InsertPrompt = typeof prompts.$inferInsert;

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tipo: mysqlEnum("tipo", ["sucesso", "alerta", "erro", "info", "sistema"]).notNull(),
  titulo: varchar("titulo", { length: 200 }).notNull(),
  mensagem: text("mensagem").notNull(),
  lida: boolean("lida").default(false).notNull(),
  link: varchar("link", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  emailEnabled: boolean("emailEnabled").default(true).notNull(),
  soundEnabled: boolean("soundEnabled").default(true).notNull(),
  tiposSucesso: boolean("tiposSucesso").default(true).notNull(),
  tiposAlerta: boolean("tiposAlerta").default(true).notNull(),
  tiposErro: boolean("tiposErro").default(true).notNull(),
  tiposInfo: boolean("tiposInfo").default(true).notNull(),
  tiposSistema: boolean("tiposSistema").default(true).notNull(),
  pushEnabled: boolean("pushEnabled").default(false).notNull(),
  emailDigest: mysqlEnum("emailDigest", ["imediato", "diario", "nunca"]).default("imediato").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

export const analises = mysqlTable("analises", {
  id: int("id").autoincrement().primaryKey(),
  promptId: int("promptId").notNull(),
  userId: int("userId").notNull(),
  areaIdentificada: varchar("areaIdentificada", { length: 100 }),
  confiancaArea: int("confiancaArea"),
  palavrasChave: json("palavrasChave"),
  entidades: json("entidades"),
  pontuacaoQualidade: int("pontuacaoQualidade"),
  sugestoes: json("sugestoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Analise = typeof analises.$inferSelect;
export type InsertAnalise = typeof analises.$inferInsert;

export const templates = mysqlTable("templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  areaJuridica: varchar("areaJuridica", { length: 100 }).notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  template: text("template").notNull(),
  variaveis: json("variaveis"),
  exemplos: json("exemplos"),
  isAtivo: boolean("isAtivo").default(true),
  isPublico: boolean("isPublico").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

export const fontesJuridicas = mysqlTable("fontes_juridicas", {
  id: int("id").autoincrement().primaryKey(),
  tipo: mysqlEnum("tipo", ["lei", "jurisprudencia", "doutrina", "artigo"]).notNull(),
  identificador: varchar("identificador", { length: 255 }).notNull(),
  titulo: text("titulo"),
  url: text("url"),
  conteudo: text("conteudo"),
  tribunal: varchar("tribunal", { length: 100 }),
  dataPublicacao: timestamp("dataPublicacao"),
  isVerificada: boolean("isVerificada").default(false),
  ultimaVerificacao: timestamp("ultimaVerificacao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FonteJuridica = typeof fontesJuridicas.$inferSelect;
export type InsertFonteJuridica = typeof fontesJuridicas.$inferInsert;

export const historico = mysqlTable("historico", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  acao: mysqlEnum("acao", ["analise", "geracao", "otimizacao", "verificacao", "exportacao_docx", "exportacao_pdf", "execucao_prompt"]).notNull(),
  promptId: int("promptId"),
  detalhes: json("detalhes"),
  duracaoMs: int("duracaoMs"),
  sucesso: boolean("sucesso").default(true),
  mensagemErro: text("mensagemErro"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Historico = typeof historico.$inferSelect;
export type InsertHistorico = typeof historico.$inferInsert;

export const configuracoes = mysqlTable("configuracoes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  areaPreferida: varchar("areaPreferida", { length: 100 }),
  nivelDetalhePreferido: int("nivelDetalhePreferido").default(5),
  incluirReferenciasDefault: boolean("incluirReferenciasDefault").default(true),
  personaDefault: text("personaDefault"),
  preferencias: json("preferencias"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Configuracao = typeof configuracoes.$inferSelect;
export type InsertConfiguracao = typeof configuracoes.$inferInsert;

export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nome: varchar("nome", { length: 50 }).notNull(),
  cor: varchar("cor", { length: 7 }).default("#3b82f6"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

export const templateTags = mysqlTable("template_tags", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  tagId: int("tagId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TemplateTag = typeof templateTags.$inferSelect;
export type InsertTemplateTag = typeof templateTags.$inferInsert;

export const promptTags = mysqlTable("prompt_tags", {
  id: int("id").autoincrement().primaryKey(),
  promptId: int("promptId").notNull(),
  tagId: int("tagId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PromptTag = typeof promptTags.$inferSelect;
export type InsertPromptTag = typeof promptTags.$inferInsert;

export const promptVersoes = mysqlTable("prompt_versoes", {
  id: int("id").autoincrement().primaryKey(),
  promptId: int("promptId").notNull(),
  versao: int("versao").notNull(),
  conteudo: text("conteudo").notNull(),
  tipo: mysqlEnum("tipo", ["original", "otimizado", "manual"]).notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PromptVersao = typeof promptVersoes.$inferSelect;
export type InsertPromptVersao = typeof promptVersoes.$inferInsert;

export const usoModelos = mysqlTable("uso_modelos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  modeloId: varchar("modeloId", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UsoModelo = typeof usoModelos.$inferSelect;
export type InsertUsoModelo = typeof usoModelos.$inferInsert;

export const legislacaoCache = mysqlTable("legislacao_cache", {
  id: int("id").autoincrement().primaryKey(),
  citacao: varchar("citacao", { length: 500 }).notNull().unique(),
  tipo: mysqlEnum("tipo", ["artigo", "lei", "codigo", "decreto", "portaria"]).notNull(),
  confiabilidade: mysqlEnum("confiabilidade", ["alta", "media", "baixa"]).notNull(),
  motivo: text("motivo").notNull(),
  linkOficial: text("linkOficial"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export type LegislacaoCache = typeof legislacaoCache.$inferSelect;
export type InsertLegislacaoCache = typeof legislacaoCache.$inferInsert;

export const perfisUso = mysqlTable("perfis_uso", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nome: varchar("nome", { length: 100 }).notNull(),
  tipoDocumento: mysqlEnum("tipoDocumento", ["peticao", "parecer", "contrato", "recurso", "defesa", "memorando", "outro"]).notNull(),
  areaJuridica: varchar("areaJuridica", { length: 100 }).notNull(),
  modeloId: varchar("modeloId", { length: 50 }),
  descricao: text("descricao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PerfilUso = typeof perfisUso.$inferSelect;
export type InsertPerfilUso = typeof perfisUso.$inferInsert;

export const formatacaoTemplates = mysqlTable("formatacao_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nome: varchar("nome", { length: 100 }).notNull(),
  fonte: varchar("fonte", { length: 50 }).default("Arial").notNull(),
  tamanhoFonte: int("tamanhoFonte").default(12).notNull(),
  espacamento: varchar("espacamento", { length: 10 }).default("1.5").notNull(),
  margemSuperior: int("margemSuperior").default(3).notNull(),
  margemInferior: int("margemInferior").default(2).notNull(),
  margemEsquerda: int("margemEsquerda").default(3).notNull(),
  margemDireita: int("margemDireita").default(2).notNull(),
  incluirCabecalho: boolean("incluirCabecalho").default(true).notNull(),
  incluirDataHora: boolean("incluirDataHora").default(true).notNull(),
  isPadrao: boolean("isPadrao").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FormatacaoTemplate = typeof formatacaoTemplates.$inferSelect;
export type InsertFormatacaoTemplate = typeof formatacaoTemplates.$inferInsert;

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  acao: varchar("acao", { length: 100 }).notNull(),
  descricao: text("descricao"),
  metadata: json("metadata"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export const featureFlags = mysqlTable("feature_flags", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull().unique(),
  descricao: text("descricao"),
  isAtivo: boolean("isAtivo").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = typeof featureFlags.$inferInsert;

export const alertRules = mysqlTable("alert_rules", {
  id: int("id").autoincrement().primaryKey(),
  rota: varchar("rota", { length: 255 }),
  metrica: mysqlEnum("metrica", ["p50", "p95", "p99", "media"]).notNull(),
  threshold: int("threshold").notNull(),
  isAtivo: boolean("isAtivo").default(true).notNull(),
  cooldown: int("cooldown").default(300).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertRule = typeof alertRules.$inferInsert;

export const performanceAlerts = mysqlTable("performance_alerts", {
  id: int("id").autoincrement().primaryKey(),
  ruleId: int("ruleId").notNull(),
  rota: varchar("rota", { length: 255 }).notNull(),
  metrica: varchar("metrica", { length: 20 }).notNull(),
  valorAtual: int("valorAtual").notNull(),
  threshold: int("threshold").notNull(),
  mensagem: text("mensagem").notNull(),
  resolvido: boolean("resolvido").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerformanceAlert = typeof performanceAlerts.$inferSelect;
export type InsertPerformanceAlert = typeof performanceAlerts.$inferInsert;

export const backups = mysqlTable("backups", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  s3Key: varchar("s3Key", { length: 512 }).notNull(),
  s3Url: varchar("s3Url", { length: 1024 }).notNull(),
  size: bigint("size", { mode: "number" }).notNull(),
  isEncrypted: boolean("isEncrypted").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Backup = typeof backups.$inferSelect;
export type InsertBackup = typeof backups.$inferInsert;

export const cabecalhoTemplates = mysqlTable("cabecalho_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  nomeEscritorio: varchar("nomeEscritorio", { length: 255 }),
  oab: varchar("oab", { length: 50 }),
  endereco: text("endereco"),
  telefone: varchar("telefone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 255 }),
  habilitado: boolean("habilitado").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type CabecalhoTemplate = typeof cabecalhoTemplates.$inferSelect;
export type InsertCabecalhoTemplate = typeof cabecalhoTemplates.$inferInsert;

export const tutorialProgresso = mysqlTable("tutorial_progresso", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tutorialId: varchar("tutorialId", { length: 100 }).notNull(),
  concluido: boolean("concluido").default(true).notNull(),
  concluidoEm: timestamp("concluidoEm").defaultNow().notNull(),
});

export type TutorialProgresso = typeof tutorialProgresso.$inferSelect;
export type InsertTutorialProgresso = typeof tutorialProgresso.$inferInsert;

export const tutorialFeedback = mysqlTable("tutorial_feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tutorialId: varchar("tutorialId", { length: 100 }).notNull(),
  util: boolean("util").notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().notNull(),
});

export type TutorialFeedback = typeof tutorialFeedback.$inferSelect;
export type InsertTutorialFeedback = typeof tutorialFeedback.$inferInsert;

export const enterpriseLeads = mysqlTable("enterprise_leads", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  escritorio: varchar("escritorio", { length: 255 }).notNull(),
  numeroAdvogados: varchar("numeroAdvogados", { length: 20 }).notNull(),
  areasPrincipais: text("areasPrincipais"),
  mensagem: text("mensagem"),
  status: mysqlEnum("status", ["pendente", "contatado", "convertido", "descartado"]).default("pendente").notNull(),
  notasInternas: text("notasInternas"),
  contatadoEm: timestamp("contatadoEm"),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().notNull(),
});

export type EnterpriseLead = typeof enterpriseLeads.$inferSelect;
export type InsertEnterpriseLead = typeof enterpriseLeads.$inferInsert;

export const launchInterests = mysqlTable("launch_interests", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  nome: varchar("nome", { length: 255 }),
  planoInteresse: mysqlEnum("planoInteresse", ["pro", "enterprise", "qualquer"]).default("qualquer").notNull(),
  notificado: boolean("notificado").default(false).notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().notNull(),
});

export type LaunchInterest = typeof launchInterests.$inferSelect;
export type InsertLaunchInterest = typeof launchInterests.$inferInsert;

export const accessWhitelist = mysqlTable("access_whitelist", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  nome: varchar("nome", { length: 255 }),
  adicionadoPor: varchar("adicionadoPor", { length: 320 }),
  ativo: boolean("ativo").default(true).notNull(),
  expiresAt: timestamp("expiresAt"),
  /** Número total de e-mails de convite enviados para este endereço */
  convitesEnviados: int("convitesEnviados").default(0).notNull(),
  /** Data e hora do último envio de e-mail de convite */
  ultimoEnvio: timestamp("ultimoEnvio"),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().notNull(),
});

export type AccessWhitelist = typeof accessWhitelist.$inferSelect;
export type InsertAccessWhitelist = typeof accessWhitelist.$inferInsert;

export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  assunto: mysqlEnum("assunto", ["duvida", "feedback", "suporte", "parceria", "outro"]).default("duvida").notNull(),
  mensagem: text("mensagem").notNull(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  lido: boolean("lido").default(false).notNull(),
  respostaAdmin: text("respostaAdmin"),
  respondidoEm: timestamp("respondidoEm"),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

/**
 * Tabela de versões de documentos gerados
 * Armazena cada geração de documento para histórico e comparação de versões.
 * Agrupa versões pelo mesmo "grupo" (mesmo contexto/tipo/área) para facilitar comparação.
 */
export const documentVersions = mysqlTable("document_versions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Identificador do grupo de versões (UUID gerado no frontend para agrupar gerações do mesmo caso) */
  groupId: varchar("groupId", { length: 64 }).notNull(),
  /** Número da versão dentro do grupo (1, 2, 3...) */
  versao: int("versao").notNull(),
  /** Título descritivo (ex: "Petição Inicial - Civil") */
  titulo: varchar("titulo", { length: 255 }).notNull(),
  /** Tipo de documento (peticao, parecer, contrato, etc.) */
  tipoDocumento: varchar("tipoDocumento", { length: 50 }).notNull(),
  /** Área jurídica */
  areaJuridica: varchar("areaJuridica", { length: 100 }).notNull(),
  /** Estratégia de IA usada */
  estrategia: varchar("estrategia", { length: 50 }).notNull(),
  /** Contexto do caso (input do usuário) */
  contexto: text("contexto").notNull(),
  /** Objetivo do documento */
  objetivo: text("objetivo"),
  /** Partes envolvidas */
  partesEnvolvidas: text("partesEnvolvidas"),
  /** Legislação relevante */
  legislacao: text("legislacao"),
  /** Detalhes adicionais */
  detalhes: text("detalhes"),
  /** Documento gerado (conteúdo completo em markdown) */
  documento: text("documento").notNull(),
  /** Tempo de geração em milissegundos */
  tempoGeracaoMs: int("tempoGeracaoMs"),
  /** Metadados adicionais (validação de legislação, etc.) */
  metadata: json("metadata"),
  /** Notas do usuário sobre esta versão */
  notas: text("notas"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = typeof documentVersions.$inferInsert;

/**
 * Tabela de integrações do usuário (API Keys e tokens OAuth)
 * Armazena chaves de API e tokens de acesso para serviços externos.
 * IMPORTANTE: As API Keys são armazenadas em texto — em produção, considere
 * criptografia adicional no campo apiKey antes de persistir.
 */
export const userIntegrations = mysqlTable("user_integrations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** Provedor: 'openai' | 'anthropic' | 'gemini' | 'perplexity' | 'google_drive' | 'gmail' */
  provider: varchar("provider", { length: 50 }).notNull(),
  /** Chave de API do provedor (para OpenAI, Anthropic, Gemini, Perplexity) */
  apiKey: text("apiKey"),
  /** Token OAuth2 de acesso (para Google Drive, Gmail) */
  accessToken: text("accessToken"),
  /** Token OAuth2 de renovação (para Google Drive, Gmail) */
  refreshToken: text("refreshToken"),
  /** Expiração do token OAuth2 */
  tokenExpiry: timestamp("tokenExpiry"),
  /** Se a integração está ativa */
  isActive: boolean("isActive").default(true).notNull(),
  /** Metadados adicionais (email da conta Google, nome, etc.) */
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserIntegration = typeof userIntegrations.$inferSelect;
export type InsertUserIntegration = typeof userIntegrations.$inferInsert;

// ============================================================
// ASSISTENTE CONVERSACIONAL GUIADO (JurIA)
// ============================================================

/**
 * Sessões de conversa com o assistente jurídico guiado.
 * Cada sessão representa uma conversa completa com o assistente.
 */
export const chatSessions = mysqlTable("chat_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  titulo: varchar("titulo", { length: 255 }),
  etapaAtual: int("etapaAtual").default(1).notNull(),
  etapaConcluida: boolean("etapaConcluida").default(false).notNull(),
  /** Contexto acumulado das respostas do usuário nas etapas guiadas */
  contextoAcumulado: json("contextoAcumulado").$type<Record<string, string>>(),
  /** Prompt final gerado ao fim do wizard */
  promptGerado: text("promptGerado"),
  areaJuridica: varchar("areaJuridica", { length: 100 }),
  tipoDocumento: varchar("tipoDocumento", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Mensagens individuais de cada sessão de chat.
 */
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  role: text("role_chat").notNull(),
  content: text("content").notNull(),
  /** Etapa do wizard em que a mensagem foi gerada (null = chat livre) */
  etapa: int("etapa"),
  /** Metadados extras (sugestões de prompt, fontes citadas, etc.) */
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// ============================================================
// HISTÓRICO DE PROMPTS SALVOS (JurIA — Meus Prompts)
// ============================================================

/**
 * Tabela de prompts salvos pelo usuário a partir das sugestões do assistente JurIA.
 * Cada registro representa um prompt que o usuário escolheu salvar/usar.
 */
export const promptsSalvos = mysqlTable("prompts_salvos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** ID da sessão do assistente que originou o prompt */
  sessionId: int("sessionId"),
  /** Título descritivo gerado automaticamente ou editado pelo usuário */
  titulo: varchar("titulo", { length: 255 }).notNull(),
  /** Estratégia usada para gerar o prompt */
  estrategia: text("estrategia_ps").notNull().default("manual"),
  /** Área jurídica associada (ex: Direito Civil, Trabalhista) */
  areaJuridica: varchar("areaJuridica", { length: 100 }),
  /** Tipo de documento (ex: Petição Inicial, Recurso) */
  tipoDocumento: varchar("tipoDocumento", { length: 100 }),
  /** Conteúdo completo do prompt */
  conteudo: text("conteudo").notNull(),
  /** Notas pessoais do usuário sobre este prompt */
  notas: text("notas"),
  /** Se o prompt está marcado como favorito */
  isFavorito: boolean("isFavorito").default(false).notNull(),
  /** Número de vezes que o prompt foi copiado/usado */
  usoCount: int("usoCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PromptSalvo = typeof promptsSalvos.$inferSelect;
export type InsertPromptSalvo = typeof promptsSalvos.$inferInsert;

// ============================================================
// HISTÓRICO DE ENVIOS DE CONVITE (convite_logs)
// ============================================================
/**
 * Registra cada tentativa de envio de convite para e-mails da whitelist.
 * Permite auditoria completa e visualização do histórico por e-mail.
 */
export const conviteLogs = mysqlTable("convite_logs", {
  id: int("id").autoincrement().primaryKey(),
  /** E-mail destinatário do convite */
  email: varchar("email", { length: 320 }).notNull(),
  /** Nome do destinatário no momento do envio */
  nome: varchar("nome", { length: 255 }),
  /** Resultado do envio */
  resultado: text("resultado_cl").notNull(),
  /** Mensagem de erro, se houver */
  erroMsg: text("erroMsg"),
  /** IP do admin que disparou o envio (null = automático) */
  adminIp: varchar("adminIp", { length: 64 }),
  /** Identificador do admin que disparou (null = job automático) */
  adminId: int("adminId"),
  /** Tipo de disparo: manual (botão), lote (reenviar todos), automatico (job) */
  tipoDisparo: text("tipo_disparo_cl").notNull().default("manual"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ConviteLog = typeof conviteLogs.$inferSelect;
export type InsertConviteLog = typeof conviteLogs.$inferInsert;

// ============================================================
// CONFIGURAÇÕES DE REENVIO AUTOMÁTICO
// ============================================================
/**
 * Configurações do job de reenvio automático de convites.
 * Apenas um registro ativo por vez (id = 1).
 */
export const configReenvioAuto = mysqlTable("config_reenvio_auto", {
  id: int("id").autoincrement().primaryKey(),
  /** Se o job está habilitado */
  habilitado: boolean("habilitado").default(false).notNull(),
  /** Dia da semana para execução (0=Dom, 1=Seg, ..., 6=Sáb) */
  diaSemana: int("diaSemana").default(1).notNull(),
  /** Hora de execução (0-23, horário de Brasília) */
  hora: int("hora").default(9).notNull(),
  /** Reenviar apenas para quem ainda não acessou o sistema */
  apenasNaoAcessaram: boolean("apenasNaoAcessaram").default(true).notNull(),
  /** Data/hora da última execução do job */
  ultimaExecucao: timestamp("ultimaExecucao"),
  /** Resultado da última execução */
  ultimoResultado: varchar("ultimoResultado", { length: 500 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ConfigReenvioAuto = typeof configReenvioAuto.$inferSelect;
export type InsertConfigReenvioAuto = typeof configReenvioAuto.$inferInsert;

/**
 * Tabela de log de acessos — registra cada login de usuário no sistema.
 * Permite auditoria e monitoramento de atividade no painel admin.
 */
export const accessLogs = mysqlTable("access_logs", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do usuário no banco (null se for primeiro acesso e ainda não existia) */
  userId: int("userId"),
  /** OpenId do usuário (sempre disponível no callback OAuth) */
  openId: varchar("openId", { length: 64 }).notNull(),
  /** Nome do usuário no momento do login */
  nome: text("nome"),
  /** E-mail do usuário no momento do login */
  email: varchar("email", { length: 320 }),
  /** Método de autenticação utilizado (email, google, github etc.) */
  loginMethod: varchar("loginMethod", { length: 64 }),
  /** IP de origem da requisição */
  ipOrigem: varchar("ipOrigem", { length: 64 }),
  /** User-Agent do navegador */
  userAgent: varchar("userAgent", { length: 512 }),
  /** Se foi o primeiro acesso do usuário */
  primeiroAcesso: boolean("primeiroAcesso").default(false).notNull(),
  /** Se o acesso foi permitido (false = bloqueado pela whitelist) */
  acessoPermitido: boolean("acessoPermitido").default(true).notNull(),
  /** Data/hora do acesso */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AccessLog = typeof accessLogs.$inferSelect;
export type InsertAccessLog = typeof accessLogs.$inferInsert;

// ============================================================
// CRM — Gestão de Leads, Contratos e Membros
// ============================================================

/**
 * Tabela de leads — representa potenciais clientes no funil de vendas.
 */
export const crmLeads = mysqlTable("crm_leads", {
  id: int("id").autoincrement().primaryKey(),
  nome: text("nome").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  telefone: varchar("telefone", { length: 32 }),
  empresa: text("empresa"),
  etapa: text("etapa").default("lead").notNull(),
  valorMensal: int("valorMensal").default(0),
  origem: text("origem").default("outro").notNull(),
  notas: text("notas"),
  responsavelId: int("responsavelId"),
  fechadoEm: timestamp("fechadoEm"),
  motivoPerda: text("motivoPerda"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CrmLead = typeof crmLeads.$inferSelect;
export type InsertCrmLead = typeof crmLeads.$inferInsert;

/**
 * Tabela de contratos/assinaturas — representa clientes ativos.
 */
export const crmContratos = mysqlTable("crm_contratos", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId"),
  nomeCliente: text("nomeCliente").notNull(),
  emailCliente: varchar("emailCliente", { length: 320 }).notNull(),
  empresa: text("empresa"),
  plano: text("plano").default("basico").notNull(),
  valorMensal: int("valorMensal").notNull().default(0),
  status: text("status").default("ativo").notNull(),
  inicioEm: timestamp("inicioEm").defaultNow().notNull(),
  canceladoEm: timestamp("canceladoEm"),
  motivoCancelamento: text("motivoCancelamento"),
  notas: text("notas"),
  responsavelId: int("responsavelId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CrmContrato = typeof crmContratos.$inferSelect;
export type InsertCrmContrato = typeof crmContratos.$inferInsert;

/**
 * Tabela de membros CRM — usuários autorizados a acessar o painel CRM.
 */
export const crmMembros = mysqlTable("crm_membros", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nivel: text("nivel").default("visualizador").notNull(),
  autorizadoPorId: int("autorizadoPorId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CrmMembro = typeof crmMembros.$inferSelect;
export type InsertCrmMembro = typeof crmMembros.$inferInsert;

/**
 * Tabela de atividades CRM — histórico de interações com leads/contratos.
 */
export const crmAtividades = mysqlTable("crm_atividades", {
  id: int("id").autoincrement().primaryKey(),
  entidadeTipo: text("entidadeTipo").notNull(),
  entidadeId: int("entidadeId").notNull(),
  tipo: text("tipo").notNull(),
  descricao: text("descricao").notNull(),
  usuarioId: int("usuarioId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CrmAtividade = typeof crmAtividades.$inferSelect;
export type InsertCrmAtividade = typeof crmAtividades.$inferInsert;

/**
 * Tabela de assinaturas de push — armazena os endpoints Web Push por usuário/dispositivo.
 */
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: varchar("userAgent", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;

// ============================================================
// Monitoramento LLM — Logs de chamadas, erros e fallbacks
// ============================================================
/**
 * Tabela de logs de chamadas LLM — registra cada invocação ao unified-llm.ts.
 * Permite monitorar erros, fallbacks, latência e uso por provider/modelo.
 */
export const llmLogs = mysqlTable("llm_logs", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do usuário que disparou a chamada (null = chamada interna/sistema) */
  userId: int("userId"),
  /** Provider solicitado originalmente (ex: "openai", "manus") */
  providerSolicitado: varchar("providerSolicitado", { length: 32 }).notNull(),
  /** Modelo solicitado originalmente (ex: "gpt-4o-mini") */
  modeloSolicitado: varchar("modeloSolicitado", { length: 64 }).notNull(),
  /** Provider que efetivamente respondeu (pode diferir se houve fallback) */
  providerEfetivo: varchar("providerEfetivo", { length: 32 }).notNull(),
  /** Modelo que efetivamente respondeu */
  modeloEfetivo: varchar("modeloEfetivo", { length: 64 }).notNull(),
  /** Se houve fallback automático para outro provider */
  houveFallback: boolean("houveFallback").default(false).notNull(),
  /** Status da chamada */
  status: mysqlEnum("status_llm", ["sucesso", "erro", "timeout", "fallback_sucesso", "fallback_erro"]).notNull(),
  /** Latência total em milissegundos */
  latenciaMs: int("latenciaMs"),
  /** Número de tokens de entrada (prompt) */
  tokensEntrada: int("tokensEntrada"),
  /** Número de tokens de saída (completion) */
  tokensSaida: int("tokensSaida"),
  /** Contexto da chamada (ex: "gerar_prompt", "executar_prompt", "refinar") */
  contexto: varchar("contexto", { length: 64 }),
  /** Mensagem de erro (se houver) */
  erroMensagem: text("erroMensagem"),
  /** Tipo de erro categorizado */
  erroTipo: varchar("erroTipo", { length: 64 }),
  /** Número da tentativa (1 = primeira, 2 = retry 1, etc.) */
  numeroTentativa: int("numeroTentativa").default(1).notNull(),
  /** Data/hora do evento */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LlmLog = typeof llmLogs.$inferSelect;
export type InsertLlmLog = typeof llmLogs.$inferInsert;

// ── Admin Cards Arquivados ──────────────────────────────────────────────────
// Armazena cards do painel admin que foram arquivados pelo admin
// (preserva dados históricos sem exibir na interface principal)
export const adminCardsArquivados = mysqlTable("admin_cards_arquivados", {
  id: int("id").autoincrement().primaryKey(),
  /** Identificador único do card (ex: "resend", "testes-integracao") */
  cardId: varchar("cardId", { length: 64 }).notNull().unique(),
  /** Título legível do card */
  cardTitulo: varchar("cardTitulo", { length: 128 }).notNull(),
  /** Motivo do arquivamento (opcional) */
  motivo: text("motivo"),
  /** openId do admin que arquivou */
  archivedBy: varchar("archivedBy", { length: 64 }),
  /** Data/hora do arquivamento */
  archivedAt: timestamp("archivedAt").defaultNow().notNull(),
});

export type AdminCardArquivado = typeof adminCardsArquivados.$inferSelect;
export type InsertAdminCardArquivado = typeof adminCardsArquivados.$inferInsert;

// ============================================================
// ONBOARDING DRIP EMAILS — Sequência de boas-vindas (5 emails, 14 dias)
// ============================================================

/**
 * Rastreia quais emails da sequência de onboarding já foram enviados para cada usuário.
 * Permite controlar a cadência e evitar duplicatas.
 */
export const onboardingEmails = mysqlTable("onboarding_emails", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do usuário */
  userId: int("userId").notNull(),
  /** Email do usuário (para envio mesmo se conta for deletada) */
  email: varchar("email", { length: 320 }).notNull(),
  /** Número do email na sequência (1-5) */
  sequenceNumber: int("sequenceNumber").notNull(),
  /** Status do envio */
  status: mysqlEnum("status_onb", ["pendente", "enviado", "falha", "cancelado"]).default("pendente").notNull(),
  /** Data agendada para envio */
  scheduledAt: timestamp("scheduledAt").notNull(),
  /** Data efetiva do envio (null se ainda não enviado) */
  sentAt: timestamp("sentAt"),
  /** Erro caso tenha falhado */
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OnboardingEmail = typeof onboardingEmails.$inferSelect;
export type InsertOnboardingEmail = typeof onboardingEmails.$inferInsert;

// ============================================================
// SISTEMA DE REFERRAL — Indicações com cupons de desconto
// ============================================================

/**
 * Códigos de referral únicos por usuário.
 * Cada usuário pode ter um código de indicação que compartilha com outros.
 * Quando alguém se cadastra usando o código, ambos ganham benefícios.
 */
export const referralCodes = mysqlTable("referral_codes", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do usuário dono do código */
  userId: int("userId").notNull(),
  /** Código único de referral (ex: "PCHG-ABC123") */
  code: varchar("code", { length: 32 }).notNull().unique(),
  /** Créditos bônus que o referrer ganha por cada indicação convertida */
  rewardCredits: int("rewardCredits").default(5).notNull(),
  /** Créditos bônus que o indicado ganha ao se cadastrar */
  referredRewardCredits: int("referredRewardCredits").default(5).notNull(),
  /** Número total de indicações feitas com este código */
  totalReferrals: int("totalReferrals").default(0).notNull(),
  /** Número de indicações que se converteram (cadastro completo) */
  convertedReferrals: int("convertedReferrals").default(0).notNull(),
  /** Se o código está ativo */
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = typeof referralCodes.$inferInsert;

/**
 * Registro de cada indicação realizada.
 * Rastreia quem indicou quem e o status da conversão.
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do código de referral usado */
  referralCodeId: int("referralCodeId").notNull(),
  /** ID do usuário que indicou (dono do código) */
  referrerId: int("referrerId").notNull(),
  /** ID do usuário indicado (quem usou o código) */
  referredId: int("referredId").notNull(),
  /** Status da indicação */
  status: mysqlEnum("status_ref", ["pendente", "convertido", "expirado", "cancelado"]).default("pendente").notNull(),
  /** Se a recompensa do referrer já foi creditada */
  referrerRewarded: boolean("referrerRewarded").default(false).notNull(),
  /** Se a recompensa do indicado já foi creditada */
  referredRewarded: boolean("referredRewarded").default(false).notNull(),
  /** Data da conversão (quando o indicado fez primeira operação) */
  convertedAt: timestamp("convertedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;


// ─── Tabela de Idempotência para Webhook Stripe ──────────────────────────────

/**
 * Registra eventos do Stripe já processados para evitar processamento duplicado.
 * Garante idempotência no webhook — reenvios do Stripe não geram efeitos colaterais.
 */
export const processedStripeEvents = mysqlTable("processed_stripe_events", {
  id: int("id").autoincrement().primaryKey(),
  /** ID do evento Stripe (ex: evt_1234567890) */
  eventId: varchar("eventId", { length: 255 }).notNull().unique(),
  /** Tipo do evento (ex: checkout.session.completed) */
  eventType: varchar("eventType", { length: 100 }).notNull(),
  /** Timestamp de quando o evento foi processado */
  processedAt: timestamp("processedAt").defaultNow().notNull(),
});

export type ProcessedStripeEvent = typeof processedStripeEvents.$inferSelect;
export type InsertProcessedStripeEvent = typeof processedStripeEvents.$inferInsert;

// ─── Índices para Performance ────────────────────────────────────────────────

/**
 * Índices compostos para as tabelas mais consultadas.
 * Drizzle ORM não suporta índices inline em mysqlTable() da mesma forma que
 * outros ORMs, então criamos via script de migração SQL.
 * 
 * Os índices serão criados via ALTER TABLE no script fix-db-indexes.mjs
 * 
 * Tabelas e índices planejados:
 * - prompts: idx_prompts_userId, idx_prompts_createdAt, idx_prompts_userId_tipo
 * - historico: idx_historico_userId, idx_historico_createdAt
 * - llm_logs: idx_llm_logs_userId, idx_llm_logs_createdAt
 * - notifications: idx_notifications_userId_lida
 * - chat_sessions: idx_chat_sessions_userId
 * - chat_messages: idx_chat_messages_sessionId
 * - prompts_salvos: idx_prompts_salvos_userId
 * - access_logs: idx_access_logs_userId, idx_access_logs_createdAt
 * - audit_logs: idx_audit_logs_userId, idx_audit_logs_createdAt
 * - referrals: unique(referrerId, referredId)
 */


// ─── Tabela de Price Overrides (Atualização Dinâmica de Preços) ──────────────

export const priceOverrides = mysqlTable("price_overrides", {
  id: int("id").autoincrement().primaryKey(),
  entityType: varchar("entityType", { length: 32 }).notNull(), // "plan" | "credit_package"
  entityId: varchar("entityId", { length: 64 }).notNull(), // planId ou packageId
  priceMonthly: int("priceMonthly"), // centavos BRL (para planos)
  priceYearly: int("priceYearly"), // centavos BRL (para planos)
  priceInCents: int("priceInCents"), // centavos BRL (para pacotes de créditos)
  pricePerCredit: int("pricePerCredit"), // centavos BRL por crédito
  reason: text("reason"), // motivo do ajuste
  adjustmentPercent: int("adjustmentPercent"), // % de ajuste aplicado (armazenado como inteiro * 100)
  source: varchar("source", { length: 32 }), // "ipca", "manual", "scheduled_task"
  referenceMonth: varchar("referenceMonth", { length: 7 }), // "2026-05"
  appliedAt: timestamp("appliedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_price_overrides_entity").on(table.entityType, table.entityId),
]);

export type PriceOverride = typeof priceOverrides.$inferSelect;
export type InsertPriceOverride = typeof priceOverrides.$inferInsert;
