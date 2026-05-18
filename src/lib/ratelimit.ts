import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { env } from "@/env";

// Lazy: Upstash Redis throws on missing URL, which would break build-time
// page-data collection. Construct on first request instead.
let _ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit {
  if (!_ratelimit) {
    const redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
    _ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      analytics: true,
      prefix: "gymbuddy:rl",
    });
  }
  return _ratelimit;
}

/** Returns whether the request is allowed (default 10 req / 10s). */
export async function checkRateLimit(identifier: string) {
  const { success, limit, remaining, reset } =
    await getRatelimit().limit(identifier);
  return { success, limit, remaining, reset };
}
