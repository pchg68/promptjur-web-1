CREATE TABLE `config_reenvio_auto` (
	`id` int AUTO_INCREMENT NOT NULL,
	`habilitado` boolean NOT NULL DEFAULT false,
	`diaSemana` int NOT NULL DEFAULT 1,
	`hora` int NOT NULL DEFAULT 9,
	`apenasNaoAcessaram` boolean NOT NULL DEFAULT true,
	`ultimaExecucao` timestamp,
	`ultimoResultado` varchar(500),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `config_reenvio_auto_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `convite_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`nome` varchar(255),
	`resultado_cl` enum('enviado','falha','pulado') NOT NULL,
	`erroMsg` text,
	`adminIp` varchar(64),
	`adminId` int,
	`tipo_disparo_cl` enum('manual','lote','automatico') NOT NULL DEFAULT 'manual',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `convite_logs_id` PRIMARY KEY(`id`)
);
