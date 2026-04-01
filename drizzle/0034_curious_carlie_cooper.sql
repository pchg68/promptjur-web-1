CREATE TABLE `contact_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`assunto` enum('duvida','feedback','suporte','parceria','outro') NOT NULL DEFAULT 'duvida',
	`mensagem` text NOT NULL,
	`ipAddress` varchar(64),
	`lido` boolean NOT NULL DEFAULT false,
	`respostaAdmin` text,
	`respondidoEm` timestamp,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contact_messages_id` PRIMARY KEY(`id`)
);
