CREATE TABLE `email_drip_queue` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`sequence` enum('welcome') NOT NULL DEFAULT 'welcome',
	`step` int NOT NULL DEFAULT 1,
	`sendAt` timestamp NOT NULL,
	`sentAt` timestamp,
	`status` enum('pending','sent','failed','skipped') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_drip_queue_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `email_drip_queue` ADD CONSTRAINT `email_drip_queue_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_drip_user` ON `email_drip_queue` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_drip_status_send` ON `email_drip_queue` (`status`,`sendAt`);