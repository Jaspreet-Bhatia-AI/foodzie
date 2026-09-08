import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { 
  createOrder, 
  getVendorOrders, 
  updateOrderStatus, delayOrder, 
  getCustomerOrders, 
  getVendorStats, 
  getVendorAnalytics,
  awardTopCustomers,
  getOrderReceiptHTML,
  deliverOrderByQR,
  addFoodItemReview
} from "../controllers/order.controller";

const router = Router();

// Student routes
router.post("/", authenticate, requireRole("Student"), createOrder);
router.get("/customer", authenticate, requireRole("Student"), getCustomerOrders);
router.post("/review", authenticate, requireRole("Student"), addFoodItemReview);

// Public route for printed/scanned PDF receipt (web-based print format)
router.get("/:id/receipt", getOrderReceiptHTML);

// Vendor routes
router.get("/vendor", authenticate, requireRole("Vendor"), getVendorOrders);
router.get("/vendor/stats", authenticate, requireRole("Vendor"), getVendorStats);
router.get("/vendor/analytics", authenticate, requireRole("Vendor"), getVendorAnalytics);
router.post("/vendor/analytics/award", authenticate, requireRole("Vendor"), awardTopCustomers);
router.patch("/:id/status", authenticate, requireRole("Vendor"), updateOrderStatus);
router.patch("/:id/deliver-by-qr", authenticate, requireRole("Vendor"), deliverOrderByQR);

export default router;
