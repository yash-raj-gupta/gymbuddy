import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppNav } from "@/components/app-nav";
import { ProgressView } from "@/components/progress-view";

export const metadata: Metadata = {
  title: "Progress",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const user = await requireAuth();

  // Only exercises the user has actually logged a finished set for.
  const logged = await db.setLog.findMany({
    where: {
      done: true,
      workout: { userId: user.id, finishedAt: { not: null } },
    },
    select: { exercise: { select: { id: true, name: true } } },
    distinct: ["exerciseId"],
    orderBy: { exercise: { name: "asc" } },
  });
  const exercises = logged.map((l) => l.exercise);

  return (
    <div className="min-h-dvh pb-20 sm:pb-0">
      <AppNav />
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <h1 className="text-2xl font-bold tracking-tight">Progress &amp; PRs</h1>
        <ProgressView exercises={exercises} />
      </main>
    </div>
  );
}
