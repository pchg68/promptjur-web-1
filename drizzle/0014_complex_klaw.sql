CREATE TABLE `avaliacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`promptId` int NOT NULL,
	`plataforma` enum('manus','chatgpt','claude','gemini','perplexity') NOT NULL,
	`rating` int NOT NULL,
	`comentario` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `avaliacoes_id` PRIMARY KEY(`id`)
);
