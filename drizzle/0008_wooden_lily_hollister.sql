ALTER TABLE `users` ADD `ageVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `experienceLevel` enum('brand_new','just_started','few_months','experienced_unprofitable','experienced_profitable','years_in');--> statement-breakpoint
ALTER TABLE `users` ADD `bettingFrequency` enum('occasionally','few_times_week','multiple_times_day');--> statement-breakpoint
ALTER TABLE `users` ADD `weeklyBetSize` enum('under_100','100_500','1000_5000','over_5000');--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingIntent` text;--> statement-breakpoint
ALTER TABLE `users` ADD `accessTier` enum('free','recreational','serious','professional') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `applicationStatus` enum('not_applied','pending','approved','rejected') DEFAULT 'not_applied' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `applicationReviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `applicationReviewedBy` int;--> statement-breakpoint
ALTER TABLE `users` ADD `onboardingCompletedAt` timestamp;