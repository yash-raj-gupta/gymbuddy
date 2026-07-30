"use client";

import { useCallback, useRef, useState } from "react";
import { Check, SkipForward } from "lucide-react";
import { tickHaptic } from "@/lib/haptics";
import {
  REPS_MAX,
  REPS_MIN,
  WEIGHT_MAX,
  WEIGHT_MIN,
  WEIGHT_STEP,
  detentsFromAngle,
  formatWeight,
} from "@/lib/plates";
import { cn } from "@/lib/utils";

// The dial knows nothing about workouts — it takes two numbers and reports
// detent-sized moves. Geometry is in viewBox units scaled by CSS; at the 22rem
// cap the rings land at ~47px and ~42px thick and the centre at ~131px, all
// clear of the 44px floor for a chalky thumb.
//
// The bands are separated by a real gap and carry different hues. Adjacent
// shades of the same green read as one starburst at arm's length, which is
// exactly the distance this thing is meant to be used from.

const VIEW = 300;
const CENTRE = VIEW / 2;
const OUTER_R = 128;
const OUTER_W = 40;
const INNER_R = 80;
const INNER_W = 36;
const CENTRE_R = 56;

/** Angular travel that commits one detent — 30 detents per revolution. */
const DEG_PER_DETENT = 12;
const DETENTS_PER_TURN = 360 / DEG_PER_DETENT;

const TAU = Math.PI * 2;
const OUTER_LEN = TAU * OUTER_R;
const INNER_LEN = TAU * INNER_R;

/** Dash pattern drawing one groove per detent, so the ring reads as knurled. */
function grooves(circumference: number): string {
  const seg = circumference / DETENTS_PER_TURN;
  return `${seg * 0.55} ${seg * 0.45}`;
}

type RingHandlers = {
  onPointerDown: (e: React.PointerEvent<SVGCircleElement>) => void;
  onPointerMove: (e: React.PointerEvent<SVGCircleElement>) => void;
  onPointerUp: (e: React.PointerEvent<SVGCircleElement>) => void;
  onPointerCancel: (e: React.PointerEvent<SVGCircleElement>) => void;
};

/**
 * Relative angular drag. The value moves by however many detents the thumb
 * travelled from where it landed — never by where on the ring it landed. That
 * is what makes "four bumps is +10 kg" true at 40 kg and at 140 kg alike.
 */
function useRingDrag(
  svgRef: React.RefObject<SVGSVGElement | null>,
  onDetents: (detents: number) => void,
  onCommit: () => void,
  disabled: boolean,
): RingHandlers {
  const drag = useRef({ id: -1, last: 0, carry: 0 });

  const angleAt = useCallback(
    (clientX: number, clientY: number): number => {
      const el = svgRef.current;
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      const dx = clientX - (r.left + r.width / 2);
      const dy = clientY - (r.top + r.height / 2);
      return (Math.atan2(dy, dx) * 180) / Math.PI;
    },
    [svgRef],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGCircleElement>) => {
      if (disabled) return;
      e.preventDefault();
      // Capture so the drag survives the thumb sliding off the ring — which it
      // will, constantly, when the ring is 44px wide and the hand is moving.
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = {
        id: e.pointerId,
        last: angleAt(e.clientX, e.clientY),
        carry: 0,
      };
    },
    [angleAt, disabled],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGCircleElement>) => {
      const d = drag.current;
      if (d.id !== e.pointerId) return;
      const a = angleAt(e.clientX, e.clientY);
      // Normalise across the ±180° seam, or a drag past 9 o'clock reads as
      // most of a revolution the other way.
      let delta = a - d.last;
      if (delta > 180) delta -= 360;
      else if (delta < -180) delta += 360;
      d.last = a;
      // Carrying the remainder is what stops a slow drag from shedding a
      // fraction of a detent on every frame and never arriving.
      d.carry += delta;
      const { detents, remainderDegrees } = detentsFromAngle(
        d.carry,
        DEG_PER_DETENT,
      );
      d.carry = remainderDegrees;
      if (detents === 0) return;
      onDetents(detents);
      // One tick per commit rather than per detent: navigator.vibrate replaces
      // the running pattern instead of queueing, so N calls in one frame are
      // felt as one buzz regardless. A real flick spans many pointermove
      // events, so a run of detents still comes through as a run of ticks.
      tickHaptic();
      onCommit();
    },
    [angleAt, onCommit, onDetents],
  );

  const end = useCallback((e: React.PointerEvent<SVGCircleElement>) => {
    if (drag.current.id !== e.pointerId) return;
    drag.current.id = -1;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: end,
    onPointerCancel: end,
  };
}

