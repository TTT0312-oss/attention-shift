CREATE TABLE `scores` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_name` text NOT NULL,
	`score` integer NOT NULL,
	`cleared` integer NOT NULL,
	`best_combo` integer NOT NULL,
	`mistakes` integer NOT NULL,
	`created_at` integer NOT NULL
);
