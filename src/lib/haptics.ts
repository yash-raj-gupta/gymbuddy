"use client";

// Vibration feedback for the dial. Capability-checked and best-effort — the API
// is absent on iOS Safari entirely, so every call here is a silent no-op there
// and the dial falls back to visual detent feedback.

let reduceMotionQuery: MediaQueryList | null = null;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  reduceMotionQuery ??= window.matchMedia("(prefers-reduced-motion: reduce)");
  return reduceMotionQuery.matches;
}

function vibrate(pattern: number | number[]): void {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  if (prefersReducedMotion()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* best-effort */
  }
}

/** One detent crossed on the dial. Deliberately near the perceptible floor. */
export function tickHaptic(): void {
  vibrate(8);
}

/** A set was logged. */
export function confirmHaptic(): void {
  vibrate(24);
}

/** Rest is over. */
export function alertHaptic(): void {
  vibrate([300, 120, 300]);
}
