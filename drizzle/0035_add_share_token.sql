ALTER TABLE `prompts` ADD `shareToken` varchar(64);--> statement-breakpoint
CREATE UNIQUE INDEX `prompts_shareToken_unique` ON `prompts` (`shareToken`);
