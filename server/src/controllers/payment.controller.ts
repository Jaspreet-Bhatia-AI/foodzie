import { Request, Response } from "express";
import crypto from "crypto";
import { razorpay } from "../lib/razorpay";
import { prisma } from "../lib/prisma";
import { getIO } from "../lib/socket";

// ─── POST /api/payment/order ──────────────────────────────────────────────────
// Creates a Razorpay order for a given Foodzie Order ID.
// The client receives the Razorpay order details and uses them to open the payment modal.
export async function createPaymentOrder(req: Request, res: Response): Promise<void> {
  const { foodzieOrderId } = req.body;

  if (!foodzieOrderId) {
    res.status(400).json({ error: "foodzieOrderId is required" });
    return;
  }

  // Fetch the Foodzie order to get the amount
  const order = await prisma.order.findUnique({
    where: { id: foodzieOrderId },
    select: { id: true, totalAmount: true, customerId: true },
  });

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Verify the order belongs to the requesting user
  if (order.customerId !== req.user!.sub) {
    res.status(403).json({ error: "You do not own this order" });
    return;
  }

  // Razorpay amounts are in the smallest currency unit (paise for INR)
  const amountInPaise = Math.round(order.totalAmount * 100);

  // ── Razorpay Order Creation ───────────────────────────────────────────────
  // NOTE: This is a scaffolded integration. Replace with full error handling
  // and webhook verification before going to production.
  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: foodzieOrderId,
    notes: {
      foodzieOrderId,
    },
  });

  res.status(201).json({
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    receipt: razorpayOrder.receipt,
    foodzieOrderId,
  });
}

// ─── POST /api/payment/webhook ────────────────────────────────────────────────
// Razorpay will POST to this endpoint after a successful payment.
// IMPORTANT: This route uses express.raw() (set in router) so the raw body
// is available for HMAC signature verification.
export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[Webhook] RAZORPAY_WEBHOOK_SECRET is not set");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  // ── Signature Verification ────────────────────────────────────────────────
  const signature = req.headers["x-razorpay-signature"] as string;
  if (!signature) {
    res.status(400).json({ error: "Missing x-razorpay-signature header" });
    return;
  }

  const rawBody = (req as any).rawBody;
  if (!rawBody) {
    console.error("[Webhook] Raw body not captured. Check express.json configuration.");
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    console.warn("[Webhook] Invalid signature — possible spoofed request");
    res.status(400).json({ error: "Invalid webhook signature" });
    return;
  }

  // ── Process Verified Event ────────────────────────────────────────────────
  const event = req.body;
  console.log(`[Webhook] Received event: ${event.event}`);

  if (event.event === "payment.captured") {
    const notes = event.payload?.payment?.entity?.notes ?? {};
    const foodzieOrderId = notes.foodzieOrderId as string | undefined;

    if (foodzieOrderId) {
      const updatedOrder = await prisma.order.update({
        where: { id: foodzieOrderId },
        data: { paymentReceived: true, status: "Confirmed" },
        include: {
          customer: { select: { id: true, name: true, email: true } },
          items: { include: { foodItem: true } }
        }
      });
      
      // Emit to vendor room
      const io = getIO();
      io.to(`vendor:${updatedOrder.vendorId}`).emit("newOrder", updatedOrder);
      
      console.log(`[Webhook] Payment captured and newOrder emitted for: ${foodzieOrderId}`);
    } else {
      console.warn("[Webhook] payment.captured event missing foodzieOrderId in notes");
    }
  }

  // Always respond 200 quickly to acknowledge receipt
  res.status(200).json({ received: true });
}
