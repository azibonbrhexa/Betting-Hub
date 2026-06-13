import { Router } from "express";
import { db, bonusesTable, userBonusesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import type { AuthPayload } from "../middlewares/auth";

const router = Router();

function formatBonus(b: typeof bonusesTable.$inferSelect) {
  return {
    id: b.id,
    name: b.name,
    description: b.description,
    type: b.type,
    value: parseFloat(b.value),
    valueType: b.valueType,
    minDeposit: b.minDeposit ? parseFloat(b.minDeposit) : null,
    maxBonus: b.maxBonus ? parseFloat(b.maxBonus) : null,
    wagerRequirement: parseFloat(b.wagerRequirement),
    expiresIn: b.expiresIn ?? null,
    isActive: b.isActive,
  };
}

function formatUserBonus(ub: typeof userBonusesTable.$inferSelect, bonus?: typeof bonusesTable.$inferSelect) {
  return {
    id: ub.id,
    bonusId: ub.bonusId,
    userId: ub.userId,
    bonus: bonus ? formatBonus(bonus) : undefined,
    amount: parseFloat(ub.amount),
    wagerRequired: parseFloat(ub.wagerRequired),
    wagerCompleted: parseFloat(ub.wagerCompleted),
    status: ub.status,
    expiresAt: ub.expiresAt ? ub.expiresAt.toISOString() : null,
    createdAt: ub.createdAt.toISOString(),
  };
}

// GET /api/bonuses
router.get("/", async (req, res) => {
  const bonuses = await db.select().from(bonusesTable).where(eq(bonusesTable.isActive, true));
  res.json(bonuses.map(formatBonus));
});

// GET /api/bonuses/active
router.get("/active", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const userBonuses = await db.select({ ub: userBonusesTable, bonus: bonusesTable })
    .from(userBonusesTable)
    .leftJoin(bonusesTable, eq(userBonusesTable.bonusId, bonusesTable.id))
    .where(and(eq(userBonusesTable.userId, userId), eq(userBonusesTable.status, "active")));
  res.json(userBonuses.map(r => formatUserBonus(r.ub, r.bonus ?? undefined)));
});

// POST /api/bonuses/:id/claim
router.post("/:id/claim", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const bonusId = parseInt(String(req.params.id));

  const [bonus] = await db.select().from(bonusesTable)
    .where(and(eq(bonusesTable.id, bonusId), eq(bonusesTable.isActive, true))).limit(1);
  if (!bonus) {
    res.status(404).json({ error: "Bonus not found" });
    return;
  }

  const existing = await db.select().from(userBonusesTable)
    .where(and(eq(userBonusesTable.userId, userId), eq(userBonusesTable.bonusId, bonusId), eq(userBonusesTable.status as any, "active")));
  if (existing.length > 0) {
    res.status(400).json({ error: "Bonus already claimed" });
    return;
  }

  const amount = parseFloat(bonus.value);
  const wagerRequired = amount * parseFloat(bonus.wagerRequirement);
  const expiresAt = bonus.expiresIn ? new Date(Date.now() + bonus.expiresIn * 24 * 60 * 60 * 1000) : null;

  const [ub] = await db.insert(userBonusesTable).values({
    bonusId, userId,
    amount: String(amount),
    wagerRequired: String(wagerRequired),
    expiresAt: expiresAt ?? undefined,
  }).returning();

  res.json(formatUserBonus(ub, bonus));
});

export default router;