function ringKeyHandler(onDetents: (d: number) => void) {
  return (e: React.KeyboardEvent<SVGCircleElement>) => {
    const step =
      e.key === "ArrowUp" || e.key === "ArrowRight"
        ? 1
        : e.key === "ArrowDown" || e.key === "ArrowLeft"
          ? -1
          : e.key === "PageUp"
            ? 4
            : e.key === "PageDown"
              ? -4
              : 0;
    if (step === 0) return;
    e.preventDefault();
    onDetents(step);
  };
}

const LONG_PRESS_MS = 500;
const LONG_PRESS_SLOP_PX = 10;

/** Tap to log, hold to type exact numbers. The hold is the only keyboard path. */
function CentreButton({
  mode,
  onTap,
  onLongPress,
  restLabel,
}: {
  mode: "input" | "rest";
  onTap: () => void;
  onLongPress: () => void;
  restLabel: string;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);
  const origin = useRef({ x: 0, y: 0 });

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  return (
    <button
      type="button"
      aria-label={mode === "rest" ? "Skip rest" : "Log this set"}
      className={cn(
        "absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 select-none flex-col items-center justify-center rounded-full text-center transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
        mode === "rest"
          ? "bg-secondary text-secondary-foreground"
          : "bg-primary text-primary-foreground active:brightness-95",
      )}
      style={{
        width: `${(CENTRE_R * 2 * 100) / VIEW}%`,
        height: `${(CENTRE_R * 2 * 100) / VIEW}%`,
        touchAction: "none",
      }}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        fired.current = false;
        origin.current = { x: e.clientX, y: e.clientY };
        timer.current = setTimeout(() => {
          fired.current = true;
          onLongPress();
        }, LONG_PRESS_MS);
      }}
      onPointerMove={(e) => {
        if (!timer.current) return;
        const moved =
          Math.hypot(
            e.clientX - origin.current.x,
            e.clientY - origin.current.y,
          ) > LONG_PRESS_SLOP_PX;
        if (moved) clear();
      }}
      onPointerUp={() => {
        clear();
        if (!fired.current) onTap();
      }}
      onPointerCancel={clear}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        onTap();
      }}
    >
      {mode === "rest" ? (
        <>
          <span className="font-mono text-3xl font-bold tabular-nums">
            {restLabel}
          </span>
          <span className="mt-1 flex items-center gap-1 text-[0.7rem] font-semibold uppercase tracking-widest">
            <SkipForward className="size-3" /> Skip
          </span>
        </>
      ) : (
        <>
          <Check className="size-8" strokeWidth={3} />
          <span className="mt-0.5 text-xs font-semibold uppercase tracking-widest">
            Log
          </span>
        </>
      )}
    </button>
  );
}

