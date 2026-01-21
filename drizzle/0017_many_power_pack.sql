CREATE TABLE `perfis_uso` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nome` varchar(100) NOT NULL,
	`tipoDocumento` enum('peticao','parecer','contrato','recurso','defesa','memorando','outro') NOT NULL,
	`areaJuridica` varchar(100) NOT NULL,
	`modeloId` varchar(50),
	`descricao` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `perfis_uso_id` PRIMARY KEY(`id`)
);
