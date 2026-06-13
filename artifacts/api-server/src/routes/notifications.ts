import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { authenticate } from "../middlewares/auth";
import type { AuthPayload } from "../middlewares/auth";

const router = Router();

router.get("/", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const limit = parseInt(String(req.query.limit ?? "20"));
  const notifications = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(limit);
  res.json(notifications);
});

router.patch("/:id/read", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  const id = parseInt(String(req.params.id));
  await db.update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));
  res.json({ ok: true });
});

router.post("/read-all", authenticate, async (req, res) => {
  const { userId } = (req as any).user as AuthPayload;
  await db.update(notificationsTable)
    .set({ read: true })
    .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.read, false)));
  res.json({ ok: true });
});

export default router;
