"use client";

import { useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  cacheExercises,
  getPendingWorkouts,
  markSynced,
} from "@/lib/offline-store";
import { syncOfflineWorkout } from "@/server/actions/workouts";
import { listExercises } from "@/server/actions/exercises";

// Flushes finished-but-unsynced workouts to the server on mount and
// whenever connectivity returns. Idempotent via clientId.
export function SyncManager() {
  const flush = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    let pending;
    try {
      pending = await getPendingWorkouts();
    } catch {
      return;
    }
    if (pending.length === 0) return;

    let synced = 0;
    for (const w of pending) {
      try {
        await syncOfflineWorkout({
          clientId: w.clientId,
          startedAt: w.startedAt,
          finishedAt: w.finishedAt,
          note: w.note,
          sets: w.sets.map((s) => ({
            exerciseId: s.exerciseId,
            reps: s.reps,
            weight: s.weight,
            rpe: s.rpe ?? null,
            done: s.done,
            order: s.order,
          })),
        });
        await markSynced(w.clientId);
        synced++;
      } catch {
        // Stay queued; retry on next online event.
      }
    }
    if (synced > 0) toast.success(`Synced ${synced} workout(s).`);
  }, []);

  useEffect(() => {
    void flush();
    const onOnline = () => void flush();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [flush]);

  // Pre-warm the exercise-catalogue cache so the in-workout picker
  // works with no signal at the gym.
  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    listExercises()
      .then(cacheExercises)
      .catch(() => {});
  }, []);

  return null;
}
