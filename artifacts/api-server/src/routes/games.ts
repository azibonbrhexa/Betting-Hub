import { Router } from "express";
import { db, gamesTable, favoritesTable } from "@workspace/db";
import { eq, desc, ilike, and, sql } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import type { AuthPayload } from "../middlewares/auth";

const router = Router();

function formatGame(game: typeof gamesTable.$inferSelect, isFavorited = false) {
  return {
    id: game.id,
    name: game.name,
    slug: game.slug,
    category: game.category,
    provider: game.provider,
    thumbnail: game.thumbnail ?? null,
    rtp: parseFloat(game.rtp),
    isActive: game.isActive,
    isFeatured: game.isFeatured,
    isPopular: game.isPopular,
    maxWin: game.maxWin ? parseFloat(game.maxWin) : null,
    minBet: parseFloat(game.minBet),
    maxBet: parseFloat(game.maxBet),
    isFavorited,
    playCount: game.playCount,
  };
}

// GET /api/games
router.get("/", async (req, res) => {
  const q = req.query as Record<string, string | undefined>;
  const { page = "1", limit = "24", category, provider, search } = q;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [eq(gamesTable.isActive, true)];
  if (category) conditions.push(eq(gamesTable.category, category));
  if (provider) conditions.push(eq(gamesTable.provider, provider));
  if (search) conditions.push(ilike(gamesTable.name, `%${search}%`));

  const games = await db.select().from(gamesTable)
    .where(and(...conditions))
    .orderBy(desc(gamesTable.playCount))
    .limit(limitNum).offset(offset);

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(gamesTable)
    .where(and(...conditions));

  res.json({ data: games.map(g => formatGame(g)), total: Number(count), page: pageNum, limit: limitNum });
});

// GET /api/games/trending
router.get("/trending", async (req, res) => {
  const games = await db.select().from(gamesTable)
    .where(and(eq(gamesTable.isActive, true), eq(gamesTable.isPopular, true)))
    .orderBy(desc(gamesTable.playCount))
    .limit(12);
  res.json(games.map(g => formatGame(g)));
});

// GET /api/games/featured
router.get("/featured", async (req, res) => {
  const games = await db.select().from(gamesTable)
    .where(and(eq(gamesTable.isActive, true), eq(gamesTable.isFeatured, true)))
    .orderBy(desc(gamesTable.playCount))
    .limit(10);
  res.json(games.map(g => formatGame(g)));
});

// GET /api/games/categories
router.get("/categories", async (req, res) => {
  const results = await db.select({
    category: gamesTable.category,
    count: sql<number>`count(*)`,
  }).from(gamesTable).where(eq(gamesTable.isActive, true)).groupBy(gamesTable.category);

  const icons: Record<string, string> = {
    slots: "🎰", live_casino: "🃏", sports: "⚽", crash: "🚀",
    mines: "💣", dice: "🎲", plinko: "⬇️", limbo: "🎯",
    keno: "🔢", coin_flip: "🪙", lucky_wheel: "🎡", fishing: "🎣",
    cards: "🂡", blockchain: "⛓️",
  };

  const names: Record<string, string> = {
    slots: "Slots", live_casino: "Live Casino", sports: "Sports",
    crash: "Crash", mines: "Mines", dice: "Dice", plinko: "Plinko",
    limbo: "Limbo", keno: "Keno", coin_flip: "Coin Flip",
    lucky_wheel: "Lucky Wheel", fishing: "Fishing", cards: "Cards", blockchain: "Blockchain",
  };

  res.json(results.map(r => ({
    name: names[r.category] ?? r.category,
    slug: r.category,
    count: Number(r.count),
    icon: icons[r.category] ?? "🎮",
  })));
});

// GET /api/games/favorites
router.get("/favorites", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const favs = await db.select({ game: gamesTable })
    .from(favoritesTable)
    .innerJoin(gamesTable, eq(favoritesTable.gameId, gamesTable.id))
    .where(eq(favoritesTable.userId, userId));
  res.json(favs.map(f => formatGame(f.game, true)));
});

// GET /api/games/:id
router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, id)).limit(1);
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  res.json(formatGame(game));
});

// POST /api/games/:id/launch
router.post("/:id/launch", authenticate, async (req, res) => {
  const id = parseInt(String(req.params.id));
  const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, id)).limit(1);
  if (!game || !game.isActive) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  await db.update(gamesTable).set({ playCount: sql`play_count + 1` }).where(eq(gamesTable.id, id));
  res.json({ sessionId: `sess-${Date.now()}`, gameUrl: `/games/${game.slug}/play` });
});

// POST /api/games/:id/favorite
router.post("/:id/favorite", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const gameId = parseInt(String(req.params.id));

  const [existing] = await db.select().from(favoritesTable)
    .where(and(eq(favoritesTable.userId, userId), eq(favoritesTable.gameId, gameId))).limit(1);

  if (existing) {
    await db.delete(favoritesTable)
      .where(and(eq(favoritesTable.userId, userId), eq(favoritesTable.gameId, gameId)));
    res.json({ message: "Removed from favorites" });
  } else {
    await db.insert(favoritesTable).values({ userId, gameId });
    res.json({ message: "Added to favorites" });
  }
});

export default router;
