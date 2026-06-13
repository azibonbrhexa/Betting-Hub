import { Router } from "express";
import { db, usersTable, walletsTable, transactionsTable, betsTable, bonusesTable, gamesTable } from "@workspace/db";
import { eq, desc, ilike, sql, gte, and } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/auth";
import type { AuthPayload } from "../middlewares/auth";

const router = Router();
router.use(authenticate, requireAdmin);

function formatAdminUser(u: typeof usersTable.$inferSelect, wallet?: typeof walletsTable.$inferSelect) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    status: u.status,
    balance: wallet ? parseFloat(wallet.balance) : 0,
    bonusBalance: wallet ? parseFloat(wallet.bonusBalance) : 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    totalBets: 0,
    kycStatus: u.kycStatus,
    vipLevel: u.vipLevel,
    createdAt: u.createdAt.toISOString(),
  };
}

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const [{ totalUsers }] = await db.select({ totalUsers: sql<number>`count(*)` }).from(usersTable);
  const [{ todayUsers }] = await db.select({ todayUsers: sql<number>`count(*)` }).from(usersTable)
    .where(gte(usersTable.createdAt, today));
  const [{ totalBets }] = await db.select({ totalBets: sql<number>`count(*)` }).from(betsTable);
  const [{ todayBets }] = await db.select({ todayBets: sql<number>`count(*)` }).from(betsTable)
    .where(gte(betsTable.createdAt, today));

  const txs = await db.select().from(transactionsTable);
  let totalDeposits = 0, totalWithdrawals = 0, todayDeposits = 0, todayWithdrawals = 0, totalBetAmount = 0, totalWinAmount = 0;
  for (const t of txs) {
    const amt = parseFloat(t.amount);
    if (t.type === "deposit" && t.status === "completed") {
      totalDeposits += amt;
      if (t.createdAt >= today) todayDeposits += amt;
    }
    if (t.type === "withdrawal" && t.status !== "cancelled") {
      totalWithdrawals += amt;
      if (t.createdAt >= today) todayWithdrawals += amt;
    }
    if (t.type === "bet") totalBetAmount += amt;
    if (t.type === "win") totalWinAmount += amt;
  }

  const revenue = totalDeposits - totalWithdrawals;
  const todayRevenue = todayDeposits - todayWithdrawals;

  res.json({
    totalUsers: Number(totalUsers),
    activeUsers: Math.floor(Number(totalUsers) * 0.6),
    totalDeposits,
    totalWithdrawals,
    totalBets: Number(totalBets),
    revenue,
    todayRevenue,
    todayBets: Number(todayBets),
    todayNewUsers: Number(todayUsers),
  });
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  const { page = "1", limit = "20", search, status } = req.query as Record<string, string>;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (search) conditions.push(ilike(usersTable.username, `%${search}%`));
  if (status) conditions.push(eq(usersTable.status, status));

  const users = await db.select().from(usersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(usersTable.createdAt))
    .limit(limitNum).offset(offset);

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(usersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const wallets = await db.select().from(walletsTable);
  const walletMap = new Map(wallets.map(w => [w.userId, w]));

  res.json({
    data: users.map(u => formatAdminUser(u, walletMap.get(u.id))),
    total: Number(count), page: pageNum, limit: limitNum,
  });
});

// GET /api/admin/users/:id
router.get("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, id)).limit(1);
  res.json(formatAdminUser(user, wallet));
});

// PATCH /api/admin/users/:id
router.patch("/users/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { status, role, vipLevel } = req.body;
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (status) updates.status = status;
  if (role) updates.role = role;
  if (vipLevel !== undefined) updates.vipLevel = vipLevel;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, id)).limit(1);
  res.json(formatAdminUser(user, wallet));
});

// POST /api/admin/users/:id/wallet
router.post("/users/:id/wallet", async (req, res) => {
  const id = parseInt(req.params.id);
  const { amount, type, reason } = req.body;
  if (!amount || !type) { res.status(400).json({ error: "Missing fields" }); return; }

  if (type === "credit") {
    await db.update(walletsTable).set({ balance: sql`balance + ${String(amount)}` }).where(eq(walletsTable.userId, id));
    await db.insert(transactionsTable).values({ userId: id, type: "deposit", amount: String(amount), status: "completed", reference: `ADM-${Date.now()}` });
  } else {
    await db.update(walletsTable).set({ balance: sql`balance - ${String(amount)}` }).where(eq(walletsTable.userId, id));
    await db.insert(transactionsTable).values({ userId: id, type: "withdrawal", amount: String(amount), status: "completed", reference: `ADM-${Date.now()}` });
  }

  const [wallet] = await db.select().from(walletsTable).where(eq(walletsTable.userId, id)).limit(1);
  res.json({ id: wallet.id, userId: wallet.userId, balance: parseFloat(wallet.balance), bonusBalance: parseFloat(wallet.bonusBalance), currency: wallet.currency });
});

// GET /api/admin/games
router.get("/games", async (req, res) => {
  const games = await db.select().from(gamesTable).orderBy(desc(gamesTable.playCount));
  res.json(games.map(g => ({
    id: g.id, name: g.name, slug: g.slug, category: g.category, provider: g.provider,
    thumbnail: g.thumbnail ?? null, rtp: parseFloat(g.rtp), isActive: g.isActive,
    isFeatured: g.isFeatured, isPopular: g.isPopular,
    maxWin: g.maxWin ? parseFloat(g.maxWin) : null,
    minBet: parseFloat(g.minBet), maxBet: parseFloat(g.maxBet),
    isFavorited: false, playCount: g.playCount,
  })));
});

