CREATE TABLE `cabecalho_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nomeEscritorio` varchar(255),
	`oab` varchar(50),
	`endereco` text,
	`telefone` varchar(50),
	`email` varchar(320),
	`website` varchar(255),
	`habilitado` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cabecalho_templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `cabecalho_templates_userId_unique` UNIQUE(`userId`)
);
