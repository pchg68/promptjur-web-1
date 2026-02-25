CREATE TABLE `tutorial_progresso` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tutorialId` varchar(100) NOT NULL,
	`concluido` boolean NOT NULL DEFAULT true,
	`concluidoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tutorial_progresso_id` PRIMARY KEY(`id`)
);
