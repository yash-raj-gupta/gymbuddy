import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyWebhookSignature } from "@/lib/payments";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Razorpay → upgrade the paying user. Signature-verified before any work.
export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success } = await checkRateLimit(`webhook:razorpay:${ip}`);
  if (!success) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  const notesSchema = z.record(z.string(), z.string()).optional();
  const eventSchema = z.object({
    event: z.string(),
    payload: z
      .object({
        payment: z.object({ entity: z.object({ notes: notesSchema }) }).optional(),
        order: z.object({ entity: z.object({ notes: notesSchema }) }).optional(),
      })
      .optional(),
  });

  const parsed = eventSchema.safeParse(
    (() => {
      try {
        return JSON.parse(rawBody);
      } catch {
        return null;
      }
    })(),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_payload" }, { status: 400 });
  }
  const event = parsed.data;

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const notes =
      event.payload?.payment?.entity?.notes ??
      event.payload?.order?.entity?.notes;
    const userId = notes?.userId;
    const plan = notes?.plan;

    if (userId && plan) {
      const newPlan = plan === "LIFETIME" ? "LIFETIME" : "PRO";
      await db.user.update({
        where: { id: userId },
        data: { plan: newPlan },
      });
    }
  }

  // Always 200 on a verified event so Razorpay stops retrying.
  return NextResponse.json({ received: true });
}
