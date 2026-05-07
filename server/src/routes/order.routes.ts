import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { createOrder, getVendorOrders, updateOrderStatus, getCustomerOrders, getVendorStats, getVendorAnalytics } from "../controllers/order.controller";

const router = Router();

// Student routes
router.post("/", authenticate, requireRole("Student"), createOrder);
router.get("/customer", authenticate, requireRole("Student"), getCustomerOrders);

// Vendor routes
router.get("/vendor", authenticate, requireRole("Vendor"), getVendorOrders);
router.get("/vendor/stats", authenticate, requireRole("Vendor"), getVendorStats);
router.get("/vendor/analytics", authenticate, requireRole("Vendor"), getVendorAnalytics);
router.patch("/:id/status", authenticate, requireRole("Vendor"), updateOrderStatus);

export default router;
