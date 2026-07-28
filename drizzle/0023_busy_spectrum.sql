ALTER TABLE `picks` ADD `twitterResultPosted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `displayName` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `favoriteSports` text;--> statement-breakpoint
ALTER TABLE `users` ADD `profileTheme` enum('dark','neon','stealth','fire') DEFAULT 'dark';--> statement-breakpoint
ALTER TABLE `users` ADD `isPublicProfile` boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_picks_twitter_posted` ON `picks` (`twitterResultPosted`);