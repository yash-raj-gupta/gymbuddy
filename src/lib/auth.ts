import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

/**
 * Resolve the Clerk session to our DB User, creating it on first sight.
 * Returns null when signed out.
 */
export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await db.user.findUnique({ where: { clerkId: userId } });
  if (existing) return existing;

  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  if (!email) return null;

  return db.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: { clerkId: userId, email },
  });
}

/** Use in server components/actions that must be authenticated. */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}
