CREATE TABLE `analises` (
	`id` int AUTO_INCREMENT NOT NULL,
	`promptId` int NOT NULL,
	`userId` int NOT NULL,
	`areaIdentificada` varchar(100),
	`confiancaArea` int,
	`palavrasChave` json,
	`entidades` json,
	`pontuacaoQualidade` int,
	`sugestoes` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analises_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `configuracoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`areaPreferida` varchar(100),
	`nivelDetalhePreferido` int DEFAULT 5,
	`incluirReferenciasDefault` boolean DEFAULT true,
	`personaDefault` text,
	`preferencias` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `configuracoes_id` PRIMARY KEY(`id`),
	CONSTRAINT `configuracoes_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `fontes_juridicas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipo` enum('lei','jurisprudencia','doutrina','artigo') NOT NULL,
	`identificador` varchar(255) NOT NULL,
	`titulo` text,
	`url` text,
	`conteudo` text,
	`tribunal` varchar(100),
	`dataPublicacao` timestamp,
	`isVerificada` boolean DEFAULT false,
	`ultimaVerificacao` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fontes_juridicas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `historico` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`acao` enum('analise','geracao','otimizacao','verificacao') NOT NULL,
	`promptId` int,
	`detalhes` json,
	`duracaoMs` int,
	`sucesso` boolean DEFAULT true,
	`mensagemErro` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `historico_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prompts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tipo` enum('analise','geracao','otimizacao') NOT NULL,
	`areaJuridica` varchar(100),
	`promptOriginal` text NOT NULL,
	`promptOtimizado` text,
	`qualidade` enum('excelente','bom','ruim'),
	`isFavorito` boolean DEFAULT false,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prompts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`areaJuridica` varchar(100) NOT NULL,
	`nome` varchar(255) NOT NULL,
	`descricao` text,
	`template` text NOT NULL,
	`variaveis` json,
	`exemplos` json,
	`isAtivo` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `templates_id` PRIMARY KEY(`id`)
);
