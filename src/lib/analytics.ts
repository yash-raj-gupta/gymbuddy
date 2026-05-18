import posthog from "posthog-js";

let initialized = false;

/** Browser-side PostHog. No-op when the key is absent (local/dev). */
export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
    capture_pageview: true,
    person_profiles: "identified_only",
  });
  initialized = true;
}

export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window === "undefined" || !initialized) return;
  posthog.capture(event, props);
}

export { posthog };
