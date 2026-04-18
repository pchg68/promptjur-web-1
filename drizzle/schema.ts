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
