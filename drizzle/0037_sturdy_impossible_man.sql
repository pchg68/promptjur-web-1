CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`role_chat` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`etapa` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chat_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`titulo` varchar(255),
	`etapaAtual` int NOT NULL DEFAULT 1,
	`etapaConcluida` boolean NOT NULL DEFAULT false,
	`contextoAcumulado` json,
	`promptGerado` text,
	`areaJuridica` varchar(100),
	`tipoDocumento` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chat_sessions_id` PRIMARY KEY(`id`)
);
