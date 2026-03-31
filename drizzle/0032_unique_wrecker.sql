CREATE TABLE `access_whitelist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`nome` varchar(255),
	`adicionadoPor` varchar(320),
	`ativo` boolean NOT NULL DEFAULT true,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`atualizadoEm` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `access_whitelist_id` PRIMARY KEY(`id`),
	CONSTRAINT `access_whitelist_email_unique` UNIQUE(`email`)
);
