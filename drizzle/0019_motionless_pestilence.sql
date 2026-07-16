CREATE TABLE `odds_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventId` varchar(64) NOT NULL,
	`sportKey` varchar(32) NOT NULL,
	`homeTeam` varchar(128) NOT NULL,
	`awayTeam` varchar(128) NOT NULL,
	`commenceTime` timestamp NOT NULL,
	`bookmaker` varchar(64) NOT NULL,
	`marketKey` varchar(32) NOT NULL DEFAULT 'h2h',
	`outcomesJson` text NOT NULL,
	`snapshotAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `odds_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_snapshots_event_book` ON `odds_snapshots` (`eventId`,`bookmaker`,`marketKey`);--> statement-breakpoint
CREATE INDEX `idx_snapshots_sport_time` ON `odds_snapshots` (`sportKey`,`snapshotAt`);--> statement-breakpoint
CREATE INDEX `idx_snapshots_event_time` ON `odds_snapshots` (`eventId`,`snapshotAt`);