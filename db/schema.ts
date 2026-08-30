import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const scores = sqliteTable("scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  playerName: text("player_name").notNull(),
  score: integer("score").notNull(),
  cleared: integer("cleared").notNull(),
  bestCombo: integer("best_combo").notNull(),
  mistakes: integer("mistakes").notNull(),
  createdAt: integer("created_at").notNull(),
});
