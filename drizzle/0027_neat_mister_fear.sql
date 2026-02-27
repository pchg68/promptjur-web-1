CREATE TABLE `tutorial_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tutorialId` varchar(100) NOT NULL,
	`util` boolean NOT NULL,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`atualizadoEm` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tutorial_feedback_id` PRIMARY KEY(`id`)
);
