CREATE TABLE `shared_prompts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`promptId` int NOT NULL,
	`userId` int NOT NULL,
	`shareId` varchar(32) NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`descricao` text,
	`conteudo` text NOT NULL,
	`areaJuridica` enum('Civil','Penal','Trabalhista','Tributário','Administrativo','Constitucional','Empresarial','Consumidor','Família','Previdenciário','Ambiental','Internacional','Processo Civil') NOT NULL,
	`visualizacoes` int NOT NULL DEFAULT 0,
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `shared_prompts_id` PRIMARY KEY(`id`),
	CONSTRAINT `shared_prompts_shareId_unique` UNIQUE(`shareId`)
);
