CREATE TABLE `crm_atividades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entidadeTipo` enum('lead','contrato') NOT NULL,
	`entidadeId` int NOT NULL,
	`tipo` enum('nota','ligacao','email','reuniao','proposta_enviada','mudanca_etapa') NOT NULL,
	`descricao` text NOT NULL,
	`usuarioId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_atividades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_contratos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int,
	`nomeCliente` text NOT NULL,
	`emailCliente` varchar(320) NOT NULL,
	`empresa` text,
	`plano` enum('basico','profissional','enterprise') NOT NULL DEFAULT 'basico',
	`valorMensal` int NOT NULL DEFAULT 0,
	`status` enum('ativo','cancelado','suspenso','trial') NOT NULL DEFAULT 'ativo',
	`inicioEm` timestamp NOT NULL DEFAULT (now()),
	`canceladoEm` timestamp,
	`motivoCancelamento` text,
	`notas` text,
	`responsavelId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_contratos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` text NOT NULL,
	`email` varchar(320) NOT NULL,
	`telefone` varchar(32),
	`empresa` text,
	`etapa` enum('lead','contato','demonstracao','proposta','fechado_ganho','fechado_perdido') NOT NULL DEFAULT 'lead',
	`valorMensal` int DEFAULT 0,
	`origem` enum('indicacao','organico','redes_sociais','email_marketing','evento','outro') NOT NULL DEFAULT 'outro',
	`notas` text,
	`responsavelId` int,
	`fechadoEm` timestamp,
	`motivoPerda` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `crm_leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `crm_membros` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`nivel` enum('visualizador','editor','admin') NOT NULL DEFAULT 'visualizador',
	`autorizadoPorId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `crm_membros_id` PRIMARY KEY(`id`)
);
