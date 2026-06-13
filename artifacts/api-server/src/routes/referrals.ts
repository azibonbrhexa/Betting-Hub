import { Router } from "express";
import { db, usersTable, transactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import type { AuthPayload } from "../middlewares/auth";

const router = Router();

// GET /api/referrals
router.get("/", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!me) { res.status(404).json({ error: "User not found" }); return; }

  const referred = await db.select().from(usersTable)
    .where(eq(usersTable.referredBy, userId));

  const baseUrl = process.env.APP_URL ?? "https://betroyalapp.replit.app";

  res.json({
    referralCode: me.referralCode,
    referralLink: `${baseUrl}?ref=${me.referralCode}`,
    totalReferrals: referred.length,
    referrals: referred.map(r => ({
      id: r.id,
      username: r.username,
      status: r.status,
      commission: 0,
      totalWagered: 0,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

// GET /api/referrals/summary
router.get("/summary", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const referred = await db.select().from(usersTable).where(eq(usersTable.referredBy, userId));

  const commissionTxs = await db.select().from(transactionsTable)
    .where(eq(transactionsTable.userId, userId));

  const commissionTxsFiltered = commissionTxs.filter(t => t.type === "referral");
  const totalEarned = commissionTxsFiltered.reduce((s, t) => s + parseFloat(t.amount), 0);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEarnings = commissionTxsFiltered
    .filter(t => t.createdAt >= startOfMonth)
    .reduce((s, t) => s + parseFloat(t.amount), 0);

  res.json({
    totalReferrals: referred.length,
    totalEarned,
    pendingEarnings: 0,
    thisMonthEarnings,
    commissionRate: 5,
  });
});

export default router;
