CREATE TABLE `story_scheduled` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`storyExportId` int,
	`sport` varchar(32) NOT NULL,
	`homeTeam` varchar(128) NOT NULL,
	`awayTeam` varchar(128) NOT NULL,
	`recommendation` varchar(256) NOT NULL,
	`confidenceScore` int NOT NULL,
	`pickType` varchar(64) NOT NULL,
	`aiAnalysis` text,
	`templateId` varchar(64) NOT NULL DEFAULT 'default',
	`scheduledTime` timestamp NOT NULL,
	`status` enum('pending','posted','failed','cancelled') NOT NULL DEFAULT 'pending',
	`postedAt` timestamp,
	`failureReason` text,
	`instagramPostId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `story_scheduled_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_story_scheduled_user` ON `story_scheduled` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_story_scheduled_time` ON `story_scheduled` (`scheduledTime`);--> statement-breakpoint
CREATE INDEX `idx_story_scheduled_status` ON `story_scheduled` (`status`);