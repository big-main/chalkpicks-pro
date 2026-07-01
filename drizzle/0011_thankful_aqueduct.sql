CREATE INDEX `idx_games_sport_status` ON `games` (`sportKey`,`status`);--> statement-breakpoint
CREATE INDEX `idx_games_time` ON `games` (`gameTime`);--> statement-breakpoint
CREATE INDEX `idx_picks_date_active` ON `picks` (`pickDate`,`isActive`);--> statement-breakpoint
CREATE INDEX `idx_picks_sport` ON `picks` (`sportKey`);--> statement-breakpoint
CREATE INDEX `idx_picks_result` ON `picks` (`result`);--> statement-breakpoint
CREATE INDEX `idx_user_bets_userId` ON `user_bets` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_user_bets_result` ON `user_bets` (`userId`,`result`);