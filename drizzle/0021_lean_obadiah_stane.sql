CREATE TABLE `announcements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`body` text NOT NULL,
	`type` enum('info','warning','success','promo') NOT NULL DEFAULT 'info',
	`ctaText` varchar(64),
	`ctaUrl` varchar(512),
	`isActive` boolean NOT NULL DEFAULT true,
	`startsAt` timestamp NOT NULL DEFAULT (now()),
	`endsAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `announcements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('pick_result','line_movement','promo','system','broadcast') NOT NULL,
	`title` varchar(256) NOT NULL,
	`body` text NOT NULL,
	`pickId` int,
	`actionUrl` varchar(512),
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_alerts` ADD CONSTRAINT `user_alerts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_announcements_active` ON `announcements` (`isActive`);--> statement-breakpoint
CREATE INDEX `idx_user_alerts_user` ON `user_alerts` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_user_alerts_unread` ON `user_alerts` (`userId`,`isRead`);