export function Dial({
  mode,
  weight,
  reps,
  onWeightDetents,
  onRepsDetents,
  onLog,
  onSkipRest,
  onLongPress,
  restRemaining,
  restDuration,
}: {
  mode: "input" | "rest";
  weight: number;
  reps: number;
  /** Move the weight by N plate steps. Negative moves down. */
  onWeightDetents: (detents: number) => void;
  /** Move the reps by N. Negative moves down. */
  onRepsDetents: (detents: number) => void;
  onLog: () => void;
  onSkipRest: () => void;
  onLongPress: () => void;
  restRemaining: number;
  restDuration: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [focused, setFocused] = useState<"weight" | "reps" | null>(null);
  // Remounting the marker restarts its CSS pulse. On iOS, where
  // navigator.vibrate does not exist at all, this flash is the only detent
  // feedback there is.
  const [pulse, setPulse] = useState(0);
  const flash = useCallback(() => setPulse((p) => p + 1), []);

  const resting = mode === "rest";
  const weightDrag = useRingDrag(svgRef, onWeightDetents, flash, resting);
  const repsDrag = useRingDrag(svgRef, onRepsDetents, flash, resting);

  // The rings rotate by one detent-width per step, so the grooves under the
  // fixed marker are the value made physical.
  const weightAngle = (weight / WEIGHT_STEP) * DEG_PER_DETENT;
  const repsAngle = reps * DEG_PER_DETENT;

  const restFraction =
    restDuration > 0 ? Math.max(0, Math.min(1, restRemaining / restDuration)) : 0;
  const restLabel = `${Math.floor(restRemaining / 60)}:${String(
    restRemaining % 60,
  ).padStart(2, "0")}`;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(22rem,82vw,46dvh)]">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="size-full overflow-visible"
        aria-hidden={false}
      >
        {/* Seats for both rings. */}
        <circle
          cx={CENTRE}
          cy={CENTRE}
          r={OUTER_R}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={OUTER_W}
        />
        <circle
          cx={CENTRE}
          cy={CENTRE}
          r={INNER_R}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={INNER_W}
        />

        {resting ? (
          // Same ring, second job: it drains instead of accepting input.
          <circle
            cx={CENTRE}
            cy={CENTRE}
            r={OUTER_R}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={OUTER_W}
            strokeLinecap="butt"
            strokeDasharray={OUTER_LEN}
            strokeDashoffset={OUTER_LEN * (1 - restFraction)}
            transform={`rotate(-90 ${CENTRE} ${CENTRE})`}
            className="gb-dial-drain"
          />
        ) : (
          <circle
            cx={CENTRE}
            cy={CENTRE}
            r={OUTER_R}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={OUTER_W}
            strokeDasharray={grooves(OUTER_LEN)}
            transform={`rotate(${weightAngle} ${CENTRE} ${CENTRE})`}
            className="gb-dial-ring"
          />
        )}

        {/* Resting leaves the reps band as bare seat. Keeping its knurling on
            gave the draining ring a second starburst to compete with. */}
        {!resting && (
          <circle
            cx={CENTRE}
            cy={CENTRE}
            r={INNER_R}
            fill="none"
            stroke="var(--chart-4)"
            strokeWidth={INNER_W}
            strokeDasharray={grooves(INNER_LEN)}
            transform={`rotate(${repsAngle} ${CENTRE} ${CENTRE})`}
            className="gb-dial-ring"
          />
        )}

        {/* Fixed marker at 12 o'clock — the grooves move under it, not it over them. */}
        {!resting && (
          <g key={pulse} className="gb-dial-marker">
            <rect
              x={CENTRE - 2}
              y={CENTRE - OUTER_R - OUTER_W / 2 - 1}
              width={4}
              height={OUTER_W + 2}
              rx={2}
              fill="var(--foreground)"
            />
            <rect
              x={CENTRE - 2}
              y={CENTRE - INNER_R - INNER_W / 2 - 1}
              width={4}
              height={INNER_W + 2}
              rx={2}
              fill="var(--foreground)"
            />
          </g>
        )}

        {/* Which ring is which is carried by hue, matched to the units in the
            stage readout above. Text engraved on the knurling was unreadable. */}

        {focused && (
          <circle
            cx={CENTRE}
            cy={CENTRE}
            r={focused === "weight" ? OUTER_R : INNER_R}
            fill="none"
            stroke="var(--ring)"
            strokeWidth={focused === "weight" ? OUTER_W : INNER_W}
            className="opacity-30"
          />
        )}

        {/* Transparent, undashed hit annuli. Dashed strokes are unreliable
            pointer targets, and these also carry the slider semantics. */}
        <circle
          cx={CENTRE}
          cy={CENTRE}
          r={OUTER_R}
          fill="none"
          stroke="transparent"
          strokeWidth={OUTER_W}
          style={{ pointerEvents: resting ? "none" : "stroke", touchAction: "none" }}
          role="slider"
          tabIndex={resting ? -1 : 0}
          aria-label="Weight"
          aria-valuemin={WEIGHT_MIN}
          aria-valuemax={WEIGHT_MAX}
          aria-valuenow={weight}
          aria-valuetext={`${formatWeight(weight)} kilograms`}
          aria-disabled={resting}
          onFocus={() => setFocused("weight")}
          onBlur={() => setFocused(null)}
          onKeyDown={ringKeyHandler(onWeightDetents)}
          {...weightDrag}
        />
        <circle
          cx={CENTRE}
          cy={CENTRE}
          r={INNER_R}
          fill="none"
          stroke="transparent"
          strokeWidth={INNER_W}
          style={{ pointerEvents: resting ? "none" : "stroke", touchAction: "none" }}
          role="slider"
          tabIndex={resting ? -1 : 0}
          aria-label="Reps"
          aria-valuemin={REPS_MIN}
          aria-valuemax={REPS_MAX}
          aria-valuenow={reps}
          aria-valuetext={`${reps} reps`}
          aria-disabled={resting}
          onFocus={() => setFocused("reps")}
          onBlur={() => setFocused(null)}
          onKeyDown={ringKeyHandler(onRepsDetents)}
          {...repsDrag}
        />
      </svg>

      <CentreButton
        mode={mode}
        restLabel={restLabel}
        onTap={resting ? onSkipRest : onLog}
        onLongPress={onLongPress}
      />
    </div>
  );
}
