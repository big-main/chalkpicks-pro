CREATE TABLE `pick_organizer_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(120) NOT NULL,
	`kind` enum('pick','parlay','trade') NOT NULL,
	`status` enum('draft','ready','archived') NOT NULL DEFAULT 'draft',
	`sport` varchar(32) NOT NULL,
	`eventAt` timestamp,
	`stake` decimal(12,2) NOT NULL,
	`notes` text NOT NULL,
	`legs` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pick_organizer_plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_organizer_user_updated` ON `pick_organizer_plans` (`userId`,`updatedAt`);