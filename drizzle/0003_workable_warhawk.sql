CREATE TABLE `prompt_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`promptId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prompt_tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `prompt_versoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`promptId` int NOT NULL,
	`versao` int NOT NULL,
	`conteudo` text NOT NULL,
	`tipo` enum('original','otimizado','manual') NOT NULL,
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prompt_versoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nome` varchar(50) NOT NULL,
	`cor` varchar(7) DEFAULT '#3b82f6',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `template_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `template_tags_id` PRIMARY KEY(`id`)
);
