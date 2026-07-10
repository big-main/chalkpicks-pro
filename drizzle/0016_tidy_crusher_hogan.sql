CREATE TABLE `blog_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`slug` varchar(256) NOT NULL,
	`excerpt` text,
	`content` text NOT NULL,
	`contentHtml` text,
	`heroImage` varchar(512),
	`seoDescription` varchar(160),
	`jsonLd` text,
	`source` enum('babylovegrowth','manual','ai-generated') NOT NULL DEFAULT 'babylovegrowth',
	`sourceArticleId` varchar(128),
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blog_posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blog_posts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `promo_codes` MODIFY COLUMN `tier` enum('daily','monthly','yearly','all') NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_blog_slug` ON `blog_posts` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_blog_status` ON `blog_posts` (`status`);--> statement-breakpoint
CREATE INDEX `idx_blog_published` ON `blog_posts` (`publishedAt`);--> statement-breakpoint
CREATE INDEX `idx_blog_source` ON `blog_posts` (`source`);