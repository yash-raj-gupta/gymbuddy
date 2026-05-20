import type { NextConfig } from "next";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://challenges.cloudflare.com https://*.posthog.com https://checkout.razorpay.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: https: blob:",
  "font-src 'self' https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co https://*.clerk.accounts.dev https://clerk-telemetry.com https://*.posthog.com https://api.razorpay.com https://*.sentry.io",
  "worker-src 'self' blob:",
  "frame-src https://checkout.razorpay.com https://*.clerk.accounts.dev https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  // Pin the workspace root — projects/ has stray lockfiles above this dir.
  turbopack: { root: __dirname },
  async headers() {
    // Security headers only in production. The CSP's
    // `upgrade-insecure-requests` upgrades subresource fetches to HTTPS;
    // Chrome exempts localhost, Safari doesn't — so on `pnpm dev` Safari
    // would 502 the CSS bundle and the page renders unstyled.
    if (process.env.NODE_ENV !== "production") return [];
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
