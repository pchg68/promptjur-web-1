ALTER TABLE `legislacao_cache` MODIFY COLUMN `tipo` enum('artigo','lei','codigo','decreto','portaria') NOT NULL;--> statement-breakpoint
ALTER TABLE `prompts` DROP COLUMN `plataformaTeste`;