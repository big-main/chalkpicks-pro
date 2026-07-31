CREATE TABLE `odds_api_cache_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cacheKey` varchar(512) NOT NULL,
	`data` json NOT NULL,
	`fetchedAt` timestamp NOT NULL,
	`ttlMs` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `odds_api_cache_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `odds_api_cache_entries_cacheKey_unique` UNIQUE(`cacheKey`)
);
--> statement-breakpoint
CREATE TABLE `odds_api_quota_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usedCount` int NOT NULL,
	`remainingCount` int NOT NULL,
	`recordedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `odds_api_quota_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_quota_recorded_at` ON `odds_api_quota_log` (`recordedAt`);