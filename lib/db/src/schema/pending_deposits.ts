import { pgTable, serial, integer, text, timestamp, numeric } from "drizzle-orm/pg-core";

export const pendingDepositsTable = pgTable("pending_deposits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  method: text("method").notNull().default("bkash"),
  txId: text("tx_id").notNull(),
  senderNumber: text("sender_number"),
  status: text("status").notNull().default("pending"),
  adminNote: text("admin_note"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PendingDeposit = typeof pendingDepositsTable.$inferSelect;
