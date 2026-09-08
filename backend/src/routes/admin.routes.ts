import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { getAllUsers, getAllOrders, getBrandSetting, updateBrandSetting, getAdminAnalytics, createUser, updateUser, deleteUser } from "../controllers/admin.controller";

const router = Router();

router.get("/users", authenticate, requireRole("Admin", "Super Admin"), getAllUsers);
router.post("/users", authenticate, requireRole("Admin", "Super Admin"), createUser);
router.patch("/users/:id", authenticate, requireRole("Admin", "Super Admin"), updateUser);
router.delete("/users/:id", authenticate, requireRole("Admin", "Super Admin"), deleteUser);
router.get("/orders", authenticate, requireRole("Admin", "Super Admin"), getAllOrders);
router.get("/analytics", authenticate, requireRole("Admin", "Super Admin"), getAdminAnalytics);

// Public route to check current active brand
router.get("/brand", getBrandSetting);

// Admin-only route to toggle brand identity
router.post("/brand", authenticate, requireRole("Admin", "Super Admin"), updateBrandSetting);

export default router;
