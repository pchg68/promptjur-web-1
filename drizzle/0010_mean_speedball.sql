CREATE TABLE `legislacao_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`citacao` varchar(500) NOT NULL,
	`tipo` enum('artigo','lei','codigo','decreto','portaria') NOT NULL,
	`confiabilidade` enum('alta','media','baixa') NOT NULL,
	`motivo` text NOT NULL,
	`linkOficial` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `legislacao_cache_id` PRIMARY KEY(`id`),
	CONSTRAINT `legislacao_cache_citacao_unique` UNIQUE(`citacao`)
);
