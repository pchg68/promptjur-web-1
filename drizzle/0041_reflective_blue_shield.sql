CREATE TABLE `access_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`openId` varchar(64) NOT NULL,
	`nome` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`ipOrigem` varchar(64),
	`userAgent` varchar(512),
	`primeiroAcesso` boolean NOT NULL DEFAULT false,
	`acessoPermitido` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `access_logs_id` PRIMARY KEY(`id`)
);
