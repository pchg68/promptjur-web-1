ALTER TABLE `notification_preferences` ADD COLUMN IF NOT EXISTS `pushEnabled` boolean NOT NULL DEFAULT false;
