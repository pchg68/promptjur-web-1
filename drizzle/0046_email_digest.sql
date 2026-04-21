ALTER TABLE `notification_preferences` ADD COLUMN IF NOT EXISTS `emailDigest` enum('imediato','diario','nunca') NOT NULL DEFAULT 'imediato';
