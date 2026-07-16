CREATE TABLE `newsletter_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`source` varchar(64) NOT NULL DEFAULT 'blog',
	`status` enum('active','unsubscribed') NOT NULL DEFAULT 'active',
	`welcomeSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newsletter_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletter_subscribers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `idx_newsletter_email` ON `newsletter_subscribers` (`email`);--> statement-breakpoint
CREATE INDEX `idx_newsletter_status` ON `newsletter_subscribers` (`status`);