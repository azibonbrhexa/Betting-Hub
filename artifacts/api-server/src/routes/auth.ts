import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, walletsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { signTokens, verifyRefreshToken, authenticate } from "../middlewares/auth";
import { nanoid } from "../lib/nanoid";

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

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, referralCode } = req.body;
    if (!username || !email || !password) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already in use" });
      return;
    }

    const existingUsername = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    if (existingUsername.length > 0) {
      res.status(400).json({ error: "Username already taken" });
      return;
    }

    let referredBy: number | undefined;
    if (referralCode) {
      const referrer = await db.select().from(usersTable).where(eq(usersTable.referralCode, referralCode)).limit(1);
      if (referrer.length > 0) referredBy = referrer[0].id;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userReferralCode = nanoid(8).toUpperCase();

    const [user] = await db.insert(usersTable).values({
      username,
      email,
      passwordHash,
      referralCode: userReferralCode,
      referredBy: referredBy ?? null,
    }).returning();

    await db.insert(walletsTable).values({ userId: user.id });

    const { accessToken, refreshToken } = signTokens(user.id, user.role);
    res.status(201).json({ accessToken, refreshToken, user: formatUser(user) });
  } catch (err) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Missing credentials" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    if (user.status === "banned") {
      res.status(403).json({ error: "Account banned" });
      return;
    }

    const { accessToken, refreshToken } = signTokens(user.id, user.role);
    res.json({ accessToken, refreshToken, user: formatUser(user) });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/refresh
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: "Missing refresh token" });
      return;
    }
    const payload = verifyRefreshToken(refreshToken);
    if (payload.type !== "refresh") {
      res.status(401).json({ error: "Invalid token type" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    const tokens = signTokens(user.id, user.role);
    res.json({ ...tokens, user: formatUser(user) });
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

// POST /api/auth/logout
router.post("/logout", authenticate, (req, res) => {
  res.json({ message: "Logged out successfully" });
});

export default router;
