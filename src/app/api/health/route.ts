import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

// Keep-alive target. Supabase free tier pauses a project after ~7 days with no
// DB activity, so this must actually touch Postgres — pinging a static page
// would not count. Cheapest possible query; no data is exposed either way.
export async function GET(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  try {
    const { success } = await checkRateLimit(`health:${ip}`);
    if (!success) {
      return NextResponse.json(
        { error: "rate_limited" },
        { status: 429, headers: HEADERS },
      );
    }
  } catch (err) {
    // Limiter unavailable (Upstash unconfigured or down). This endpoint reads
    // nothing and mutates nothing, so degrade to unlimited rather than report
    // the app as unhealthy over a missing rate limiter.
    Sentry.captureException(err);
  }

  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "up" }, { headers: HEADERS });
  } catch (err) {
    // Reported to Sentry; the response body stays opaque.
    Sentry.captureException(err);
    return NextResponse.json(
      { ok: false, db: "down" },
      { status: 503, headers: HEADERS },
    );
  }
}
