"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { historyCutoff } from "@/lib/plan";

async function ownWorkout(workoutId: string, userId: string) {
  const w = await db.workout.findUnique({ where: { id: workoutId } });
  if (!w || w.userId !== userId) throw new Error("Workout not found");
  return w;
}

export async function startWorkout(raw: unknown) {
  const user = await requireAuth();
  const { routineId, clientId } = z
    .object({ routineId: z.string().optional(), clientId: z.string().optional() })
    .parse(raw);

  if (clientId) {
    const existing = await db.workout.findUnique({ where: { clientId } });
    if (existing) return existing;
  }

  const workout = await db.workout.create({
    data: { userId: user.id, clientId: clientId ?? null },
  });

  if (routineId) {
    const routine = await db.routine.findUnique({
      where: { id: routineId },
      include: { items: { orderBy: { order: "asc" } } },
    });
    if (routine && routine.userId === user.id) {
      // Pre-stage a single placeholder set per routine exercise.
      await db.setLog.createMany({
        data: routine.items.map((it, i) => ({
          workoutId: workout.id,
          exerciseId: it.exerciseId,
          reps: 0,
          weight: 0,
          done: false,
          order: i,
        })),
      });
    }
  }
  revalidatePath("/dashboard");
  return workout;
}

async function lastSetsFor(userId: string, exerciseId: string) {
  const lastWorkout = await db.workout.findFirst({
    where: {
      userId,
      finishedAt: { not: null },
      sets: { some: { exerciseId } },
    },
    orderBy: { startedAt: "desc" },
    include: {
      sets: { where: { exerciseId }, orderBy: { order: "asc" } },
    },
  });
  return lastWorkout?.sets.map((s) => ({ reps: s.reps, weight: s.weight })) ?? [];
}

/** Last session's sets for an exercise — the progressive-overload prefill. */
export async function getPrefillSets(exerciseIdRaw: string) {
  const user = await requireAuth();
  const exerciseId = z.string().min(1).max(40).parse(exerciseIdRaw);
  return lastSetsFor(user.id, exerciseId);
}

/** Batched prefill for a routine's exercises, keyed by exerciseId. */
export async function getPrefillMap(exerciseIdsRaw: unknown) {
  const user = await requireAuth();
  const ids = z.array(z.string().min(1).max(40)).max(50).parse(exerciseIdsRaw);
  const entries = await Promise.all(
    ids.map(async (id) => [id, await lastSetsFor(user.id, id)] as const),
  );
  return Object.fromEntries(entries) as Record<
    string,
    { reps: number; weight: number }[]
  >;
}

const SetInput = z.object({
  workoutId: z.string(),
  exerciseId: z.string(),
  reps: z.number().int().min(0).max(1000),
  weight: z.number().min(0).max(2000),
  rpe: z.number().min(1).max(10).optional(),
  done: z.boolean().default(true),
  order: z.number().int().min(0),
});

export async function addSet(raw: unknown) {
  const user = await requireAuth();
  const data = SetInput.parse(raw);
  await ownWorkout(data.workoutId, user.id);
  const set = await db.setLog.create({
    data: {
      workoutId: data.workoutId,
      exerciseId: data.exerciseId,
      reps: data.reps,
      weight: data.weight,
      rpe: data.rpe,
      done: data.done,
      order: data.order,
    },
  });
  revalidatePath(`/workout/${data.workoutId}`);
  return set;
}

const UpdateSet = z.object({
  setId: z.string(),
  reps: z.number().int().min(0).max(1000).optional(),
  weight: z.number().min(0).max(2000).optional(),
  rpe: z.number().min(1).max(10).nullable().optional(),
  done: z.boolean().optional(),
});

export async function updateSet(raw: unknown) {
  const user = await requireAuth();
  const data = UpdateSet.parse(raw);
  const set = await db.setLog.findUnique({
    where: { id: data.setId },
    include: { workout: true },
  });
  if (!set || set.workout.userId !== user.id) throw new Error("Set not found");
  const updated = await db.setLog.update({
    where: { id: data.setId },
    data: {
      reps: data.reps,
      weight: data.weight,
      rpe: data.rpe ?? undefined,
      done: data.done,
    },
  });
  revalidatePath(`/workout/${set.workoutId}`);
  return updated;
}

