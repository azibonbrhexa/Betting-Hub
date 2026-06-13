import { Router } from "express";
import { db, usersTable, betsTable } from "@workspace/db";
import { sql, gte, eq } from "drizzle-orm";

const router = Router();

let jackpot = { main: 1250000, mini: 4200, major: 85000, grand: 9800000 };
let lastJackpotUpdate = Date.now();

function tickJackpot() {
  const elapsed = (Date.now() - lastJackpotUpdate) / 1000;
  jackpot.main = Math.min(jackpot.main + elapsed * 2.3, 9999999);
  jackpot.mini = Math.min(jackpot.mini + elapsed * 0.05, 9999);
  jackpot.major = Math.min(jackpot.major + elapsed * 0.8, 999999);
  jackpot.grand = Math.min(jackpot.grand + elapsed * 5.1, 99999999);
  lastJackpotUpdate = Date.now();
}

// GET /api/stats/platform
router.get("/platform", async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [{ userCount }] = await db.select({ userCount: sql<number>`count(*)` }).from(usersTable);
  const [{ betCount }] = await db.select({ betCount: sql<number>`count(*)` }).from(betsTable)
    .where(gte(betsTable.createdAt, today));

  const bigWinBets = await db.select({ payout: betsTable.payout }).from(betsTable)
    .where(gte(betsTable.createdAt, today))
    .orderBy(sql`payout desc`).limit(1);

  tickJackpot();

  res.json({
    onlineUsers: Math.floor(Number(userCount) * 0.3 + Math.random() * 50 + 100),
    totalBetsToday: Number(betCount),
    biggestWinToday: bigWinBets[0] ? parseFloat(bigWinBets[0].payout) : 0,
    jackpotAmount: Math.round(jackpot.main),
  });
});

// GET /api/stats/jackpot
router.get("/jackpot", (req, res) => {
  tickJackpot();
  res.json({
    main: Math.round(jackpot.main * 100) / 100,
    mini: Math.round(jackpot.mini * 100) / 100,
    major: Math.round(jackpot.major * 100) / 100,
    grand: Math.round(jackpot.grand * 100) / 100,
  });
});

export default router;
