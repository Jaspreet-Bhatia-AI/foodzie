import Razorpay from "razorpay";

// ─── Razorpay SDK Initialization ───────────────────────────────────────────────
// Keys are loaded from environment variables. Replace placeholders in .env
// with your actual Razorpay test/live keys before going to production.
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn(
    "[Razorpay] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set. Payment routes will not work."
  );
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID ?? "",
  key_secret: process.env.RAZORPAY_KEY_SECRET ?? "",
});
