import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import type { AuthPayload } from "../middlewares/auth";

const router = Router();

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    avatar: user.avatar ?? null,
    kycStatus: user.kycStatus,
    vipLevel: user.vipLevel,
    referralCode: user.referralCode,
    createdAt: user.createdAt.toISOString(),
  };
}

// GET /api/users/me
router.get("/me", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

// PATCH /api/users/me
router.patch("/me", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const { username, avatar } = req.body;
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (username) updates.username = username;
  if (avatar !== undefined) updates.avatar = avatar;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

// POST /api/users/me/kyc
router.post("/me/kyc", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  await db.update(usersTable).set({ kycStatus: "pending" }).where(eq(usersTable.id, userId));
  res.json({ status: "pending", message: "KYC documents submitted successfully. Review takes 1-3 business days." });
});

// POST /api/users/me/change-password
router.post("/me/change-password", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Missing passwords" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    res.status(400).json({ error: "Current password is incorrect" });
    return;
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, userId));
  res.json({ message: "Password changed successfully" });
});

// GET /api/users/me/notifications
router.get("/me/notifications", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(20);
  res.json(notifications.map(n => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  })));
});

export default router;
