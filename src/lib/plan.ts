import type { Plan } from "@/generated/prisma/enums";

// gymbuddy-prd.md §3 — free-tier limits enforced server-side.
export const LIMITS = {
  FREE: { maxRoutines: 1, historyDays: 30, charts: false, csvExport: false },
  PRO: {
    maxRoutines: Infinity,
    historyDays: Infinity,
    charts: true,
    csvExport: true,
  },
  LIFETIME: {
    maxRoutines: Infinity,
    historyDays: Infinity,
    charts: true,
    csvExport: true,
  },
} as const;

export function limitsFor(plan: Plan) {
  return LIMITS[plan];
}

export function isPro(plan: Plan) {
  return plan === "PRO" || plan === "LIFETIME";
}

/** Oldest date a user is allowed to read history from (free = 30 days). */
export function historyCutoff(plan: Plan): Date | null {
  const days = LIMITS[plan].historyDays;
  if (days === Infinity) return null;
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

/** Epley estimated 1RM — gymbuddy-prd.md §4 feature 3. */
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}
