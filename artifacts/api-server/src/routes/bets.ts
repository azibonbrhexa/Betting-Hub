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

// POST /api/bets
router.post("/", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const { gameId, amount, gameData } = req.body;

  if (!gameId || !amount || amount < 0.1) {
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

  // Simulate game result
  const rtp = parseFloat(game.rtp) / 100;
  const win = Math.random() < rtp * 0.45;
  const multiplier = win ? (Math.random() * 4 + 1.2) : 0;
  const payout = win ? amount * multiplier : 0;
  const status = win ? "won" : "lost";

  // Deduct bet
  await db.update(walletsTable)
    .set({ balance: sql`balance - ${String(amount)}` })
    .where(eq(walletsTable.userId, userId));

  // Record bet transaction
  await db.insert(transactionsTable).values({
    userId, type: "bet", amount: String(amount), status: "completed",
  });

  // If won, add payout
  if (win && payout > 0) {
    await db.update(walletsTable)
      .set({ balance: sql`balance + ${String(payout)}` })
      .where(eq(walletsTable.userId, userId));
    await db.insert(transactionsTable).values({
      userId, type: "win", amount: String(payout), status: "completed",
    });
  }

  const [bet] = await db.insert(betsTable).values({
    userId,
    gameId,
    amount: String(amount),
    payout: String(payout),
    multiplier: multiplier ? String(multiplier.toFixed(4)) : null,
    status,
    gameData: JSON.stringify(gameData ?? {}),
  }).returning();

  res.status(201).json(formatBet(bet, game.name));
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
