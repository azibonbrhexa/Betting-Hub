import { Router } from "express";
import { db, betsTable, gamesTable, walletsTable, transactionsTable, usersTable } from "@workspace/db";
import { eq, desc, sql, ne } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import type { AuthPayload } from "../middlewares/auth";

const router = Router();

function formatBet(bet: typeof betsTable.$inferSelect, gameName?: string) {
  return {
    id: bet.id,
    userId: bet.userId,
    gameId: bet.gameId,
    gameName: gameName ?? "Unknown",
    amount: parseFloat(bet.amount),
    payout: parseFloat(bet.payout),
    multiplier: bet.multiplier ? parseFloat(bet.multiplier) : null,
    status: bet.status,
    gameData: bet.gameData ? JSON.parse(bet.gameData) : {},
    createdAt: bet.createdAt.toISOString(),
  };
}

// ----- Game-specific result calculators -----

function calcCrashResult(rtp: number, gd: Record<string, any>) {
  const cashoutAt = parseFloat(gd.cashoutAt ?? "0");
  const crashPoint = parseFloat(gd.crashPoint ?? "1");
  if (gd.crashed) return { won: false, multiplier: 0, payout: 0, resultData: { crashed: true } };
  const won = cashoutAt <= crashPoint && cashoutAt > 1;
  return { won, multiplier: won ? cashoutAt : 0, payout: 0, resultData: { cashoutAt, crashPoint } };
}

function calcMinesResult(amount: number, gd: Record<string, any>) {
  const minesCount = parseInt(gd.minesCount ?? "3");
  const revealed = parseInt(gd.revealed ?? "0");
  if (gd.hitMine || !gd.cashout) return { won: false, multiplier: 0, payout: 0, resultData: { hitMine: true } };
  let mult = 1;
  for (let i = 0; i < revealed; i++) {
    const safeLeft = 25 - minesCount - i;
    const tilesLeft = 25 - i;
    mult *= (tilesLeft / safeLeft);
  }
  mult = parseFloat((mult * 0.97).toFixed(4));
  return { won: true, multiplier: mult, payout: amount * mult, resultData: { revealed, minesCount } };
}

function calcDiceResult(amount: number, rtp: number, gd: Record<string, any>) {
  const target = parseInt(gd.target ?? "50");
  const over = gd.over !== false;
  const roll = Math.floor(Math.random() * 100) + 1;
  const won = over ? roll > target : roll < target;
  const winChance = over ? (100 - target) / 100 : target / 100;
  const multiplier = parseFloat((0.99 / winChance).toFixed(4));
  return { won, multiplier: won ? multiplier : 0, payout: won ? amount * multiplier : 0, resultData: { roll, target, over } };
}

function calcCoinFlipResult(amount: number, gd: Record<string, any>) {
  const choice = gd.choice ?? "heads";
  const result = Math.random() < 0.5 ? "heads" : "tails";
  const won = result === choice;
  return { won, multiplier: won ? 1.98 : 0, payout: won ? amount * 1.98 : 0, resultData: { result, choice } };
}

function calcLimboResult(amount: number, gd: Record<string, any>) {
  const target = parseFloat(gd.target ?? "2");
  const winChance = Math.min(0.99, 1 / target);
  const won = Math.random() < winChance * 0.99;
  const result = won ? target * (1 + Math.random() * 0.5) : target * (0.3 + Math.random() * 0.6);
  return { won, multiplier: won ? target : 0, payout: won ? amount * target : 0, resultData: { result: parseFloat(result.toFixed(2)), target } };
}

