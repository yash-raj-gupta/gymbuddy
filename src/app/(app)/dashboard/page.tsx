import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { historyCutoff, isPro } from "@/lib/plan";
import { AppNav } from "@/components/app-nav";
import { StartWorkout } from "@/components/start-workout";
import { ExportButton } from "@/components/export-button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAuth();
  const cutoff = historyCutoff(user.plan);

  const workouts = await db.workout.findMany({
    where: {
      userId: user.id,
      finishedAt: { not: null },
      ...(cutoff ? { startedAt: { gte: cutoff } } : {}),
    },
    orderBy: { startedAt: "desc" },
    take: 30,
    include: { sets: { include: { exercise: true } } },
  });

  return (
    <div className="min-h-dvh pb-20 sm:pb-0">
      <AppNav />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              {user.email} ·{" "}
              <Badge variant={isPro(user.plan) ? "default" : "secondary"}>
                {user.plan}
              </Badge>
            </p>
          </div>
        </div>

        <StartWorkout />

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent workouts</h2>
            {workouts.length > 0 && <ExportButton />}
          </div>

          {workouts.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No workouts yet. Hit{" "}
                <span className="font-medium text-foreground">
                  Start workout
                </span>{" "}
                and log your first set.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {workouts.map((w) => {
                const exercises = new Set(w.sets.map((s) => s.exerciseId));
                const volume = w.sets
                  .filter((s) => s.done)
                  .reduce((sum, s) => sum + s.weight * s.reps, 0);
                return (
                  <Link key={w.id} href={`/history/${w.id}`} className="block">
                    <Card className="transition-colors hover:border-primary/50 hover:bg-muted/40">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center justify-between text-base">
                          <span>
                            {new Date(w.startedAt).toLocaleDateString("en-IN", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                          <span className="text-sm font-normal text-muted-foreground">
                            {exercises.size} exercises · {w.sets.length} sets
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 text-sm text-muted-foreground">
                        Volume:{" "}
                        {Math.round(volume).toLocaleString("en-IN")} kg·reps
                        {w.note ? ` · ${w.note}` : ""}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
