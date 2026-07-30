CREATE TABLE `directory_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`url` varchar(512) NOT NULL,
	`tier` enum('tier1','tier2','tier3','tier4','reddit','guest_post') NOT NULL,
	`domainAuthority` int,
	`status` enum('not_started','in_progress','submitted','verified','rejected') NOT NULL DEFAULT 'not_started',
	`notes` text,
	`submittedAt` timestamp,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `directory_submissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `blog_posts` ADD `faqJsonLd` text;--> statement-breakpoint
CREATE INDEX `idx_dir_sub_status` ON `directory_submissions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_dir_sub_tier` ON `directory_submissions` (`tier`);