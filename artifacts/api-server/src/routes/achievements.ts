import { Router } from "express";
import { db, achievementsTable, userAchievementsTable, betsTable, walletsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import type { AuthPayload } from "../middlewares/auth";

const router = Router();

const DEFAULT_ACHIEVEMENTS = [
  { name: "প্রথম বেট", description: "প্রথম বেট দিন", icon: "🎲", category: "betting", requirement: 1, xpReward: 50, bonusReward: "10" },
  { name: "বেটার", description: "১০টি বেট দিন", icon: "🎯", category: "betting", requirement: 10, xpReward: 100, bonusReward: "25" },
  { name: "প্রো গেমার", description: "১০০টি বেট দিন", icon: "🏆", category: "betting", requirement: 100, xpReward: 500, bonusReward: "100" },
  { name: "প্রথম জয়", description: "প্রথম জয় পান", icon: "🥇", category: "winning", requirement: 1, xpReward: 75, bonusReward: "20" },
  { name: "লাকি স্ট্রিক", description: "৫বার জিতুন", icon: "🍀", category: "winning", requirement: 5, xpReward: 200, bonusReward: "50" },
  { name: "বিগ উইনার", description: "৳10,000 জিতুন", icon: "💰", category: "winning", requirement: 10000, xpReward: 1000, bonusReward: "500" },
  { name: "প্রথম ডিপোজিট", description: "প্রথম ডিপোজিট করুন", icon: "💳", category: "deposit", requirement: 1, xpReward: 100, bonusReward: "50" },
  { name: "হাই রোলার", description: "৳50,000 ডিপোজিট করুন", icon: "👑", category: "deposit", requirement: 50000, xpReward: 2000, bonusReward: "1000" },
  { name: "ক্র্যাশ মাস্টার", description: "Crash গেমে 10x জিতুন", icon: "🚀", category: "special", requirement: 10, xpReward: 300, bonusReward: "75" },
  { name: "মাইন সুইপার", description: "Mines গেমে জিতুন", icon: "💣", category: "special", requirement: 1, xpReward: 150, bonusReward: "30" },
];

router.get("/", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;

  let allAchievements = await db.select().from(achievementsTable).where(eq(achievementsTable.isActive, true));

  if (allAchievements.length === 0) {
    await db.insert(achievementsTable).values(DEFAULT_ACHIEVEMENTS.map(a => ({ ...a, isActive: true })));
    allAchievements = await db.select().from(achievementsTable).where(eq(achievementsTable.isActive, true));
  }

  const userAchievements = await db.select().from(userAchievementsTable)
    .where(eq(userAchievementsTable.userId, userId));

  const uaMap = new Map(userAchievements.map(ua => [ua.achievementId, ua]));

  const result = allAchievements.map(a => {
    const ua = uaMap.get(a.id);
    return {
      ...a,
      progress: ua?.progress ?? 0,
      completed: ua?.completed ?? false,
      completedAt: ua?.completedAt ?? null,
    };
  });

  res.json(result);
});

export default router;
