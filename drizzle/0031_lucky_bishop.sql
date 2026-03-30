CREATE TABLE `launch_interests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`nome` varchar(255),
	`planoInteresse` enum('pro','enterprise','qualquer') NOT NULL DEFAULT 'qualquer',
	`notificado` boolean NOT NULL DEFAULT false,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`atualizadoEm` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `launch_interests_id` PRIMARY KEY(`id`),
	CONSTRAINT `launch_interests_email_unique` UNIQUE(`email`)
);
