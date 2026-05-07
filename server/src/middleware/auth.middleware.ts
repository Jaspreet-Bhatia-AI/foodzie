import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// ─── Extend Express Request to carry the decoded user payload ─────────────────
export interface JwtPayload {
  sub: string;   // userId
  role: "Student" | "Vendor" | "Delivery";
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or malformed Authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ error: "Server misconfiguration: JWT_SECRET not set" });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
