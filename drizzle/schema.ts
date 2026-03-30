import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json, bigint } from "drizzle-orm/mysql-core";

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
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }), // Stripe Customer ID
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }), // Stripe Subscription ID ativa
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
 * Tabela de notificações do usuário
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tipo: mysqlEnum("tipo", ["sucesso", "alerta", "erro", "info", "sistema"]).notNull(),
  titulo: varchar("titulo", { length: 200 }).notNull(),
  mensagem: text("mensagem").notNull(),
  lida: boolean("lida").default(false).notNull(),
  link: varchar("link", { length: 500 }), // Link opcional para ação
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Tabela de preferências de notificações
 */
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

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
  acao: mysqlEnum("acao", ["analise", "geracao", "otimizacao", "verificacao", "exportacao_docx", "exportacao_pdf", "execucao_prompt"]).notNull(),
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

/**
 * Tabela de cache de validação de legislação
 * Armazena resultados de validações para otimizar performance
 */
export const legislacaoCache = mysqlTable("legislacao_cache", {
  id: int("id").autoincrement().primaryKey(),
  citacao: varchar("citacao", { length: 500 }).notNull().unique(), // Texto da citação (ex: "Lei 11.101/2005")
  tipo: mysqlEnum("tipo", ["artigo", "lei", "codigo", "decreto", "portaria"]).notNull(),
  confiabilidade: mysqlEnum("confiabilidade", ["alta", "media", "baixa"]).notNull(),
  motivo: text("motivo").notNull(), // Explicação da confiabilidade
  linkOficial: text("linkOficial"), // Link para fonte oficial
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(), // Data de expiração do cache (30 dias)
});

export type LegislacaoCache = typeof legislacaoCache.$inferSelect;
export type InsertLegislacaoCache = typeof legislacaoCache.$inferInsert;

/**
 * Tabela de perfis de uso para salvar combinações frequentes
 */
