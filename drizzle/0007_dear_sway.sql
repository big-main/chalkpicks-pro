CREATE TABLE `referral_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`discountPercentage` int NOT NULL DEFAULT 10,
	`maxRedemptions` int,
	`currentRedemptions` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referral_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `referral_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `referral_rewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referralId` int NOT NULL,
	`rewardType` enum('commission','bonus_credit','subscription_extension') NOT NULL,
	`rewardAmount` decimal(10,2) NOT NULL,
	`rewardValue` varchar(64),
	`status` enum('pending','earned','claimed') NOT NULL DEFAULT 'pending',
	`claimedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referral_rewards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrerId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`referralCodeId` int NOT NULL,
	`status` enum('pending','active','cancelled') NOT NULL DEFAULT 'pending',
	`discountApplied` decimal(10,2) DEFAULT '0',
	`commissionEarned` decimal(10,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
