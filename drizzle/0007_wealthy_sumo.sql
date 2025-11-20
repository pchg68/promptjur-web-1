ALTER TABLE `users` ADD `subscriptionPlan` enum('free','pro','enterprise') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `usageCount` int DEFAULT 0 NOT NULL;