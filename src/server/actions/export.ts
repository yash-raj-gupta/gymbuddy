"use server";

import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { estimate1RM } from "@/lib/plan";

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Full workout history as CSV (gymbuddy-prd.md §3 — export). */
export async function exportWorkoutsCSV(): Promise<string> {
  const user = await requireAuth();
  const workouts = await db.workout.findMany({
    where: { userId: user.id, finishedAt: { not: null } },
    orderBy: { startedAt: "desc" },
    include: {
      sets: { orderBy: { order: "asc" }, include: { exercise: true } },
    },
  });

  const header = [
    "date",
    "exercise",
    "muscle_group",
    "set",
    "weight_kg",
    "reps",
    "rpe",
    "est_1rm",
    "done",
    "note",
  ];
  const rows: string[] = [header.join(",")];

  for (const w of workouts) {
    const date = w.startedAt.toISOString().slice(0, 10);
    let n = 0;
    for (const s of w.sets) {
      n += 1;
      rows.push(
        [
          date,
          s.exercise.name,
          s.exercise.muscleGroup,
          n,
          s.weight,
          s.reps,
          s.rpe ?? "",
          s.done ? estimate1RM(s.weight, s.reps) : "",
          s.done ? "yes" : "no",
          w.note ?? "",
        ]
          .map(csvCell)
          .join(","),
      );
    }
  }
  return rows.join("\n");
}
