// Detent math for the workout dial. Pure — no React, no DOM, no side effects.
//
// The dial is *relative*: a drag changes the value by however many detents the
// thumb travelled, rather than mapping ring position to an absolute weight. So
// everything here is expressed as "move N detents from where you are", which
// behaves identically at 40 kg and at 140 kg.

/** One plate-pair step on a barbell. */
export const WEIGHT_STEP = 2.5;
export const REPS_STEP = 1;

export const WEIGHT_MIN = 0;
export const WEIGHT_MAX = 500;
export const REPS_MIN = 0;
export const REPS_MAX = 100;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Round to the nearest plate step. Prefill weights come out of Postgres as
 * Float, so they can arrive off-grid (e.g. 97.3) and need snapping before the
 * dial can step from them coherently.
 */
export function snapWeight(kg: number): number {
  if (!Number.isFinite(kg)) return WEIGHT_MIN;
  const snapped = Math.round(kg / WEIGHT_STEP) * WEIGHT_STEP;
  // Multiples of 2.5 are exact in binary, but the divide/multiply round-trip
  // on an off-grid input can still leave a trailing epsilon.
  return clamp(Math.round(snapped * 100) / 100, WEIGHT_MIN, WEIGHT_MAX);
}

export function snapReps(reps: number): number {
  if (!Number.isFinite(reps)) return REPS_MIN;
  return clamp(Math.round(reps), REPS_MIN, REPS_MAX);
}

/** Move `detents` steps from `kg`. Negative moves down. */
export function stepWeight(kg: number, detents: number): number {
  return snapWeight(snapWeight(kg) + detents * WEIGHT_STEP);
}

/** Move `detents` steps from `reps`. Negative moves down. */
export function stepReps(reps: number, detents: number): number {
  return snapReps(snapReps(reps) + detents * REPS_STEP);
}

/** "100" / "97.5" — never "100.0". */
export function formatWeight(kg: number): string {
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1);
}

/**
 * Angle travelled -> whole detents, plus the remainder to carry into the next
 * pointer event. Carrying the remainder is what keeps a slow drag from losing
 * fractions of a detent on every frame.
 */
export function detentsFromAngle(
  totalDegrees: number,
  degreesPerDetent: number,
): { detents: number; remainderDegrees: number } {
  const detents = Math.trunc(totalDegrees / degreesPerDetent);
  return {
    detents,
    remainderDegrees: totalDegrees - detents * degreesPerDetent,
  };
}
