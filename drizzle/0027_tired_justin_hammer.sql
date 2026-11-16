CREATE TABLE `live_odds_presets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`config` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `live_odds_presets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_live_odds_presets_user_updated` ON `live_odds_presets` (`userId`,`updatedAt`);