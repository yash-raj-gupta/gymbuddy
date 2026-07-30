"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatWeight } from "@/lib/plates";
import { cn } from "@/lib/utils";

// The middle band. It owns horizontal swipe; the dial owns rotational drag.
// Splitting them by area rather than by gesture recognition means the two can
// never contend for the same pointer.

const SWIPE_PX = 56;

export function ExerciseStage({
  name,
  position,
  total,
  weight,
  reps,
  prev,
  done,
  onPrev,
  onNext,
}: {
  name: string;
  /** 1-based, for the "2 / 5" readout. */
  position: number;
  total: number;
  weight: number;
  reps: number;
  prev?: { reps: number; weight: number } | null;
  done: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const swipe = useRef({ id: -1, x: 0, y: 0, fired: false });

  return (
    <section
      className="relative flex min-h-0 flex-1 select-none flex-col items-center justify-center px-4"
      style={{ touchAction: "pan-y" }}
      onPointerDown={(e) => {
        swipe.current = { id: e.pointerId, x: e.clientX, y: e.clientY, fired: false };
      }}
      onPointerMove={(e) => {
        const s = swipe.current;
        if (s.id !== e.pointerId || s.fired) return;
        const dx = e.clientX - s.x;
        const dy = e.clientY - s.y;
        // Axis lock: a mostly-vertical drag is never an exercise change.
        if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) <= Math.abs(dy)) return;
        s.fired = true;
        if (dx < 0) onNext();
        else onPrev();
      }}
      onPointerUp={() => {
        swipe.current.id = -1;
      }}
      onPointerCancel={() => {
        swipe.current.id = -1;
      }}
    >
      <div className="mb-1 flex items-center gap-2 text-muted-foreground">
        <button
          type="button"
          onClick={onPrev}
          disabled={total < 2}
          aria-label="Previous exercise"
          className="flex size-11 items-center justify-center rounded-full transition-colors hover:bg-muted disabled:opacity-30"
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="min-w-14 text-center text-xs font-medium uppercase tracking-widest tabular-nums">
          {position} / {total}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={total < 2}
          aria-label="Next exercise"
          className="flex size-11 items-center justify-center rounded-full transition-colors hover:bg-muted disabled:opacity-30"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <h1 className="line-clamp-2 text-balance text-center text-xl font-bold leading-tight tracking-tight sm:text-2xl">
        {name}
      </h1>

      {/* Real text, not canvas — a screen reader gets the numbers verbatim.
          The units are tinted to match their ring, which is the whole legend
          the dial needs: green outer is kg, gold inner is reps. */}
      <p
        className={cn(
          "mt-3 flex items-baseline gap-1.5 tabular-nums transition-opacity",
          done && "opacity-45",
        )}
      >
        <span className="text-[3.25rem] font-bold leading-none tracking-tight sm:text-6xl">
          {formatWeight(weight)}
        </span>
        <span className="text-base font-semibold uppercase tracking-wide text-primary">
          kg
        </span>
        <span className="px-1 text-2xl font-light text-muted-foreground">×</span>
        <span className="text-[3.25rem] font-bold leading-none tracking-tight sm:text-6xl">
          {reps}
        </span>
        <span className="text-base font-semibold uppercase tracking-wide text-[var(--chart-4)]">
          reps
        </span>
      </p>

      <p className="mt-2 h-5 text-xs text-muted-foreground tabular-nums">
        {prev
          ? `Last time · ${formatWeight(prev.weight)} kg × ${prev.reps}`
          : "No previous set"}
      </p>
    </section>
  );
}
