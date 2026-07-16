CREATE TABLE `odds_harvester_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sport` varchar(32) NOT NULL,
	`data` json NOT NULL,
	`scrapedAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `odds_harvester_cache_id` PRIMARY KEY(`id`),
	CONSTRAINT `odds_harvester_cache_sport_unique` UNIQUE(`sport`)
);
