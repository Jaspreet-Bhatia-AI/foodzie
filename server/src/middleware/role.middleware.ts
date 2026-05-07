import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "./auth.middleware";

type Role = JwtPayload["role"];

// ─── Role Guard Factory ───────────────────────────────────────────────────────
// Usage: router.use(requireRole("Vendor"))
//        router.delete("/:id", requireRole("Vendor", "Admin"), handler)
export function requireRole(...roles: Role[]) {
  return function (req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Required role(s): ${roles.join(", ")}`,
      });
      return;
    }

    next();
  };
}
