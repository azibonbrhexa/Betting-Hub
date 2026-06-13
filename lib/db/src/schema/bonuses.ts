import { pgTable, serial, text, numeric, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bonusesTable = pgTable("bonuses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  type: text("type").notNull(),
  value: numeric("value", { precision: 15, scale: 2 }).notNull(),
  valueType: text("value_type").notNull().default("percentage"),
  minDeposit: numeric("min_deposit", { precision: 15, scale: 2 }),
  maxBonus: numeric("max_bonus", { precision: 15, scale: 2 }),
  wagerRequirement: numeric("wager_requirement", { precision: 5, scale: 2 }).notNull().default("30"),
  expiresIn: integer("expires_in"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const userBonusesTable = pgTable("user_bonuses", {
  id: serial("id").primaryKey(),
  bonusId: integer("bonus_id").notNull(),
  userId: integer("user_id").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  wagerRequired: numeric("wager_required", { precision: 15, scale: 2 }).notNull(),
  wagerCompleted: numeric("wager_completed", { precision: 15, scale: 2 }).notNull().default("0"),
  status: text("status").notNull().default("active"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBonusSchema = createInsertSchema(bonusesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBonus = z.infer<typeof insertBonusSchema>;
export type Bonus = typeof bonusesTable.$inferSelect;

export const insertUserBonusSchema = createInsertSchema(userBonusesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserBonus = z.infer<typeof insertUserBonusSchema>;
export type UserBonus = typeof userBonusesTable.$inferSelect;
