ALTER TABLE `alert_rules` MODIFY COLUMN `isAtivo` int NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `performance_alerts` MODIFY COLUMN `resolvido` int NOT NULL DEFAULT 0;