export const perfisUso = mysqlTable("perfis_uso", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nome: varchar("nome", { length: 100 }).notNull(), // Nome do perfil (ex: "Trabalhista Padrão")
  tipoDocumento: mysqlEnum("tipoDocumento", ["peticao", "parecer", "contrato", "recurso", "defesa", "memorando", "outro"]).notNull(),
  areaJuridica: varchar("areaJuridica", { length: 100 }).notNull(),
  modeloId: varchar("modeloId", { length: 50 }), // ID do modelo profissional (opcional)
  descricao: text("descricao"), // Descrição opcional do perfil
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PerfilUso = typeof perfisUso.$inferSelect;
export type InsertPerfilUso = typeof perfisUso.$inferInsert;

/**
 * Tabela de templates de formatação personalizados
 */
export const formatacaoTemplates = mysqlTable("formatacao_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  nome: varchar("nome", { length: 100 }).notNull(), // Nome do template (ex: "Padrão Escritório")
  fonte: varchar("fonte", { length: 50 }).default("Arial").notNull(), // Fonte do documento
  tamanhoFonte: int("tamanhoFonte").default(12).notNull(), // Tamanho da fonte em pt
  espacamento: varchar("espacamento", { length: 10 }).default("1.5").notNull(), // Espaçamento entre linhas
  margemSuperior: int("margemSuperior").default(3).notNull(), // Margem superior em cm
  margemInferior: int("margemInferior").default(2).notNull(), // Margem inferior em cm
  margemEsquerda: int("margemEsquerda").default(3).notNull(), // Margem esquerda em cm
  margemDireita: int("margemDireita").default(2).notNull(), // Margem direita em cm
  incluirCabecalho: boolean("incluirCabecalho").default(true).notNull(),
  incluirDataHora: boolean("incluirDataHora").default(true).notNull(),
  isPadrao: boolean("isPadrao").default(false).notNull(), // Template padrão do usuário
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FormatacaoTemplate = typeof formatacaoTemplates.$inferSelect;
export type InsertFormatacaoTemplate = typeof formatacaoTemplates.$inferInsert;

/**
 * Tabela de logs de auditoria para ações administrativas
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Admin que executou a ação
  acao: varchar("acao", { length: 100 }).notNull(), // Ex: "limpar_cache", "executar_testes", "toggle_feature"
  descricao: text("descricao"), // Detalhes da ação
  metadata: json("metadata"), // Dados adicionais (ex: feature toggleada, resultado dos testes)
  ipAddress: varchar("ipAddress", { length: 45 }), // IPv4 ou IPv6
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Tabela de feature flags para controle de funcionalidades
 */
export const featureFlags = mysqlTable("feature_flags", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull().unique(), // Ex: "knowledge_retrieval", "modelos_premium"
  descricao: text("descricao"),
  isAtivo: boolean("isAtivo").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = typeof featureFlags.$inferInsert;

/**
 * Tabela de regras de alertas de performance
 * Define thresholds para monitoramento automático
 */
export const alertRules = mysqlTable("alert_rules", {
  id: int("id").autoincrement().primaryKey(),
  rota: varchar("rota", { length: 255 }), // null = regra global
  metrica: mysqlEnum("metrica", ["p50", "p95", "p99", "media"]).notNull(),
  threshold: int("threshold").notNull(), // em ms
  isAtivo: int("isAtivo").default(1).notNull(),
  cooldown: int("cooldown").default(300).notNull(), // segundos entre alertas
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertRule = typeof alertRules.$inferInsert;

/**
 * Tabela de alertas de performance disparados
 * Histórico de alertas para análise
 */
export const performanceAlerts = mysqlTable("performance_alerts", {
  id: int("id").autoincrement().primaryKey(),
  ruleId: int("ruleId").notNull(),
  rota: varchar("rota", { length: 255 }).notNull(),
  metrica: varchar("metrica", { length: 20 }).notNull(),
  valorAtual: int("valorAtual").notNull(), // em ms
  threshold: int("threshold").notNull(), // em ms
  mensagem: text("mensagem").notNull(),
  resolvido: int("resolvido").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerformanceAlert = typeof performanceAlerts.$inferSelect;
export type InsertPerformanceAlert = typeof performanceAlerts.$inferInsert;

/**
 * Tabela de backups do banco de dados
 * Rastreia backups criados e armazenados no S3
 */
export const backups = mysqlTable("backups", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  s3Key: varchar("s3Key", { length: 512 }).notNull(),
  s3Url: varchar("s3Url", { length: 1024 }).notNull(),
  size: bigint("size", { mode: "number" }).notNull(),
  isEncrypted: int("isEncrypted").notNull().default(1),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Backup = typeof backups.$inferSelect;
export type InsertBackup = typeof backups.$inferInsert;


/**
 * Tabela de templates de cabeçalho personalizados
 * Armazena configurações de cabeçalho para documentos jurídicos
 */
export const cabecalhoTemplates = mysqlTable("cabecalho_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // Um template por usuário
  nomeEscritorio: varchar("nomeEscritorio", { length: 255 }),
  oab: varchar("oab", { length: 50 }), // Ex: "OAB/SP 123.456"
  endereco: text("endereco"),
  telefone: varchar("telefone", { length: 50 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 255 }),
  habilitado: boolean("habilitado").default(true).notNull(), // Se deve incluir cabeçalho automaticamente
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CabecalhoTemplate = typeof cabecalhoTemplates.$inferSelect;
export type InsertCabecalhoTemplate = typeof cabecalhoTemplates.$inferInsert;


/**
 * Tabela de progresso de tutoriais
 * Rastreia quais tutoriais o usuário já leu/completou
 */
export const tutorialProgresso = mysqlTable("tutorial_progresso", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tutorialId: varchar("tutorialId", { length: 100 }).notNull(), // ID do tutorial (ex: 'bem-vindo-promptjur')
  concluido: boolean("concluido").default(true).notNull(),
  concluidoEm: timestamp("concluidoEm").defaultNow().notNull(),
});

export type TutorialProgresso = typeof tutorialProgresso.$inferSelect;
export type InsertTutorialProgresso = typeof tutorialProgresso.$inferInsert;

/**
 * Tabela de feedback de tutoriais
 * Registra avaliações "Útil" / "Não útil" dos usuários
 */
export const tutorialFeedback = mysqlTable("tutorial_feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tutorialId: varchar("tutorialId", { length: 100 }).notNull(),
  util: boolean("util").notNull(), // true = útil, false = não útil
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().onUpdateNow().notNull(),
});
export type TutorialFeedback = typeof tutorialFeedback.$inferSelect;
export type InsertTutorialFeedback = typeof tutorialFeedback.$inferInsert;

/**
 * Tabela de leads Enterprise
 * Armazena formulários de contato do Plano Escritório para gestão comercial
 */
export const enterpriseLeads = mysqlTable("enterprise_leads", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  escritorio: varchar("escritorio", { length: 255 }).notNull(),
  numeroAdvogados: varchar("numeroAdvogados", { length: 20 }).notNull(),
  areasPrincipais: text("areasPrincipais"),
  mensagem: text("mensagem"),
  status: mysqlEnum("status", ["pendente", "contatado", "convertido", "descartado"])
    .default("pendente")
    .notNull(),
  notasInternas: text("notasInternas"),
  contatadoEm: timestamp("contatadoEm"),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().onUpdateNow().notNull(),
});
export type EnterpriseLead = typeof enterpriseLeads.$inferSelect;
export type InsertEnterpriseLead = typeof enterpriseLeads.$inferInsert;

/**
 * Tabela de interessados no lançamento
 * Captura e-mails de usuários que querem ser notificados quando os planos pagos forem ativados
 */
export const launchInterests = mysqlTable("launch_interests", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  nome: varchar("nome", { length: 255 }),
  planoInteresse: mysqlEnum("planoInteresse", ["pro", "enterprise", "qualquer"])
    .default("qualquer")
    .notNull(),
  notificado: boolean("notificado").default(false).notNull(),
  criadoEm: timestamp("criadoEm").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizadoEm").defaultNow().onUpdateNow().notNull(),
});
export type LaunchInterest = typeof launchInterests.$inferSelect;
export type InsertLaunchInterest = typeof launchInterests.$inferInsert;
