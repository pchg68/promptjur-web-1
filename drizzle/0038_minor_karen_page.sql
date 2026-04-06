CREATE TABLE `prompts_salvos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` int,
	`titulo` varchar(255) NOT NULL,
	`estrategia_ps` enum('direta','raciocinio','recuperacao','manual') NOT NULL DEFAULT 'manual',
	`areaJuridica` varchar(100),
	`tipoDocumento` varchar(100),
	`conteudo` text NOT NULL,
	`notas` text,
	`isFavorito` boolean NOT NULL DEFAULT false,
	`usoCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `prompts_salvos_id` PRIMARY KEY(`id`)
);
