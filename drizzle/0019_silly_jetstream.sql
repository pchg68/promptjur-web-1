CREATE TABLE `alert_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rota` varchar(255),
	`metrica` enum('p50','p95','p99','media') NOT NULL,
	`threshold` int NOT NULL,
	`isAtivo` int NOT NULL DEFAULT true,
	`cooldown` int NOT NULL DEFAULT 300,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_rules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `performance_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleId` int NOT NULL,
	`rota` varchar(255) NOT NULL,
	`metrica` varchar(20) NOT NULL,
	`valorAtual` int NOT NULL,
	`threshold` int NOT NULL,
	`mensagem` text NOT NULL,
	`resolvido` int NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `performance_alerts_id` PRIMARY KEY(`id`)
);
