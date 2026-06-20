ALTER TABLE `user_bets` ADD `closingLineOdds` int;--> statement-breakpoint
ALTER TABLE `user_bets` ADD `closingLineTime` timestamp;--> statement-breakpoint
ALTER TABLE `user_bets` ADD `clvValue` decimal(5,2);--> statement-breakpoint
ALTER TABLE `user_bets` ADD `lineMovement` int;--> statement-breakpoint
ALTER TABLE `user_bets` ADD `sharpMoney` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `user_bets` ADD `bookmakerName` varchar(64);--> statement-breakpoint
ALTER TABLE `user_bets` ADD `betPlacedTime` timestamp;