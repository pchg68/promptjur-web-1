CREATE TABLE `formatacao_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nome` varchar(100) NOT NULL,
	`fonte` varchar(50) NOT NULL DEFAULT 'Arial',
	`tamanhoFonte` int NOT NULL DEFAULT 12,
	`espacamento` varchar(10) NOT NULL DEFAULT '1.5',
	`margemSuperior` int NOT NULL DEFAULT 3,
	`margemInferior` int NOT NULL DEFAULT 2,
	`margemEsquerda` int NOT NULL DEFAULT 3,
	`margemDireita` int NOT NULL DEFAULT 2,
	`incluirCabecalho` boolean NOT NULL DEFAULT true,
	`incluirDataHora` boolean NOT NULL DEFAULT true,
	`isPadrao` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `formatacao_templates_id` PRIMARY KEY(`id`)
);
