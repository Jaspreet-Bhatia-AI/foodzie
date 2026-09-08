import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import {
  getAssignedOrders,
  updateDeliveryStatus,
  requestResignation,
  updateUpi,
  markOrderDelivered,
  pickOrder,
  updateLocation,
  submitCashDeposit,
  getCashDeposits,
  getDeliveryStats,
  getRiderLocation,
} from "../controllers/delivery.controller";

const router = Router();

// Require authentication first
router.use(authenticate);

// Accessible by any authenticated user (e.g. Student tracking a delivery)
router.get("/location/:riderId", getRiderLocation);

// Remaining routes require the Delivery role
router.use(requireRole("Delivery"));

// GET    /api/delivery/orders
router.get("/orders", getAssignedOrders);

// PATCH  /api/delivery/status
router.patch("/status", updateDeliveryStatus);

// POST   /api/delivery/resign
router.post("/resign", requestResignation);

// PATCH  /api/delivery/upi
router.patch("/upi", updateUpi);

// PATCH  /api/delivery/orders/:id/deliver
router.patch("/orders/:id/deliver", markOrderDelivered);

// PATCH  /api/delivery/orders/:id/pick
router.patch("/orders/:id/pick", pickOrder);

// PATCH  /api/delivery/location
router.patch("/location", updateLocation);

// POST   /api/delivery/deposit
router.post("/deposit", submitCashDeposit);

// GET    /api/delivery/deposits
router.get("/deposits", getCashDeposits);

// GET    /api/delivery/stats
router.get("/stats", getDeliveryStats);

export default router;