// PATCH /api/admin/games/:id
router.patch("/games/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { isActive, isFeatured, isPopular, rtp, minBet, maxBet } = req.body;
  const updates: Partial<typeof gamesTable.$inferInsert> = {};
  if (isActive !== undefined) updates.isActive = isActive;
  if (isFeatured !== undefined) updates.isFeatured = isFeatured;
  if (isPopular !== undefined) updates.isPopular = isPopular;
  if (rtp !== undefined) updates.rtp = String(rtp);
  if (minBet !== undefined) updates.minBet = String(minBet);
  if (maxBet !== undefined) updates.maxBet = String(maxBet);

  const [game] = await db.update(gamesTable).set(updates).where(eq(gamesTable.id, id)).returning();
  if (!game) { res.status(404).json({ error: "Game not found" }); return; }
  res.json({ id: game.id, name: game.name, slug: game.slug, category: game.category, provider: game.provider, thumbnail: game.thumbnail ?? null, rtp: parseFloat(game.rtp), isActive: game.isActive, isFeatured: game.isFeatured, isPopular: game.isPopular, maxWin: game.maxWin ? parseFloat(game.maxWin) : null, minBet: parseFloat(game.minBet), maxBet: parseFloat(game.maxBet), isFavorited: false, playCount: game.playCount });
});

// GET /api/admin/bonuses
router.get("/bonuses", async (req, res) => {
  const bonuses = await db.select().from(bonusesTable);
  res.json(bonuses.map(b => ({
    id: b.id, name: b.name, description: b.description, type: b.type,
    value: parseFloat(b.value), valueType: b.valueType,
    minDeposit: b.minDeposit ? parseFloat(b.minDeposit) : null,
    maxBonus: b.maxBonus ? parseFloat(b.maxBonus) : null,
    wagerRequirement: parseFloat(b.wagerRequirement), expiresIn: b.expiresIn ?? null, isActive: b.isActive,
  })));
});

// POST /api/admin/bonuses
router.post("/bonuses", async (req, res) => {
  const { name, description, type, value, valueType, minDeposit, maxBonus, wagerRequirement, expiresIn, isActive } = req.body;
  const [bonus] = await db.insert(bonusesTable).values({
    name, description: description ?? "", type, value: String(value), valueType: valueType ?? "percentage",
    minDeposit: minDeposit ? String(minDeposit) : null,
    maxBonus: maxBonus ? String(maxBonus) : null,
    wagerRequirement: String(wagerRequirement ?? 30),
    expiresIn: expiresIn ?? null, isActive: isActive ?? true,
  }).returning();
  res.status(201).json({ id: bonus.id, name: bonus.name, description: bonus.description, type: bonus.type, value: parseFloat(bonus.value), valueType: bonus.valueType, minDeposit: null, maxBonus: null, wagerRequirement: parseFloat(bonus.wagerRequirement), expiresIn: null, isActive: bonus.isActive });
});

// GET /api/admin/transactions
router.get("/transactions", async (req, res) => {
  const page = parseInt(String(req.query.page ?? "1"));
  const limit = parseInt(String(req.query.limit ?? "20"));
  const offset = (page - 1) * limit;

  const txs = await db.select().from(transactionsTable)
    .orderBy(desc(transactionsTable.createdAt))
    .limit(limit).offset(offset);

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(transactionsTable);

  res.json({
    data: txs.map(t => ({
      id: t.id, userId: t.userId, type: t.type, amount: parseFloat(t.amount),
      status: t.status, method: t.method ?? null, reference: t.reference ?? null,
      createdAt: t.createdAt.toISOString(),
    })),
    total: Number(count), page, limit,
  });
});

// GET /api/admin/reports/daily
router.get("/reports/daily", async (req, res) => {
  const dateStr = String(req.query.date ?? new Date().toISOString().split("T")[0]);
  const date = new Date(dateStr);
  const next = new Date(date);
  next.setDate(next.getDate() + 1);

  const txs = await db.select().from(transactionsTable)
    .where(and(gte(transactionsTable.createdAt, date), sql`created_at < ${next.toISOString()}`));
  const newUsers = await db.select({ count: sql<number>`count(*)` }).from(usersTable)
    .where(and(gte(usersTable.createdAt, date), sql`created_at < ${next.toISOString()}`));
  const dayBets = await db.select({ count: sql<number>`count(*)` }).from(betsTable)
    .where(and(gte(betsTable.createdAt, date), sql`created_at < ${next.toISOString()}`));

  let deposits = 0, withdrawals = 0, totalWagered = 0;
  for (const t of txs) {
    const amt = parseFloat(t.amount);
    if (t.type === "deposit") deposits += amt;
    if (t.type === "withdrawal") withdrawals += amt;
    if (t.type === "bet") totalWagered += amt;
  }

  res.json({
    date: dateStr,
    newUsers: Number(newUsers[0].count),
    deposits,
    withdrawals,
    bets: Number(dayBets[0].count),
    totalWagered,
    revenue: deposits * 0.05,
    netRevenue: deposits * 0.05 - withdrawals * 0.01,
  });
});

export default router;
