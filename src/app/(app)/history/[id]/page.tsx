import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getWorkout } from "@/server/actions/workouts";
import { estimate1RM } from "@/lib/plan";
import { AppNav } from "@/components/app-nav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Workout",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const w = await getWorkout(id);
  if (!w) notFound();

  const groups: { name: string; muscle: string; sets: typeof w.sets }[] = [];
  for (const s of w.sets) {
    let g = groups.find((x) => x.name === s.exercise.name);
    if (!g) {
      g = { name: s.exercise.name, muscle: s.exercise.muscleGroup, sets: [] };
      groups.push(g);
    }
    g.sets.push(s);
  }

  const doneSets = w.sets.filter((s) => s.done);
  const volume = doneSets.reduce((sum, s) => sum + s.weight * s.reps, 0);
  const durationMin = w.finishedAt
    ? Math.max(
        1,
        Math.round(
          (new Date(w.finishedAt).getTime() -
            new Date(w.startedAt).getTime()) /
            60000,
        ),
      )
    : null;

  return (
    <div className="min-h-dvh pb-20 sm:pb-0">
      <AppNav />
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {new Date(w.startedAt).toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h1>
          <p className="text-sm text-muted-foreground">
            {groups.length} exercises · {doneSets.length} sets ·{" "}
            {Math.round(volume).toLocaleString("en-IN")} kg·reps
            {durationMin ? ` · ${durationMin} min` : ""}
          </p>
          {w.note && (
            <p className="mt-2 rounded-md bg-muted px-3 py-2 text-sm">
              {w.note}
            </p>
          )}
        </div>

        {groups.map((g) => {
          const top = Math.max(...g.sets.map((s) => s.weight), 0);
          const best1RM = Math.max(
            ...g.sets
              .filter((s) => s.done)
              .map((s) => estimate1RM(s.weight, s.reps)),
            0,
          );
          return (
            <Card key={g.name}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{g.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    top {top}kg · e1RM {best1RM}kg
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {g.sets.map((s, i) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">Set {i + 1}</span>
                    <span className="tabular-nums">
                      {s.weight} kg × {s.reps}
                      {s.rpe ? ` @ RPE ${s.rpe}` : ""}
                      {!s.done && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (skipped)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </main>
    </div>
  );
}
