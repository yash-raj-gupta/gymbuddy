"use server";

import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { estimate1RM, isPro } from "@/lib/plan";

const ExerciseId = z.string().min(1).max(40);

export type ProgressPoint = {
  date: string;
  topWeight: number;
  est1RM: number;
  volume: number;
};

/** Per-exercise progression series — Pro only (gymbuddy-prd.md §3). */
export async function getExerciseProgress(
  exerciseIdRaw: string,
): Promise<{ locked: true } | { locked: false; points: ProgressPoint[] }> {
  const user = await requireAuth();
  const exerciseId = ExerciseId.parse(exerciseIdRaw);
  if (!isPro(user.plan)) return { locked: true };

  const workouts = await db.workout.findMany({
    where: {
      userId: user.id,
      finishedAt: { not: null },
      sets: { some: { exerciseId, done: true } },
    },
    orderBy: { startedAt: "asc" },
    include: { sets: { where: { exerciseId, done: true } } },
  });

  const points: ProgressPoint[] = workouts.map((w) => {
    const topWeight = Math.max(...w.sets.map((s) => s.weight));
    const est1RM = Math.max(
      ...w.sets.map((s) => estimate1RM(s.weight, s.reps)),
    );
    const volume = w.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    return {
      date: w.startedAt.toISOString().slice(0, 10),
      topWeight,
      est1RM,
      volume,
    };
  });
  return { locked: false, points };
}

export async function getPRs(exerciseIdRaw: string) {
  const user = await requireAuth();
  const exerciseId = ExerciseId.parse(exerciseIdRaw);
  const sets = await db.setLog.findMany({
    where: {
      exerciseId,
      done: true,
      workout: { userId: user.id, finishedAt: { not: null } },
    },
    include: { workout: { select: { startedAt: true } } },
  });
  if (sets.length === 0) return null;

  let heaviest = sets[0]!;
  let best1RM = { value: 0, set: sets[0]! };
  let bestVolume = { value: 0, set: sets[0]! };
  for (const s of sets) {
    if (s.weight > heaviest.weight) heaviest = s;
    const e = estimate1RM(s.weight, s.reps);
    if (e > best1RM.value) best1RM = { value: e, set: s };
    const v = s.weight * s.reps;
    if (v > bestVolume.value) bestVolume = { value: v, set: s };
  }
  const iso = (d: Date) => d.toISOString();
  return {
    heaviestWeight: heaviest.weight,
    heaviestAt: iso(heaviest.workout.startedAt),
    bestEst1RM: Math.round(best1RM.value * 10) / 10,
    bestEst1RMAt: iso(best1RM.set.workout.startedAt),
    bestVolume: bestVolume.value,
    bestVolumeAt: iso(bestVolume.set.workout.startedAt),
  };
}