function calcPlinkoResult(amount: number, gd: Record<string, any>) {
  const risk = (gd.risk ?? "medium") as "low" | "medium" | "high";
  const mults: Record<string, number[]> = {
    low: [5.6, 2.1, 1.1, 1.0, 0.5, 1.0, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
  };
  const slot = parseInt(gd.slot ?? "4");
  const multiplier = mults[risk][slot] ?? 1;
  const won = multiplier >= 1;
  return { won, multiplier, payout: amount * multiplier, resultData: { slot, risk, multiplier } };
}

function calcLuckyWheelResult(amount: number, gd: Record<string, any>) {
  const mults = [0, 1.5, 0, 2, 0, 1.2, 0, 5, 0, 1.5, 0, 10, 0, 1.2, 0, 3];
  const pos = Math.floor(Math.random() * mults.length);
  const multiplier = mults[pos];
  const won = multiplier > 0;
  return { won, multiplier: won ? multiplier : 0, payout: won ? amount * multiplier : 0, resultData: { position: pos, multiplier } };
}

function calcSlotsResult(amount: number, rtp: number) {
  const r = Math.random();
  const payoutTable = [
    { mult: 20, prob: 0.005 }, { mult: 10, prob: 0.01 }, { mult: 5, prob: 0.02 },
    { mult: 3, prob: 0.04 }, { mult: 2, prob: 0.06 }, { mult: 1.5, prob: 0.10 },
  ];
  let cumulative = 0;
  for (const p of payoutTable) {
    cumulative += p.prob;
    if (r < cumulative) return { won: true, multiplier: p.mult, payout: amount * p.mult, resultData: {} };
  }
  return { won: false, multiplier: 0, payout: 0, resultData: {} };
}

function calcGenericResult(amount: number, rtp: number) {
  const win = Math.random() < (rtp / 100) * 0.5;
  const multiplier = win ? parseFloat((Math.random() * 4 + 1.2).toFixed(4)) : 0;
  return { won: win, multiplier, payout: win ? amount * multiplier : 0, resultData: {} };
}

// ----- Routes -----

// POST /api/bets
router.post("/", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const { gameId, amount, gameData } = req.body as { gameId: number; amount: number; gameData: Record<string, any> };

  if (!gameId || !amount || amount < 0.01) {
    res.status(400).json({ error: "Invalid bet parameters" });
    return;
  }

  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, userId)).limit(1);
  if (!wallet || parseFloat(wallet.balance) < amount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, gameId)).limit(1);
  if (!game || !game.isActive) {
    res.status(404).json({ error: "Game not found or inactive" });
    return;
  }

  const rtp = parseFloat(game.rtp);
  const gd = gameData ?? {};
  const type = gd.type ?? game.category;

  let calc: { won: boolean; multiplier: number; payout: number; resultData: Record<string, any> };

  switch (type) {
    case "crash":    calc = calcCrashResult(rtp, gd); break;
    case "mines":    calc = calcMinesResult(amount, gd); break;
    case "dice":     calc = calcDiceResult(amount, rtp, gd); break;
    case "coin_flip": calc = calcCoinFlipResult(amount, gd); break;
    case "limbo":    calc = calcLimboResult(amount, gd); break;
    case "plinko":   calc = calcPlinkoResult(amount, gd); break;
    case "lucky_wheel": calc = calcLuckyWheelResult(amount, gd); break;
    case "slots":    calc = calcSlotsResult(amount, rtp); break;
    default:         calc = calcGenericResult(amount, rtp);
  }

  const { won, multiplier, payout, resultData } = calc;
  const status = won ? "won" : "lost";

  await db.update(walletsTable)
    .set({ balance: sql`balance - ${String(amount)}` })
    .where(eq(walletsTable.userId, userId));

  await db.insert(transactionsTable).values({
    userId, type: "bet", amount: String(amount), status: "completed",
  });

  if (won && payout > 0) {
    await db.update(walletsTable)
      .set({ balance: sql`balance + ${String(payout)}` })
      .where(eq(walletsTable.userId, userId));
    await db.insert(transactionsTable).values({
      userId, type: "win", amount: String(payout), status: "completed",
    });
  }

  const [bet] = await db.insert(betsTable).values({
    userId, gameId,
    amount: String(amount),
    payout: String(payout),
    multiplier: multiplier ? String(multiplier) : null,
    status,
    gameData: JSON.stringify({ ...gd, ...resultData }),
  }).returning();

  await db.update(gamesTable).set({ playCount: sql`play_count + 1` }).where(eq(gamesTable.id, gameId));

  res.status(201).json({
    ...formatBet(bet, game.name),
    gameData: { ...gd, ...resultData },
  });
});

// GET /api/bets
router.get("/", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const page = parseInt(String(req.query.page ?? "1"));
  const limit = parseInt(String(req.query.limit ?? "20"));
  const offset = (page - 1) * limit;

  const bets = await db.select({ bet: betsTable, gameName: gamesTable.name })
    .from(betsTable)
    .leftJoin(gamesTable, eq(betsTable.gameId, gamesTable.id))
    .where(eq(betsTable.userId, userId))
    .orderBy(desc(betsTable.createdAt))
    .limit(limit).offset(offset);

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(betsTable)
    .where(eq(betsTable.userId, userId));

  res.json({
    data: bets.map(b => formatBet(b.bet, b.gameName ?? "Unknown")),
    total: Number(count), page, limit,
  });
});

// GET /api/bets/recent
router.get("/recent", async (req, res) => {
  const bets = await db.select({
    bet: betsTable,
    gameName: gamesTable.name,
    username: usersTable.username,
    avatar: usersTable.avatar,
  })
    .from(betsTable)
    .leftJoin(gamesTable, eq(betsTable.gameId, gamesTable.id))
    .leftJoin(usersTable, eq(betsTable.userId, usersTable.id))
    .where(ne(betsTable.status, "pending"))
    .orderBy(desc(betsTable.createdAt))
    .limit(30);

  res.json(bets.map(b => ({
    id: b.bet.id,
    username: b.username ?? "Anonymous",
    avatar: b.avatar ?? null,
    gameName: b.gameName ?? "Unknown",
    amount: parseFloat(b.bet.amount),
    payout: parseFloat(b.bet.payout),
    multiplier: b.bet.multiplier ? parseFloat(b.bet.multiplier) : 0,
    status: b.bet.status,
    createdAt: b.bet.createdAt.toISOString(),
  })));
});

// GET /api/bets/stats
router.get("/stats", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const bets = await db.select().from(betsTable).where(eq(betsTable.userId, userId));

  let totalWagered = 0, totalWon = 0, biggestWin = 0, wonCount = 0;
  for (const b of bets) {
    totalWagered += parseFloat(b.amount);
    if (b.status === "won") {
      wonCount++;
      const payout = parseFloat(b.payout);
      totalWon += payout;
      if (payout > biggestWin) biggestWin = payout;
    }
  }

  res.json({
    totalBets: bets.length,
    totalWagered,
    totalWon,
    biggestWin,
    winRate: bets.length > 0 ? (wonCount / bets.length) * 100 : 0,
  });
});

export default router;
