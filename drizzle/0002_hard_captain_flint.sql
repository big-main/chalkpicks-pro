CREATE TABLE `pick_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pickId` int NOT NULL,
	`userId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`sentiment` enum('positive','neutral','negative') NOT NULL DEFAULT 'neutral',
	`wasHelpful` boolean,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pick_feedback_id` PRIMARY KEY(`id`)
);
