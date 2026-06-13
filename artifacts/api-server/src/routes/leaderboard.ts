import { Router } from "express";
import { db, betsTable, usersTable, walletsTable } from "@workspace/db";
import { eq, desc, sql, gte, and } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const period = String(req.query.period ?? "all");
  const limit = parseInt(String(req.query.limit ?? "20"));

  let dateFilter = undefined;
  if (period === "daily") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateFilter = gte(betsTable.createdAt, today);
  } else if (period === "weekly") {
    const week = new Date();
    week.setDate(week.getDate() - 7);
    dateFilter = gte(betsTable.createdAt, week);
  } else if (period === "monthly") {
    const month = new Date();
    month.setDate(1);
    month.setHours(0, 0, 0, 0);
    dateFilter = gte(betsTable.createdAt, month);
  }

  const where = dateFilter
    ? and(eq(betsTable.status, "won"), dateFilter)
    : eq(betsTable.status, "won");

  const rows = await db
    .select({
      userId: betsTable.userId,
      totalWon: sql<number>`cast(sum(cast(${betsTable.payout} as numeric)) as float)`,
      totalBets: sql<number>`cast(count(*) as int)`,
      biggestWin: sql<number>`cast(max(cast(${betsTable.payout} as numeric)) as float)`,
    })
    .from(betsTable)
    .where(where)
    .groupBy(betsTable.userId)
    .orderBy(desc(sql`sum(cast(${betsTable.payout} as numeric))`))
    .limit(limit);

  const userIds = rows.map(r => r.userId);
  if (userIds.length === 0) {
    res.json([]);
    return;
  }

  const users = await db.select({ id: usersTable.id, username: usersTable.username, vipLevel: usersTable.vipLevel, avatar: usersTable.avatar })
    .from(usersTable)
    .where(sql`${usersTable.id} = ANY(${userIds})`);

  const userMap = new Map(users.map(u => [u.id, u]));

  const result = rows.map((r, i) => {
    const u = userMap.get(r.userId);
    return {
      rank: i + 1,
      userId: r.userId,
      username: u?.username ?? "Player",
      avatar: u?.avatar ?? null,
      vipLevel: u?.vipLevel ?? 0,
      totalWon: r.totalWon ?? 0,
      totalBets: r.totalBets ?? 0,
      biggestWin: r.biggestWin ?? 0,
    };
  });

  res.json(result);
});

export default router;
