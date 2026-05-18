import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Default-deny: everything is protected unless explicitly public.
// Forgetting to allowlist breaks a page loudly; forgetting to deny
// would leak data silently — so deny is the default.
const isPublic = createRouteMatcher([
  "/",
  "/pricing",
  "/legal(.*)",
  "/api/webhooks(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) await auth.protect();
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
