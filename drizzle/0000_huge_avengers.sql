CREATE TYPE "public"."alert_metrica" AS ENUM('p50', 'p95', 'p99', 'media');--> statement-breakpoint
CREATE TYPE "public"."contact_assunto" AS ENUM('duvida', 'feedback', 'suporte', 'parceria', 'outro');--> statement-breakpoint
CREATE TYPE "public"."enterprise_lead_status" AS ENUM('pendente', 'contatado', 'convertido', 'descartado');--> statement-breakpoint
CREATE TYPE "public"."fontes_tipo" AS ENUM('lei', 'jurisprudencia', 'doutrina', 'artigo');--> statement-breakpoint
CREATE TYPE "public"."historico_acao" AS ENUM('analise', 'geracao', 'otimizacao', 'verificacao', 'exportacao_docx', 'exportacao_pdf', 'execucao_prompt');--> statement-breakpoint
CREATE TYPE "public"."launch_interest_plano" AS ENUM('pro', 'enterprise', 'qualquer');--> statement-breakpoint
CREATE TYPE "public"."legislacao_confiabilidade" AS ENUM('alta', 'media', 'baixa');--> statement-breakpoint
CREATE TYPE "public"."legislacao_tipo" AS ENUM('artigo', 'lei', 'codigo', 'decreto', 'portaria');--> statement-breakpoint
CREATE TYPE "public"."notification_tipo" AS ENUM('sucesso', 'alerta', 'erro', 'info', 'sistema');--> statement-breakpoint
CREATE TYPE "public"."perfil_tipo_documento" AS ENUM('peticao', 'parecer', 'contrato', 'recurso', 'defesa', 'memorando', 'outro');--> statement-breakpoint
CREATE TYPE "public"."prompt_qualidade" AS ENUM('excelente', 'bom', 'ruim');--> statement-breakpoint
CREATE TYPE "public"."prompt_tipo" AS ENUM('analise', 'geracao', 'otimizacao');--> statement-breakpoint
CREATE TYPE "public"."prompt_versao_tipo" AS ENUM('original', 'otimizado', 'manual');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('free', 'pro', 'enterprise');--> statement-breakpoint
CREATE TABLE "access_whitelist" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"nome" varchar(255),
	"adicionadoPor" varchar(320),
	"ativo" boolean DEFAULT true NOT NULL,
	"expiresAt" timestamp,
	"criadoEm" timestamp DEFAULT now() NOT NULL,
	"atualizadoEm" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "access_whitelist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "alert_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"rota" varchar(255),
	"metrica" "alert_metrica" NOT NULL,
	"threshold" integer NOT NULL,
	"isAtivo" boolean DEFAULT true NOT NULL,
	"cooldown" integer DEFAULT 300 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analises" (
	"id" serial PRIMARY KEY NOT NULL,
	"promptId" integer NOT NULL,
	"userId" integer NOT NULL,
	"areaIdentificada" varchar(100),
	"confiancaArea" integer,
	"palavrasChave" jsonb,
	"entidades" jsonb,
	"pontuacaoQualidade" integer,
	"sugestoes" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"acao" varchar(100) NOT NULL,
	"descricao" text,
	"metadata" jsonb,
	"ipAddress" varchar(45),
	"userAgent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "backups" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" varchar(255) NOT NULL,
	"s3Key" varchar(512) NOT NULL,
	"s3Url" varchar(1024) NOT NULL,
	"size" bigint NOT NULL,
	"isEncrypted" boolean DEFAULT true NOT NULL,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cabecalho_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"nomeEscritorio" varchar(255),
	"oab" varchar(50),
	"endereco" text,
	"telefone" varchar(50),
	"email" varchar(320),
	"website" varchar(255),
	"habilitado" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cabecalho_templates_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "configuracoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"areaPreferida" varchar(100),
	"nivelDetalhePreferido" integer DEFAULT 5,
	"incluirReferenciasDefault" boolean DEFAULT true,
	"personaDefault" text,
	"preferencias" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "configuracoes_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"assunto" "contact_assunto" DEFAULT 'duvida' NOT NULL,
	"mensagem" text NOT NULL,
	"ipAddress" varchar(64),
	"lido" boolean DEFAULT false NOT NULL,
	"respostaAdmin" text,
	"respondidoEm" timestamp,
	"criadoEm" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enterprise_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"escritorio" varchar(255) NOT NULL,
	"numeroAdvogados" varchar(20) NOT NULL,
	"areasPrincipais" text,
	"mensagem" text,
	"status" "enterprise_lead_status" DEFAULT 'pendente' NOT NULL,
	"notasInternas" text,
	"contatadoEm" timestamp,
	"criadoEm" timestamp DEFAULT now() NOT NULL,
	"atualizadoEm" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_flags" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(100) NOT NULL,
	"descricao" text,
	"isAtivo" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feature_flags_nome_unique" UNIQUE("nome")
);
--> statement-breakpoint
CREATE TABLE "fontes_juridicas" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipo" "fontes_tipo" NOT NULL,
	"identificador" varchar(255) NOT NULL,
	"titulo" text,
	"url" text,
	"conteudo" text,
	"tribunal" varchar(100),
	"dataPublicacao" timestamp,
	"isVerificada" boolean DEFAULT false,
	"ultimaVerificacao" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "formatacao_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"nome" varchar(100) NOT NULL,
	"fonte" varchar(50) DEFAULT 'Arial' NOT NULL,
	"tamanhoFonte" integer DEFAULT 12 NOT NULL,
	"espacamento" varchar(10) DEFAULT '1.5' NOT NULL,
	"margemSuperior" integer DEFAULT 3 NOT NULL,
	"margemInferior" integer DEFAULT 2 NOT NULL,
	"margemEsquerda" integer DEFAULT 3 NOT NULL,
	"margemDireita" integer DEFAULT 2 NOT NULL,
	"incluirCabecalho" boolean DEFAULT true NOT NULL,
	"incluirDataHora" boolean DEFAULT true NOT NULL,
	"isPadrao" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historico" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"acao" "historico_acao" NOT NULL,
	"promptId" integer,
	"detalhes" jsonb,
	"duracaoMs" integer,
	"sucesso" boolean DEFAULT true,
	"mensagemErro" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "launch_interests" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"nome" varchar(255),
	"planoInteresse" "launch_interest_plano" DEFAULT 'qualquer' NOT NULL,
	"notificado" boolean DEFAULT false NOT NULL,
	"criadoEm" timestamp DEFAULT now() NOT NULL,
	"atualizadoEm" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "launch_interests_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "legislacao_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"citacao" varchar(500) NOT NULL,
	"tipo" "legislacao_tipo" NOT NULL,
	"confiabilidade" "legislacao_confiabilidade" NOT NULL,
	"motivo" text NOT NULL,
	"linkOficial" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp NOT NULL,
	CONSTRAINT "legislacao_cache_citacao_unique" UNIQUE("citacao")
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"emailEnabled" boolean DEFAULT true NOT NULL,
	"soundEnabled" boolean DEFAULT true NOT NULL,
	"tiposSucesso" boolean DEFAULT true NOT NULL,
	"tiposAlerta" boolean DEFAULT true NOT NULL,
	"tiposErro" boolean DEFAULT true NOT NULL,
	"tiposInfo" boolean DEFAULT true NOT NULL,
	"tiposSistema" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"tipo" "notification_tipo" NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"mensagem" text NOT NULL,
	"lida" boolean DEFAULT false NOT NULL,
	"link" varchar(500),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "perfis_uso" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"nome" varchar(100) NOT NULL,
	"tipoDocumento" "perfil_tipo_documento" NOT NULL,
	"areaJuridica" varchar(100) NOT NULL,
	"modeloId" varchar(50),
	"descricao" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"ruleId" integer NOT NULL,
	"rota" varchar(255) NOT NULL,
	"metrica" varchar(20) NOT NULL,
	"valorAtual" integer NOT NULL,
	"threshold" integer NOT NULL,
	"mensagem" text NOT NULL,
	"resolvido" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"promptId" integer NOT NULL,
	"tagId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_versoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"promptId" integer NOT NULL,
	"versao" integer NOT NULL,
	"conteudo" text NOT NULL,
	"tipo" "prompt_versao_tipo" NOT NULL,
	"observacoes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"tipo" "prompt_tipo" NOT NULL,
	"areaJuridica" varchar(100),
	"promptOriginal" text NOT NULL,
	"promptOtimizado" text,
	"qualidade" "prompt_qualidade",
	"isFavorito" boolean DEFAULT false,
	"shareToken" varchar(64),
	"metadata" jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "prompts_shareToken_unique" UNIQUE("shareToken")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"nome" varchar(50) NOT NULL,
	"cor" varchar(7) DEFAULT '#3b82f6',
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"templateId" integer NOT NULL,
	"tagId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"areaJuridica" varchar(100) NOT NULL,
	"nome" varchar(255) NOT NULL,
	"descricao" text,
	"template" text NOT NULL,
	"variaveis" jsonb,
	"exemplos" jsonb,
	"isAtivo" boolean DEFAULT true,
	"isPublico" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"tutorialId" varchar(100) NOT NULL,
	"util" boolean NOT NULL,
	"criadoEm" timestamp DEFAULT now() NOT NULL,
	"atualizadoEm" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_progresso" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"tutorialId" varchar(100) NOT NULL,
	"concluido" boolean DEFAULT true NOT NULL,
	"concluidoEm" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"subscriptionPlan" "subscription_plan" DEFAULT 'free' NOT NULL,
	"usageCount" integer DEFAULT 0 NOT NULL,
	"stripeCustomerId" varchar(255),
	"stripeSubscriptionId" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "uso_modelos" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"modeloId" varchar(50) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
