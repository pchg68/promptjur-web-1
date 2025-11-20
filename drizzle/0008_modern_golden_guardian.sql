CREATE TABLE `uso_modelos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`modeloId` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `uso_modelos_id` PRIMARY KEY(`id`)
);
