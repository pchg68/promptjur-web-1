DROP TABLE `analises`;--> statement-breakpoint
DROP TABLE `configuracoes`;--> statement-breakpoint
DROP TABLE `fontes_juridicas`;--> statement-breakpoint
DROP TABLE `historico`;--> statement-breakpoint
DROP TABLE `prompt_tags`;--> statement-breakpoint
DROP TABLE `prompt_versoes`;--> statement-breakpoint
DROP TABLE `prompts`;--> statement-breakpoint
DROP TABLE `tags`;--> statement-breakpoint
DROP TABLE `template_tags`;--> statement-breakpoint
DROP TABLE `templates`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `stripeCustomerId`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `stripeSubscriptionId`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `subscriptionStatus`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `subscriptionPlan`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `subscriptionEndsAt`;