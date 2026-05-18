import { Check, Timer, Dumbbell } from "lucide-react";

// Static product mock — shows the logging loop without a screenshot.
const sets = [
  { kg: 80, reps: 8, done: true },
  { kg: 82.5, reps: 8, done: true },
  { kg: 85, reps: 6, done: true },
  { kg: 85, reps: 5, done: false },
];

export function AppPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-[radial-gradient(circle,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_70%)] blur-2xl" />
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Dumbbell className="size-4 text-primary" /> Push Day
          </span>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
            Live
          </span>
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Timer className="size-4" /> Rest
          </span>
          <span className="font-mono text-xl font-bold tabular-nums">
            01:18
          </span>
        </div>
        <div className="mx-4 mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-2/3 rounded-full bg-primary" />
        </div>

        <div className="space-y-2 px-4 pb-4">
          <p className="text-sm font-medium">Bench Press</p>
          {sets.map((s, i) => (
            <div
              key={i}
              className="grid grid-cols-[1.5rem_1fr_1fr_1.75rem] items-center gap-2 text-sm"
            >
              <span className="text-muted-foreground">{i + 1}</span>
              <span className="rounded-md border bg-background px-2 py-1 tabular-nums">
                {s.kg} kg
              </span>
              <span className="rounded-md border bg-background px-2 py-1 tabular-nums">
                {s.reps} reps
              </span>
              <span
                className={`flex size-6 items-center justify-center rounded-md border ${
                  s.done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input"
                }`}
              >
                {s.done && <Check className="size-3.5" />}
              </span>
            </div>
          ))}
          <p className="pt-1 text-xs text-muted-foreground">
            Prefilled from last session — beat{" "}
            <span className="font-medium text-foreground">85kg × 5</span>
          </p>
        </div>
      </div>

      <div className="gb-float absolute -right-3 -top-3 rounded-xl border bg-card px-3 py-2 text-xs font-medium shadow-lg">
        🏆 New e1RM: 99 kg
      </div>
    </div>
  );
}
