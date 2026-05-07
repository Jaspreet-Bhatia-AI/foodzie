import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { requireRole } from "../middleware/role.middleware";
import { createPaymentOrder, handleWebhook } from "../controllers/payment.controller";

const router = Router();

// POST /api/payment/order — authenticated Students only
router.post("/order", authenticate, requireRole("Student"), createPaymentOrder);

// POST /api/payment/webhook — public (Razorpay calls this directly)
// Uses express.raw() here to preserve the raw body for HMAC signature verification.
// Note: express.json() is mounted globally, so we override it on this specific route.
router.post("/webhook", handleWebhook);

export default router;
