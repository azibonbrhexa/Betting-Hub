import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const betsTable = pgTable("bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  gameId: integer("game_id").notNull(),
  amount: numeric("amount", { precision: 20, scale: 8 }).notNull(),
  payout: numeric("payout", { precision: 20, scale: 8 }).notNull().default("0"),
  multiplier: numeric("multiplier", { precision: 10, scale: 4 }),
  status: text("status").notNull().default("pending"),
  gameData: text("game_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBetSchema = createInsertSchema(betsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBet = z.infer<typeof insertBetSchema>;
export type Bet = typeof betsTable.$inferSelect;
