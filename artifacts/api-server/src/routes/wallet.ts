import { Router } from "express";
import { db, walletsTable, transactionsTable, pendingDepositsTable, notificationsTable, usersTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import type { AuthPayload } from "../middlewares/auth";

const router = Router();

const BKASH_MERCHANT = "+8801944265045";
const NAGAD_MERCHANT = "+8801944265045";
const ROCKET_MERCHANT = "+8801944265045";

function formatWallet(w: typeof walletsTable.$inferSelect) {
  return {
    id: w.id,
    userId: w.userId,
    balance: parseFloat(w.balance),
    bonusBalance: parseFloat(w.bonusBalance),
    currency: w.currency,
  };
}

function formatTx(t: typeof transactionsTable.$inferSelect) {
  return {
    id: t.id,
    userId: t.userId,
    type: t.type,
    amount: parseFloat(t.amount),
    status: t.status,
    method: t.method ?? null,
    reference: t.reference ?? null,
    createdAt: t.createdAt.toISOString(),
  };
}

// GET /api/wallet
router.get("/", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId)).limit(1);
  if (!wallet) {
    res.status(404).json({ error: "Wallet not found" });
    return;
  }
  res.json(formatWallet(wallet));
});

// GET /api/wallet/merchant-numbers
router.get("/merchant-numbers", authenticate, async (_req, res) => {
  res.json({
    bkash: BKASH_MERCHANT,
    nagad: NAGAD_MERCHANT,
    rocket: ROCKET_MERCHANT,
  });
});

// POST /api/wallet/deposit  (instant for card/crypto, pending for mobile banking)
router.post("/deposit", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const { amount, method, currency, txId, senderNumber } = req.body;
  if (!amount || amount <= 0) {
    res.status(400).json({ error: "Invalid amount" });
    return;
  }

  const mobileMethod = ["bkash", "nagad", "rocket"].includes(method);

  if (mobileMethod) {
    if (!txId || txId.trim().length < 4) {
      res.status(400).json({ error: "Transaction ID প্রয়োজন" });
      return;
    }
    const existing = await db.select().from(pendingDepositsTable)
      .where(and(eq(pendingDepositsTable.txId, txId.trim()), eq(pendingDepositsTable.method, method)));
    if (existing.length > 0) {
      res.status(400).json({ error: "এই Transaction ID আগেই ব্যবহার হয়েছে" });
      return;
    }

    const [pending] = await db.insert(pendingDepositsTable).values({
      userId,
      amount: String(amount),
      method,
      txId: txId.trim(),
      senderNumber: senderNumber ?? null,
      status: "pending",
    }).returning();

    await db.insert(notificationsTable).values({
      userId,
      title: "⏳ ডিপোজিট রিভিউতে আছে",
      message: `৳${amount} ${method.toUpperCase()} ডিপোজিট রিভিউ করা হচ্ছে। TxID: ${txId}`,
      type: "deposit",
    });

    res.status(201).json({ pending: true, id: pending.id, status: "pending", amount, method });
    return;
  }

  const [tx] = await db.insert(transactionsTable).values({
    userId,
    type: "deposit",
    amount: String(amount),
    status: "completed",
    method: method ?? "card",
    reference: `DEP-${Date.now()}`,
  }).returning();

  await db.update(walletsTable)
    .set({ balance: sql`balance + ${String(amount)}` })
    .where(eq(walletsTable.userId, userId));

  res.status(201).json(formatTx(tx));
});

// GET /api/wallet/pending-deposits
router.get("/pending-deposits", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const deposits = await db.select().from(pendingDepositsTable)
    .where(eq(pendingDepositsTable.userId, userId))
    .orderBy(desc(pendingDepositsTable.createdAt))
    .limit(20);
  res.json(deposits.map(d => ({ ...d, amount: parseFloat(d.amount) })));
});

// POST /api/wallet/withdraw
router.post("/withdraw", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const { amount, method, address } = req.body;
  if (!amount || amount <= 0) {
    res.status(400).json({ error: "Invalid amount" });
    return;
  }

  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId)).limit(1);
  if (!wallet || parseFloat(wallet.balance) < amount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  await db.update(walletsTable)
    .set({ balance: sql`balance - ${String(amount)}` })
    .where(eq(walletsTable.userId, userId));

  const [tx] = await db.insert(transactionsTable).values({
    userId,
    type: "withdrawal",
    amount: String(amount),
    status: "pending",
    method: method ?? "bkash",
    reference: `WTH-${Date.now()}`,
  }).returning();

  await db.insert(notificationsTable).values({
    userId,
    title: "💸 উইথড্র অনুরোধ পাওয়া গেছে",
    message: `৳${amount} ${(method ?? "bkash").toUpperCase()}-এ উইথড্র প্রসেস হচ্ছে।`,
    type: "withdrawal",
  });

  res.status(201).json(formatTx(tx));
});

// GET /api/wallet/transactions
router.get("/transactions", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const page = parseInt(String(req.query.page ?? "1"));
  const limit = parseInt(String(req.query.limit ?? "20"));
  const offset = (page - 1) * limit;

  const txs = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.userId, userId))
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limit).offset(offset);

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(transactionsTable)
    .where(eq(transactionsTable.userId, userId));

  res.json({ data: txs.map(formatTx), total: Number(count), page, limit });
});

// GET /api/wallet/summary
router.get("/summary", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const txs = await db.select().from(transactionsTable).where(eq(transactionsTable.userId, userId));

  let totalDeposited = 0, totalWithdrawn = 0, totalWagered = 0, totalWon = 0;
  for (const t of txs) {
    const amt = parseFloat(t.amount);
    if (t.type === "deposit" && t.status === "completed") totalDeposited += amt;
    if (t.type === "withdrawal" && t.status !== "cancelled") totalWithdrawn += amt;
    if (t.type === "bet") totalWagered += amt;
    if (t.type === "win") totalWon += amt;
  }

  res.json({
    totalDeposited,
    totalWithdrawn,
    totalWagered,
    totalWon,
    netProfitLoss: totalWon - totalWagered,
  });
});

export default router;
