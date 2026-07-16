CREATE TABLE `story_exports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`pickId` int,
	`sport` varchar(32) NOT NULL,
	`homeTeam` varchar(128) NOT NULL,
	`awayTeam` varchar(128) NOT NULL,
	`recommendation` varchar(256) NOT NULL,
	`odds` int,
	`confidenceScore` int NOT NULL,
	`pickType` varchar(64) NOT NULL,
	`aiAnalysis` text,
	`result` enum('win','loss','push','pending') NOT NULL DEFAULT 'pending',
	`s3Url` varchar(512),
	`s3Key` varchar(512),
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`postedToInstagram` boolean NOT NULL DEFAULT false,
	`postedAt` timestamp,
	`instagramPostId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `story_exports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_story_exports_user` ON `story_exports` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_story_exports_pick` ON `story_exports` (`pickId`);--> statement-breakpoint
CREATE INDEX `idx_story_exports_date` ON `story_exports` (`generatedAt`);