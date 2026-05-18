"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

// Local-first workout store. gymbuddy-prd.md §4 feature 5:
// logging works fully offline, queues here, syncs on reconnect.

export type LocalSet = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  reps: number;
  weight: number;
  rpe?: number | null;
  done: boolean;
  order: number;
};

export type LocalWorkout = {
  clientId: string;
  startedAt: string;
  finishedAt: string | null;
  note: string | null;
  sets: LocalSet[];
  synced: boolean;
};

interface GymDB extends DBSchema {
  workouts: { key: string; value: LocalWorkout };
}

let _db: Promise<IDBPDatabase<GymDB>> | null = null;

function getDB() {
  if (!_db) {
    _db = openDB<GymDB>("gymbuddy", 1, {
      upgrade(db) {
        db.createObjectStore("workouts", { keyPath: "clientId" });
      },
    });
  }
  return _db;
}

export async function saveLocalWorkout(w: LocalWorkout) {
  const db = await getDB();
  await db.put("workouts", w);
}

export async function getLocalWorkout(clientId: string) {
  const db = await getDB();
  return db.get("workouts", clientId);
}

export async function getPendingWorkouts(): Promise<LocalWorkout[]> {
  const db = await getDB();
  const all = await db.getAll("workouts");
  return all.filter((w) => !w.synced && w.finishedAt !== null);
}

export async function markSynced(clientId: string) {
  const db = await getDB();
  const w = await db.get("workouts", clientId);
  if (w) await db.put("workouts", { ...w, synced: true });
}

export async function deleteLocalWorkout(clientId: string) {
  const db = await getDB();
  await db.delete("workouts", clientId);
}
