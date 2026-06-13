import { pgTable, serial, integer, timestamp, boolean, numeric } from "drizzle-orm/pg-core";

export const dailyLoginsTable = pgTable("daily_logins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  loginDate: timestamp("login_date", { withTimezone: true }).notNull().defaultNow(),
  streakDay: integer("streak_day").notNull().default(1),
  bonusClaimed: boolean("bonus_claimed").notNull().default(false),
  bonusAmount: numeric("bonus_amount", { precision: 10, scale: 2 }).notNull().default("0"),
});

export type DailyLogin = typeof dailyLoginsTable.$inferSelect;
