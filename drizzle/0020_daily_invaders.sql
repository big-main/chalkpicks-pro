CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`keyHash` varchar(128) NOT NULL,
	`keyPrefix` varchar(16) NOT NULL,
	`name` varchar(64) NOT NULL DEFAULT 'Default',
	`tier` varchar(16) NOT NULL DEFAULT 'basic',
	`requestsToday` int NOT NULL DEFAULT 0,
	`requestsTotal` int NOT NULL DEFAULT 0,
	`lastUsedAt` timestamp,
	`revokedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_keyHash_unique` UNIQUE(`keyHash`)
);
--> statement-breakpoint
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_api_keys_user` ON `api_keys` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_api_keys_hash` ON `api_keys` (`keyHash`);