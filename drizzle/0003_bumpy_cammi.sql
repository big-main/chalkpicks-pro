CREATE TABLE `notification_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`channel` enum('email','sms','in_app') NOT NULL,
	`type` enum('login_alert','subscription_confirm','daily_picks','daily_digest','performance_summary','system') NOT NULL,
	`recipient` varchar(320),
	`subject` varchar(256),
	`status` enum('sent','failed','pending') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notification_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emailEnabled` boolean NOT NULL DEFAULT true,
	`emailDailyPicks` boolean NOT NULL DEFAULT true,
	`emailDailyDigest` boolean NOT NULL DEFAULT true,
	`emailSubscriptionConfirm` boolean NOT NULL DEFAULT true,
	`emailLoginAlert` boolean NOT NULL DEFAULT false,
	`emailPerformanceSummary` boolean NOT NULL DEFAULT true,
	`emailDigestTime` varchar(8) NOT NULL DEFAULT '08:00',
	`smsEnabled` boolean NOT NULL DEFAULT false,
	`smsPhone` varchar(32),
	`smsDailyPicks` boolean NOT NULL DEFAULT false,
	`smsDailyDigest` boolean NOT NULL DEFAULT false,
	`smsSubscriptionConfirm` boolean NOT NULL DEFAULT false,
	`smsLoginAlert` boolean NOT NULL DEFAULT false,
	`inAppEnabled` boolean NOT NULL DEFAULT true,
	`inAppDailyPicks` boolean NOT NULL DEFAULT true,
	`inAppPerformance` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_userId_unique` UNIQUE(`userId`)
);
