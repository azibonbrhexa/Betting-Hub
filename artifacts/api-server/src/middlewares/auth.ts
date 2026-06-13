import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "betroyalsecret2024xK9mP";

export interface AuthPayload {
  userId: number;
  role: string;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as AuthPayload | undefined;
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

export function signTokens(userId: number, role: string) {
  const accessToken = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ userId, role, type: "refresh" }, JWT_SECRET, { expiresIn: "30d" });
  return { accessToken, refreshToken };
}

export function verifyRefreshToken(token: string): AuthPayload & { type?: string } {
  return jwt.verify(token, JWT_SECRET) as AuthPayload & { type?: string };
}
