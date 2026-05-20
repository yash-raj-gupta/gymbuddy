"use server";

import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number): Date {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
}

type WeekStats = { days: number; sets: number; volume: number };

function statsBetween(
  workouts: { startedAt: Date; sets: { weight: number; reps: number; done: boolean }[] }[],
  from: Date,
  to: Date,
): WeekStats {
  const dayKeys = new Set<string>();
  let sets = 0;
  let volume = 0;
  for (const w of workouts) {
    if (w.startedAt < from || w.startedAt >= to) continue;
    dayKeys.add(w.startedAt.toISOString().slice(0, 10));
    for (const s of w.sets) {
      if (!s.done) continue;
      sets += 1;
      volume += s.weight * s.reps;
    }
  }
  return { days: dayKeys.size, sets, volume };
}

export type DashboardSummary = {
  thisWeek: WeekStats;
  lastWeek: WeekStats;
  heatmap: { date: string; count: number }[]; // last 84 days
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const user = await requireAuth();

  // Pull 12 weeks (84 days) of finished workouts in one query.
  const since = daysAgo(83);
  const workouts = await db.workout.findMany({
    where: {
      userId: user.id,
      finishedAt: { not: null },
      startedAt: { gte: since },
    },
    select: {
      startedAt: true,
      sets: { select: { weight: true, reps: true, done: true } },
    },
  });

  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const thisStart = daysAgo(6); // last 7 days incl. today
  const lastEnd = thisStart;
  const lastStart = new Date(thisStart);
  lastStart.setDate(lastStart.getDate() - 7);

  const thisWeek = statsBetween(workouts, thisStart, tomorrow);
  const lastWeek = statsBetween(workouts, lastStart, lastEnd);

  // Heatmap: count per day for 84 trailing days.
  const counts = new Map<string, number>();
  for (const w of workouts) {
    const k = w.startedAt.toISOString().slice(0, 10);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const heatmap: { date: string; count: number }[] = [];
  for (let i = 83; i >= 0; i--) {
    const d = daysAgo(i);
    const k = d.toISOString().slice(0, 10);
    heatmap.push({ date: k, count: counts.get(k) ?? 0 });
  }

  return { thisWeek, lastWeek, heatmap };
}
