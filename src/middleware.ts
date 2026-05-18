import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/app(.*)"]);

// Webhooks must stay public (verified by signature, not auth).
const isWebhook = createRouteMatcher(["/api/webhooks(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isWebhook(req)) return NextResponse.next();
  if (isProtectedRoute(req)) await auth.protect();
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next internals and static files unless in search params.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
