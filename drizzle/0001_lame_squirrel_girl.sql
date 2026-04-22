CREATE TABLE `backtests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`sportKey` varchar(32),
	`pickType` varchar(32),
	`minConfidence` int DEFAULT 0,
	`dateFrom` varchar(16) NOT NULL,
	`dateTo` varchar(16) NOT NULL,
	`totalPicks` int NOT NULL DEFAULT 0,
	`wins` int NOT NULL DEFAULT 0,
	`losses` int NOT NULL DEFAULT 0,
	`pushes` int NOT NULL DEFAULT 0,
	`winRate` decimal(5,2),
	`roi` decimal(8,2),
	`totalProfit` decimal(10,2),
	`results` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `backtests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(64),
	`sportKey` varchar(32) NOT NULL,
	`homeTeamId` int,
	`awayTeamId` int,
	`homeTeamName` varchar(128),
	`awayTeamName` varchar(128),
	`homeScore` int,
	`awayScore` int,
	`status` enum('scheduled','live','final','postponed','cancelled') NOT NULL DEFAULT 'scheduled',
	`gameTime` timestamp NOT NULL,
	`venue` varchar(128),
	`homeMoneyline` int,
	`awayMoneyline` int,
	`spread` decimal(4,1),
	`overUnder` decimal(5,1),
	`homeSpreadOdds` int,
	`awaySpreadOdds` int,
	`rawOddsData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `games_id` PRIMARY KEY(`id`),
	CONSTRAINT `games_externalId_unique` UNIQUE(`externalId`)
);
--> statement-breakpoint
CREATE TABLE `leaderboard` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(128),
	`totalBets` int NOT NULL DEFAULT 0,
	`wins` int NOT NULL DEFAULT 0,
	`losses` int NOT NULL DEFAULT 0,
	`winRate` decimal(5,2) DEFAULT '0',
	`roi` decimal(8,2) DEFAULT '0',
	`totalProfit` decimal(10,2) DEFAULT '0',
	`streak` int DEFAULT 0,
	`rank` int,
	`badge` varchar(32),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leaderboard_id` PRIMARY KEY(`id`),
	CONSTRAINT `leaderboard_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('daily_picks','subscription','performance','system') NOT NULL,
	`title` varchar(256) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pick_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sportKey` varchar(32) NOT NULL,
	`period` varchar(16) NOT NULL,
	`totalPicks` int NOT NULL DEFAULT 0,
	`wins` int NOT NULL DEFAULT 0,
	`losses` int NOT NULL DEFAULT 0,
	`pushes` int NOT NULL DEFAULT 0,
	`winRate` decimal(5,2),
	`roi` decimal(8,2),
	`avgConfidence` decimal(5,2),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pick_stats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `picks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameId` int,
	`sportKey` varchar(32) NOT NULL,
	`pickDate` varchar(16) NOT NULL,
	`pickType` enum('moneyline','spread','over_under','player_prop','parlay') NOT NULL,
	`tier` enum('free','premium') NOT NULL DEFAULT 'free',
	`homeTeam` varchar(128),
	`awayTeam` varchar(128),
	`recommendation` varchar(256) NOT NULL,
	`odds` int,
	`confidenceScore` int NOT NULL,
	`edgeScore` decimal(5,2),
	`aiAnalysis` text,
	`keyFactors` json,
	`result` enum('win','loss','push','pending') NOT NULL DEFAULT 'pending',
	`isActive` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `picks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `player_props` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameId` int,
	`playerId` int,
	`sportKey` varchar(32) NOT NULL,
	`pickDate` varchar(16) NOT NULL,
	`playerName` varchar(128) NOT NULL,
	`teamName` varchar(128),
	`propType` varchar(64) NOT NULL,
	`line` decimal(6,1) NOT NULL,
	`recommendation` enum('over','under') NOT NULL,
	`odds` int,
	`confidenceScore` int NOT NULL,
	`edgeScore` decimal(5,2),
	`aiAnalysis` text,
	`tier` enum('free','premium') NOT NULL DEFAULT 'free',
	`result` enum('win','loss','push','pending') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `player_props_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` varchar(64),
	`teamId` int,
	`sportKey` varchar(32) NOT NULL,
	`name` varchar(128) NOT NULL,
	`position` varchar(32),
	`jerseyNumber` varchar(8),
	`imageUrl` varchar(512),
	`status` enum('active','injured','questionable','out','inactive') DEFAULT 'active',
	`injuryNote` text,
	`stats` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(32) NOT NULL,
	`name` varchar(64) NOT NULL,
	`icon` varchar(16),
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `sports_id` PRIMARY KEY(`id`),
	CONSTRAINT `sports_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `subscription_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeSessionId` varchar(128),
	`stripeSubscriptionId` varchar(128),
	`tier` enum('daily','monthly','yearly') NOT NULL,
	`status` enum('pending','active','cancelled','expired') NOT NULL DEFAULT 'pending',
	`amountCents` int NOT NULL,
	`currency` varchar(8) NOT NULL DEFAULT 'usd',
	`startsAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscription_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sportKey` varchar(32) NOT NULL,
	`externalId` varchar(64),
	`name` varchar(128) NOT NULL,
	`abbreviation` varchar(16),
	`city` varchar(64),
	`logoUrl` varchar(512),
	`conference` varchar(64),
	`division` varchar(64),
	`wins` int DEFAULT 0,
	`losses` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_bets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`pickId` int,
	`sportKey` varchar(32) NOT NULL,
	`description` varchar(256) NOT NULL,
	`betType` enum('moneyline','spread','over_under','player_prop','parlay','other') NOT NULL,
	`stake` decimal(10,2) NOT NULL,
	`odds` int NOT NULL,
	`potentialPayout` decimal(10,2),
	`result` enum('win','loss','push','pending') NOT NULL DEFAULT 'pending',
	`profit` decimal(10,2) DEFAULT '0',
	`notes` text,
	`betDate` varchar(16) NOT NULL,
	`settledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_bets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeSubscriptionId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionTier` enum('free','daily','monthly','yearly') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `totalBets` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `winningBets` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `totalProfit` decimal(10,2) DEFAULT '0' NOT NULL;