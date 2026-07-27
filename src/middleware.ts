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
  "/api/health",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) {
    // Send signed-out users to our own /sign-in page, never Clerk's hosted
    // portal on *.accounts.dev. The manifest scope is "/", so an off-origin
    // bounce at launch drops an installed PWA out of its own scope and it
    // never gets back in — the standalone window just sits on a blank splash.
    const signIn = new URL("/sign-in", req.nextUrl);
    signIn.searchParams.set("redirect_url", req.nextUrl.href);
    await auth.protect({ unauthenticatedUrl: signIn.toString() });
  }
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
