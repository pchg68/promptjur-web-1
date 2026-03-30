CREATE TABLE `enterprise_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`escritorio` varchar(255) NOT NULL,
	`numeroAdvogados` varchar(20) NOT NULL,
	`areasPrincipais` text,
	`mensagem` text,
	`status` enum('pendente','contatado','convertido','descartado') NOT NULL DEFAULT 'pendente',
	`notasInternas` text,
	`contatadoEm` timestamp,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`atualizadoEm` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `enterprise_leads_id` PRIMARY KEY(`id`)
);