export async function deleteSet(setIdRaw: string) {
  const user = await requireAuth();
  const setId = z.string().min(1).max(40).parse(setIdRaw);
  const set = await db.setLog.findUnique({
    where: { id: setId },
    include: { workout: true },
  });
  if (!set || set.workout.userId !== user.id) throw new Error("Set not found");
  await db.setLog.delete({ where: { id: setId } });
  revalidatePath(`/workout/${set.workoutId}`);
}

export async function finishWorkout(raw: unknown) {
  const user = await requireAuth();
  const { workoutId, note } = z
    .object({ workoutId: z.string(), note: z.string().max(500).optional() })
    .parse(raw);
  await ownWorkout(workoutId, user.id);
  // Drop untouched placeholder sets so an abandoned routine row isn't a "set".
  await db.setLog.deleteMany({
    where: { workoutId, done: false, reps: 0, weight: 0 },
  });
  const w = await db.workout.update({
    where: { id: workoutId },
    data: { finishedAt: new Date(), note: note ?? null },
  });
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  return w;
}

export async function getWorkout(workoutIdRaw: string) {
  const user = await requireAuth();
  const workoutId = z.string().min(1).max(40).parse(workoutIdRaw);
  const w = await db.workout.findUnique({
    where: { id: workoutId },
    include: {
      sets: {
        orderBy: { order: "asc" },
        include: { exercise: true },
      },
    },
  });
  if (!w || w.userId !== user.id) return null;
  return w;
}

export async function listWorkouts() {
  const user = await requireAuth();
  const cutoff = historyCutoff(user.plan);
  return db.workout.findMany({
    where: {
      userId: user.id,
      finishedAt: { not: null },
      ...(cutoff ? { startedAt: { gte: cutoff } } : {}),
    },
    orderBy: { startedAt: "desc" },
    include: { sets: { include: { exercise: true } } },
  });
}

/** Idempotent offline → server sync (one whole workout). */
const OfflineWorkout = z.object({
  clientId: z.string().min(1),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  note: z.string().max(500).nullable().optional(),
  sets: z.array(
    z.object({
      exerciseId: z.string(),
      reps: z.number().int().min(0).max(1000),
      weight: z.number().min(0).max(2000),
      rpe: z.number().min(1).max(10).nullable().optional(),
      done: z.boolean(),
      order: z.number().int().min(0),
    }),
  ),
});

export async function syncOfflineWorkout(raw: unknown) {
  const user = await requireAuth();
  const data = OfflineWorkout.parse(raw);

  const setCreate = data.sets.map((s) => ({
    exerciseId: s.exerciseId,
    reps: s.reps,
    weight: s.weight,
    rpe: s.rpe ?? null,
    done: s.done,
    order: s.order,
  }));

  const existing = await db.workout.findUnique({
    where: { clientId: data.clientId },
  });

  // `startWorkout` reserves a row with this clientId; the finished payload
  // must overwrite it (full replace) — not dedupe-and-skip, or the workout
  // would never get finishedAt/sets and never show on the dashboard.
  if (existing) {
    if (existing.userId !== user.id) throw new Error("Not your workout");
    await db.setLog.deleteMany({ where: { workoutId: existing.id } });
    await db.workout.update({
      where: { id: existing.id },
      data: {
        startedAt: new Date(data.startedAt),
        finishedAt: data.finishedAt ? new Date(data.finishedAt) : null,
        note: data.note ?? null,
        sets: { create: setCreate },
      },
    });
    revalidatePath("/dashboard");
    revalidatePath("/progress");
    return { id: existing.id, deduped: false };
  }

  const created = await db.workout.create({
    data: {
      userId: user.id,
      clientId: data.clientId,
      startedAt: new Date(data.startedAt),
      finishedAt: data.finishedAt ? new Date(data.finishedAt) : null,
      note: data.note ?? null,
      sets: { create: setCreate },
    },
  });
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  return { id: created.id, deduped: false };
}
