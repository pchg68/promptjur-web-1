CREATE TABLE `comparacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`promptId` int NOT NULL,
	`plataformas` json NOT NULL,
	`melhorPlataforma` enum('manus','chatgpt','claude','gemini','perplexity'),
	`observacoes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comparacoes_id` PRIMARY KEY(`id`)
);
