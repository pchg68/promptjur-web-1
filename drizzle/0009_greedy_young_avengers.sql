CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emailEnabled` boolean NOT NULL DEFAULT true,
	`soundEnabled` boolean NOT NULL DEFAULT true,
	`tiposSucesso` boolean NOT NULL DEFAULT true,
	`tiposAlerta` boolean NOT NULL DEFAULT true,
	`tiposErro` boolean NOT NULL DEFAULT true,
	`tiposInfo` boolean NOT NULL DEFAULT true,
	`tiposSistema` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tipo` enum('sucesso','alerta','erro','info','sistema') NOT NULL,
	`titulo` varchar(200) NOT NULL,
	`mensagem` text NOT NULL,
	`lida` boolean NOT NULL DEFAULT false,
	`link` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
