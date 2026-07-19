CREATE TABLE `user_pick_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`pickId` int NOT NULL,
	`notes` text,
	`addedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_pick_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `user_pick_tracking` ADD CONSTRAINT `user_pick_tracking_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_pick_tracking` ADD CONSTRAINT `user_pick_tracking_pickId_picks_id_fk` FOREIGN KEY (`pickId`) REFERENCES `picks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_tracking_user` ON `user_pick_tracking` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_tracking_pick` ON `user_pick_tracking` (`pickId`);--> statement-breakpoint
CREATE INDEX `idx_tracking_user_pick` ON `user_pick_tracking` (`userId`,`pickId`);