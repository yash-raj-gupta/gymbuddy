import crypto from "node:crypto";
import Razorpay from "razorpay";
import { env } from "@/env";

// Prices in paise (INR * 100) — gymbuddy-prd.md §3.
export const PLANS = {
  PRO_MONTHLY: { amount: 9900, label: "GymBuddy Pro — Monthly", period: "month" },
  PRO_YEARLY: { amount: 79900, label: "GymBuddy Pro — Yearly", period: "year" },
  LIFETIME: { amount: 149900, label: "Founder Lifetime", period: "once" },
} as const;

export type PlanKey = keyof typeof PLANS;

// Lazy: never instantiate at module load (build-time page-data collection
// runs with empty env and Razorpay throws on missing key_id).
let _razorpay: Razorpay | null = null;
export function getRazorpay(): Razorpay {
  if (!_razorpay) {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
      throw new Error(
        "Razorpay not configured: set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local",
      );
    }
    _razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
}

export async function createOrder(plan: PlanKey, userId: string) {
  const { amount } = PLANS[plan];
  return getRazorpay().orders.create({
    amount,
    currency: "INR",
    notes: { plan, userId },
  });
}

/** Verify the checkout handler signature (order_id|payment_id). */
export function verifyPaymentSignature(args: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay not configured: missing RAZORPAY_KEY_SECRET");
  }
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${args.orderId}|${args.paymentId}`)
    .digest("hex");
  return timingSafeEqual(expected, args.signature);
}

/** Verify a Razorpay webhook body against X-Razorpay-Signature. */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    throw new Error("Razorpay not configured: missing RAZORPAY_WEBHOOK_SECRET");
  }
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
