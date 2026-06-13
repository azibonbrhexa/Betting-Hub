import { Router } from "express";
import { db, dailyLoginsTable, walletsTable, transactionsTable, notificationsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import type { AuthPayload } from "../middlewares/auth";

const router = Router();

const STREAK_BONUSES = [50, 75, 100, 150, 200, 300, 500];

router.get("/status", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayLogin] = await db.select().from(dailyLoginsTable)
    .where(eq(dailyLoginsTable.userId, userId))
    .orderBy(desc(dailyLoginsTable.loginDate))
    .limit(1);

  const alreadyClaimed = todayLogin && todayLogin.loginDate >= today;
  let streakDay = 1;

  if (todayLogin) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (todayLogin.loginDate >= yesterday && todayLogin.loginDate < today) {
      streakDay = Math.min((todayLogin.streakDay ?? 0) + 1, 7);
    } else if (todayLogin.loginDate >= today) {
      streakDay = todayLogin.streakDay ?? 1;
    }
  }

  const bonusAmount = STREAK_BONUSES[Math.min(streakDay - 1, STREAK_BONUSES.length - 1)];

  res.json({
    canClaim: !alreadyClaimed,
    streakDay,
    bonusAmount,
    streakBonuses: STREAK_BONUSES,
  });
});

router.post("/claim", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayLogin] = await db.select().from(dailyLoginsTable)
    .where(eq(dailyLoginsTable.userId, userId))
    .orderBy(desc(dailyLoginsTable.loginDate))
    .limit(1);

  if (todayLogin && todayLogin.loginDate >= today) {
    res.status(400).json({ error: "আজকের বোনাস ইতিমধ্যে নেওয়া হয়েছে" });
    return;
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let streakDay = 1;
  if (todayLogin && todayLogin.loginDate >= yesterday) {
    streakDay = Math.min((todayLogin.streakDay ?? 0) + 1, 7);
  }

  const bonusAmount = STREAK_BONUSES[Math.min(streakDay - 1, STREAK_BONUSES.length - 1)];

  await db.insert(dailyLoginsTable).values({
    userId,
    streakDay,
    bonusClaimed: true,
    bonusAmount: String(bonusAmount),
  });

  await db.update(walletsTable)
    .set({ bonusBalance: sql`bonus_balance + ${String(bonusAmount)}` })
    .where(eq(walletsTable.userId, userId));

  await db.insert(transactionsTable).values({
    userId,
    type: "bonus",
    amount: String(bonusAmount),
    status: "completed",
    reference: `DAILY-${Date.now()}`,
  });

  await db.insert(notificationsTable).values({
    userId,
    title: "🎁 ডেইলি বোনাস পেয়েছেন!",
    message: `আপনার ${streakDay} দিনের streak বোনাস ৳${bonusAmount} পেয়েছেন!`,
    type: "bonus",
  });

  res.json({ ok: true, streakDay, bonusAmount });
});

export default router;
