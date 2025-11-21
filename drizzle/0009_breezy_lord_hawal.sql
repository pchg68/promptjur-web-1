CREATE TABLE `user_petitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`tipoDocumento` varchar(100) NOT NULL,
	`areaJuridica` varchar(100),
	`fileUrl` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`textoExtraido` text,
	`analisado` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_petitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_style_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`estruturaArgumentativa` text,
	`padraoOrganizacao` text,
	`tomEscrita` varchar(100),
	`nivelFormalidade` varchar(50),
	`tipoFundamentacao` varchar(100),
	`preferenciaCitacoes` text,
	`expressõesRecorrentes` json,
	`vocabularioPreferido` json,
	`estiloPedidos` text,
	`trechosExemplo` json,
	`peticoesAnalisadas` int DEFAULT 0,
	`ultimaAnalise` timestamp,
	`confiancaPerfil` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_style_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_style_profiles_userId_unique` UNIQUE(`userId`)
);
