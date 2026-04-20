import {
  pgTable, pgEnum, text, timestamp, varchar, boolean,
  jsonb, bigint, integer, serial, uniqueIndex
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const subscriptionPlanEnum = pgEnum("subscription_plan", ["free", "pro", "enterprise"]);
export const promptTipoEnum = pgEnum("prompt_tipo", ["analise", "geracao", "otimizacao"]);
export const promptQualidadeEnum = pgEnum("prompt_qualidade", ["excelente", "bom", "ruim"]);
export const notificationTipoEnum = pgEnum("notification_tipo", ["sucesso", "alerta", "erro", "info", "sistema"]);
export const fontesTipoEnum = pgEnum("fontes_tipo", ["lei", "jurisprudencia", "doutrina", "artigo"]);
export const historicoAcaoEnum = pgEnum("historico_acao", ["analise", "geracao", "otimizacao", "verificacao", "exportacao_docx", "exportacao_pdf", "execucao_prompt"]);
export const promptVersaoTipoEnum = pgEnum("prompt_versao_tipo", ["original", "otimizado", "manual"]);
export const legislacaoTipoEnum = pgEnum("legislacao_tipo", ["artigo", "lei", "codigo", "decreto", "portaria"]);
export const legislacaoConfiabilidadeEnum = pgEnum("legislacao_confiabilidade", ["alta", "media", "baixa"]);
export const perfilTipoDocumentoEnum = pgEnum("perfil_tipo_documento", ["peticao", "parecer", "contrato", "recurso", "defesa", "memorando", "outro"]);
export const alertMetricaEnum = pgEnum("alert_metrica", ["p50", "p95", "p99", "media"]);
export const enterpriseLeadStatusEnum = pgEnum("enterprise_lead_status", ["pendente", "contatado", "convertido", "descartado"]);
export const launchInterestPlanoEnum = pgEnum("launch_interest_plano", ["pro", "enterprise", "qualquer"]);
export const contactAssuntoEnum = pgEnum("contact_assunto", ["duvida", "feedback", "suporte", "parceria", "outro"]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  subscriptionPlan: subscriptionPlanEnum("subscriptionPlan").default("free").notNull(),
  usageCount: integer("usageCount").default(0).notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const prompts = pgTable("prompts", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  tipo: promptTipoEnum("tipo").notNull(),
  areaJuridica: varchar("areaJuridica", { length: 100 }),
  promptOriginal: text("promptOriginal").notNull(),
  promptOtimizado: text("promptOtimizado"),
  qualidade: promptQualidadeEnum("qualidade"),
  isFavorito: boolean("isFavorito").default(false),
  shareToken: varchar("shareToken", { length: 64 }).unique(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Prompt = typeof prompts.$inferSelect;
export type InsertPrompt = typeof prompts.$inferInsert;

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  tipo: notificationTipoEnum("tipo").notNull(),
  titulo: varchar("titulo", { length: 200 }).notNull(),
  mensagem: text("mensagem").notNull(),
  lida: boolean("lida").default(false).notNull(),
  link: varchar("link", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  emailEnabled: boolean("emailEnabled").default(true).notNull(),
  soundEnabled: boolean("soundEnabled").default(true).notNull(),
  tiposSucesso: boolean("tiposSucesso").default(true).notNull(),
  tiposAlerta: boolean("tiposAlerta").default(true).notNull(),
  tiposErro: boolean("tiposErro").default(true).notNull(),
  tiposInfo: boolean("tiposInfo").default(true).notNull(),
  tiposSistema: boolean("tiposSistema").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

export const analises = pgTable("analises", {
  id: serial("id").primaryKey(),
  promptId: integer("promptId").notNull(),
  userId: integer("userId").notNull(),
  areaIdentificada: varchar("areaIdentificada", { length: 100 }),
  confiancaArea: integer("confiancaArea"),
  palavrasChave: jsonb("palavrasChave"),
  entidades: jsonb("entidades"),
  pontuacaoQualidade: integer("pontuacaoQualidade"),
  sugestoes: jsonb("sugestoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Analise = typeof analises.$inferSelect;
export type InsertAnalise = typeof analises.$inferInsert;

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  areaJuridica: varchar("areaJuridica", { length: 100 }).notNull(),
  nome: varchar("nome", { length: 255 }).notNull(),
  descricao: text("descricao"),
  template: text("template").notNull(),
  variaveis: jsonb("variaveis"),
  exemplos: jsonb("exemplos"),
  isAtivo: boolean("isAtivo").default(true),
  isPublico: boolean("isPublico").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Template = typeof templates.$inferSelect;
export type InsertTemplate = typeof templates.$inferInsert;

export const fontesJuridicas = pgTable("fontes_juridicas", {
  id: serial("id").primaryKey(),
  tipo: fontesTipoEnum("tipo").notNull(),
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

export const historico = pgTable("historico", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  acao: historicoAcaoEnum("acao").notNull(),
  promptId: integer("promptId"),
  detalhes: jsonb("detalhes"),
  duracaoMs: integer("duracaoMs"),
  sucesso: boolean("sucesso").default(true),
  mensagemErro: text("mensagemErro"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Historico = typeof historico.$inferSelect;
export type InsertHistorico = typeof historico.$inferInsert;

export const configuracoes = pgTable("configuracoes", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
  areaPreferida: varchar("areaPreferida", { length: 100 }),
  nivelDetalhePreferido: integer("nivelDetalhePreferido").default(5),
  incluirReferenciasDefault: boolean("incluirReferenciasDefault").default(true),
  personaDefault: text("personaDefault"),
  preferencias: jsonb("preferencias"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Configuracao = typeof configuracoes.$inferSelect;
export type InsertConfiguracao = typeof configuracoes.$inferInsert;

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  nome: varchar("nome", { length: 50 }).notNull(),
  cor: varchar("cor", { length: 7 }).default("#3b82f6"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

export const templateTags = pgTable("template_tags", {
  id: serial("id").primaryKey(),
  templateId: integer("templateId").notNull(),
  tagId: integer("tagId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TemplateTag = typeof templateTags.$inferSelect;
export type InsertTemplateTag = typeof templateTags.$inferInsert;

export const promptTags = pgTable("prompt_tags", {
  id: serial("id").primaryKey(),
  promptId: integer("promptId").notNull(),
  tagId: integer("tagId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PromptTag = typeof promptTags.$inferSelect;
export type InsertPromptTag = typeof promptTags.$inferInsert;

export const promptVersoes = pgTable("prompt_versoes", {
  id: serial("id").primaryKey(),
  promptId: integer("promptId").notNull(),
  versao: integer("versao").notNull(),
  conteudo: text("conteudo").notNull(),
  tipo: promptVersaoTipoEnum("tipo").notNull(),
  observacoes: text("observacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PromptVersao = typeof promptVersoes.$inferSelect;
export type InsertPromptVersao = typeof promptVersoes.$inferInsert;

export const usoModelos = pgTable("uso_modelos", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  modeloId: varchar("modeloId", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UsoModelo = typeof usoModelos.$inferSelect;
export type InsertUsoModelo = typeof usoModelos.$inferInsert;

export const legislacaoCache = pgTable("legislacao_cache", {
  id: serial("id").primaryKey(),
  citacao: varchar("citacao", { length: 500 }).notNull().unique(),
  tipo: legislacaoTipoEnum("tipo").notNull(),
  confiabilidade: legislacaoConfiabilidadeEnum("confiabilidade").notNull(),
  motivo: text("motivo").notNull(),
  linkOficial: text("linkOficial"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export type LegislacaoCache = typeof legislacaoCache.$inferSelect;
export type InsertLegislacaoCache = typeof legislacaoCache.$inferInsert;

export const perfisUso = pgTable("perfis_uso", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  nome: varchar("nome", { length: 100 }).notNull(),
  tipoDocumento: perfilTipoDocumentoEnum("tipoDocumento").notNull(),
  areaJuridica: varchar("areaJuridica", { length: 100 }).notNull(),
  modeloId: varchar("modeloId", { length: 50 }),
  descricao: text("descricao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PerfilUso = typeof perfisUso.$inferSelect;
export type InsertPerfilUso = typeof perfisUso.$inferInsert;

export const formatacaoTemplates = pgTable("formatacao_templates", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  nome: varchar("nome", { length: 100 }).notNull(),
  fonte: varchar("fonte", { length: 50 }).default("Arial").notNull(),
  tamanhoFonte: integer("tamanhoFonte").default(12).notNull(),
  espacamento: varchar("espacamento", { length: 10 }).default("1.5").notNull(),
  margemSuperior: integer("margemSuperior").default(3).notNull(),
  margemInferior: integer("margemInferior").default(2).notNull(),
  margemEsquerda: integer("margemEsquerda").default(3).notNull(),
  margemDireita: integer("margemDireita").default(2).notNull(),
  incluirCabecalho: boolean("incluirCabecalho").default(true).notNull(),
  incluirDataHora: boolean("incluirDataHora").default(true).notNull(),
  isPadrao: boolean("isPadrao").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FormatacaoTemplate = typeof formatacaoTemplates.$inferSelect;
export type InsertFormatacaoTemplate = typeof formatacaoTemplates.$inferInsert;

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  acao: varchar("acao", { length: 100 }).notNull(),
  descricao: text("descricao"),
  metadata: jsonb("metadata"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

export const featureFlags = pgTable("feature_flags", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull().unique(),
  descricao: text("descricao"),
  isAtivo: boolean("isAtivo").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = typeof featureFlags.$inferInsert;

export const alertRules = pgTable("alert_rules", {
  id: serial("id").primaryKey(),
  rota: varchar("rota", { length: 255 }),
  metrica: alertMetricaEnum("metrica").notNull(),
  threshold: integer("threshold").notNull(),
  isAtivo: boolean("isAtivo").default(true).notNull(),
  cooldown: integer("cooldown").default(300).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertRule = typeof alertRules.$inferInsert;

export const performanceAlerts = pgTable("performance_alerts", {
  id: serial("id").primaryKey(),
  ruleId: integer("ruleId").notNull(),
  rota: varchar("rota", { length: 255 }).notNull(),
  metrica: varchar("metrica", { length: 20 }).notNull(),
  valorAtual: integer("valorAtual").notNull(),
  threshold: integer("threshold").notNull(),
  mensagem: text("mensagem").notNull(),
  resolvido: boolean("resolvido").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerformanceAlert = typeof performanceAlerts.$inferSelect;
export type InsertPerformanceAlert = typeof performanceAlerts.$inferInsert;

export const backups = pgTable("backups", {
  id: serial("id").primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  s3Key: varchar("s3Key", { length: 512 }).notNull(),
  s3Url: varchar("s3Url", { length: 1024 }).notNull(),
  size: bigint("size", { mode: "number" }).notNull(),
  isEncrypted: boolean("isEncrypted").default(true).notNull(),
  createdBy: integer("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Backup = typeof backups.$inferSelect;
export type InsertBackup = typeof backups.$inferInsert;

export const cabecalhoTemplates = pgTable("cabecalho_templates", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().unique(),
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

export const tutorialProgresso = pgTable("tutorial_progresso", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  tutorialId: varchar("tutorialId", { length: 100 }).notNull(),
  concluido: boolean("concluido").default(true).notNull(),
  concluidoEm: timestamp("concluidoEm").defaultNow().notNull(),
});

export type TutorialProgresso = typeof tutorialProgresso.$inferSelect;
export type InsertTutorialProgresso = typeof tutorialProgresso.$inferInsert;

export const tutorialFeedback = pgTable("tutorial_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  tutorialId: varchar("tutorialId", { length: 100 }).notNull(),
  util: boolean("util").notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().notNull(),
});

export type TutorialFeedback = typeof tutorialFeedback.$inferSelect;
export type InsertTutorialFeedback = typeof tutorialFeedback.$inferInsert;

export const enterpriseLeads = pgTable("enterprise_leads", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  escritorio: varchar("escritorio", { length: 255 }).notNull(),
  numeroAdvogados: varchar("numeroAdvogados", { length: 20 }).notNull(),
  areasPrincipais: text("areasPrincipais"),
  mensagem: text("mensagem"),
  status: enterpriseLeadStatusEnum("status").default("pendente").notNull(),
  notasInternas: text("notasInternas"),
  contatadoEm: timestamp("contatadoEm"),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().notNull(),
});

export type EnterpriseLead = typeof enterpriseLeads.$inferSelect;
export type InsertEnterpriseLead = typeof enterpriseLeads.$inferInsert;

export const launchInterests = pgTable("launch_interests", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  nome: varchar("nome", { length: 255 }),
  planoInteresse: launchInterestPlanoEnum("planoInteresse").default("qualquer").notNull(),
  notificado: boolean("notificado").default(false).notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().notNull(),
});

export type LaunchInterest = typeof launchInterests.$inferSelect;
export type InsertLaunchInterest = typeof launchInterests.$inferInsert;

export const accessWhitelist = pgTable("access_whitelist", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  nome: varchar("nome", { length: 255 }),
  adicionadoPor: varchar("adicionadoPor", { length: 320 }),
  ativo: boolean("ativo").default(true).notNull(),
  expiresAt: timestamp("expiresAt"),
  /** Número total de e-mails de convite enviados para este endereço */
  convitesEnviados: integer("convitesEnviados").default(0).notNull(),
  /** Data e hora do último envio de e-mail de convite */
  ultimoEnvio: timestamp("ultimoEnvio"),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().notNull(),
});

export type AccessWhitelist = typeof accessWhitelist.$inferSelect;
export type InsertAccessWhitelist = typeof accessWhitelist.$inferInsert;

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  assunto: contactAssuntoEnum("assunto").default("duvida").notNull(),
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
export const documentVersions = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  /** Identificador do grupo de versões (UUID gerado no frontend para agrupar gerações do mesmo caso) */
  groupId: varchar("groupId", { length: 64 }).notNull(),
  /** Número da versão dentro do grupo (1, 2, 3...) */
  versao: integer("versao").notNull(),
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
  tempoGeracaoMs: integer("tempoGeracaoMs"),
  /** Metadados adicionais (validação de legislação, etc.) */
  metadata: jsonb("metadata"),
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
export const userIntegrations = pgTable("user_integrations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
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
  metadata: jsonb("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdateFn(() => new Date()).notNull(),
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
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  titulo: varchar("titulo", { length: 255 }),
  etapaAtual: integer("etapaAtual").default(1).notNull(),
  etapaConcluida: boolean("etapaConcluida").default(false).notNull(),
  /** Contexto acumulado das respostas do usuário nas etapas guiadas */
  contextoAcumulado: jsonb("contextoAcumulado").$type<Record<string, string>>(),
  /** Prompt final gerado ao fim do wizard */
  promptGerado: text("promptGerado"),
  areaJuridica: varchar("areaJuridica", { length: 100 }),
  tipoDocumento: varchar("tipoDocumento", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdateFn(() => new Date()).notNull(),
});

/**
 * Mensagens individuais de cada sessão de chat.
 */
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("sessionId").notNull(),
  role: text("role_chat").notNull(),
  content: text("content").notNull(),
  /** Etapa do wizard em que a mensagem foi gerada (null = chat livre) */
  etapa: integer("etapa"),
  /** Metadados extras (sugestões de prompt, fontes citadas, etc.) */
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
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
export const promptsSalvos = pgTable("prompts_salvos", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  /** ID da sessão do assistente que originou o prompt */
  sessionId: integer("sessionId"),
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
  usoCount: integer("usoCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdateFn(() => new Date()).notNull(),
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
export const conviteLogs = pgTable("convite_logs", {
  id: serial("id").primaryKey(),
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
  adminId: integer("adminId"),
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
export const configReenvioAuto = pgTable("config_reenvio_auto", {
  id: serial("id").primaryKey(),
  /** Se o job está habilitado */
  habilitado: boolean("habilitado").default(false).notNull(),
  /** Dia da semana para execução (0=Dom, 1=Seg, ..., 6=Sáb) */
  diaSemana: integer("diaSemana").default(1).notNull(),
  /** Hora de execução (0-23, horário de Brasília) */
  hora: integer("hora").default(9).notNull(),
  /** Reenviar apenas para quem ainda não acessou o sistema */
  apenasNaoAcessaram: boolean("apenasNaoAcessaram").default(true).notNull(),
  /** Data/hora da última execução do job */
  ultimaExecucao: timestamp("ultimaExecucao"),
  /** Resultado da última execução */
  ultimoResultado: varchar("ultimoResultado", { length: 500 }),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdateFn(() => new Date()).notNull(),
});

export type ConfigReenvioAuto = typeof configReenvioAuto.$inferSelect;
export type InsertConfigReenvioAuto = typeof configReenvioAuto.$inferInsert;

/**
 * Tabela de log de acessos — registra cada login de usuário no sistema.
 * Permite auditoria e monitoramento de atividade no painel admin.
 */
export const accessLogs = pgTable("access_logs", {
  id: serial("id").primaryKey(),
  /** ID do usuário no banco (null se for primeiro acesso e ainda não existia) */
  userId: integer("userId"),
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
export const crmLeads = pgTable("crm_leads", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  telefone: varchar("telefone", { length: 32 }),
  empresa: text("empresa"),
  etapa: text("etapa").default("lead").notNull(),
  valorMensal: integer("valorMensal").default(0),
  origem: text("origem").default("outro").notNull(),
  notas: text("notas"),
  responsavelId: integer("responsavelId"),
  fechadoEm: timestamp("fechadoEm"),
  motivoPerda: text("motivoPerda"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdateFn(() => new Date()).notNull(),
});
export type CrmLead = typeof crmLeads.$inferSelect;
export type InsertCrmLead = typeof crmLeads.$inferInsert;

/**
 * Tabela de contratos/assinaturas — representa clientes ativos.
 */
export const crmContratos = pgTable("crm_contratos", {
  id: serial("id").primaryKey(),
  leadId: integer("leadId"),
  nomeCliente: text("nomeCliente").notNull(),
  emailCliente: varchar("emailCliente", { length: 320 }).notNull(),
  empresa: text("empresa"),
  plano: text("plano").default("basico").notNull(),
  valorMensal: integer("valorMensal").notNull().default(0),
  status: text("status").default("ativo").notNull(),
  inicioEm: timestamp("inicioEm").defaultNow().notNull(),
  canceladoEm: timestamp("canceladoEm"),
  motivoCancelamento: text("motivoCancelamento"),
  notas: text("notas"),
  responsavelId: integer("responsavelId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().$onUpdateFn(() => new Date()).notNull(),
});
export type CrmContrato = typeof crmContratos.$inferSelect;
export type InsertCrmContrato = typeof crmContratos.$inferInsert;

/**
 * Tabela de membros CRM — usuários autorizados a acessar o painel CRM.
 */
export const crmMembros = pgTable("crm_membros", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  nivel: text("nivel").default("visualizador").notNull(),
  autorizadoPorId: integer("autorizadoPorId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CrmMembro = typeof crmMembros.$inferSelect;
export type InsertCrmMembro = typeof crmMembros.$inferInsert;

/**
 * Tabela de atividades CRM — histórico de interações com leads/contratos.
 */
export const crmAtividades = pgTable("crm_atividades", {
  id: serial("id").primaryKey(),
  entidadeTipo: text("entidadeTipo").notNull(),
  entidadeId: integer("entidadeId").notNull(),
  tipo: text("tipo").notNull(),
  descricao: text("descricao").notNull(),
  usuarioId: integer("usuarioId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CrmAtividade = typeof crmAtividades.$inferSelect;
export type InsertCrmAtividade = typeof crmAtividades.$inferInsert;
