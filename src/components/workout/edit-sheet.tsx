"use client";

import { useEffect, useState } from "react";
import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  cacheExercises,
  getCachedExercises,
  type CachedExercise,
  type LocalSet,
} from "@/lib/offline-store";
import { listExercises } from "@/server/actions/exercises";
import { snapReps, snapWeight } from "@/lib/plates";
import { cn } from "@/lib/utils";

// The two correction surfaces. The dial is the fast path; these are the
// complete one — nothing the dial can reach becomes unreachable without them.

function Stepper({
  label,
  value,
  step,
  min = 0,
  inputMode,
  ariaLabel,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  min?: number;
  inputMode: "decimal" | "numeric";
  ariaLabel: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-stretch overflow-hidden rounded-md border bg-background">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, Math.round((value - step) * 100) / 100))}
        aria-label={`Decrease ${ariaLabel} by ${step}`}
        className="flex size-11 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted active:bg-muted/80 disabled:opacity-40"
        disabled={value <= min}
      >
        <Minus className="size-4" />
      </button>
      <div className="flex flex-1 flex-col items-center justify-center px-1">
        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <input
          type="number"
          inputMode={inputMode}
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          aria-label={ariaLabel}
          className="w-full bg-transparent text-center text-lg font-semibold tabular-nums outline-none"
        />
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.round((value + step) * 100) / 100)}
        aria-label={`Increase ${ariaLabel} by ${step}`}
        className="flex size-11 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted active:bg-muted/80"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

/**
 * Long-press target of the dial centre. The only path in the logging flow that
 * opens the OS keyboard, and it is entirely opt-in.
 */
export function ExactSetDialog({
  set,
  open,
  onOpenChange,
  onPatch,
}: {
  set: LocalSet | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatch: (patch: Partial<LocalSet>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exact numbers</DialogTitle>
        </DialogHeader>
        {set && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Stepper
                label="kg"
                value={set.weight}
                step={2.5}
                inputMode="decimal"
                ariaLabel="weight"
                onChange={(v) => onPatch({ weight: snapWeight(v) })}
              />
              <Stepper
                label="Reps"
                value={set.reps}
                step={1}
                inputMode="numeric"
                ariaLabel="reps"
                onChange={(v) => onPatch({ reps: snapReps(v) })}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                RPE
              </span>
              <Input
                type="number"
                inputMode="decimal"
                step="0.5"
                min="1"
                max="10"
                placeholder="optional"
                value={set.rpe ?? ""}
                onChange={(e) =>
                  onPatch({ rpe: e.target.value ? Number(e.target.value) : null })
                }
                aria-label="RPE"
                className="h-9 max-w-24 text-center text-sm"
              />
            </div>
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

type Group = { exerciseId: string; name: string; sets: LocalSet[] };

export function EditSheet({
  open,
  onOpenChange,
  groups,
  onPatch,
  onDelete,
  onAddSet,
  onAddExercise,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: Group[];
  onPatch: (id: string, patch: Partial<LocalSet>) => void;
  onDelete: (id: string) => void;
  onAddSet: (exerciseId: string) => void;
  onAddExercise: (ex: CachedExercise) => void;
}) {
  const [picking, setPicking] = useState(false);

  // The picker is inline rather than a nested dialog: one modal layer is one
  // fewer thing to dismiss with a bar in your other hand.
  useEffect(() => {
    if (!open) setPicking(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] w-[calc(100%-1.5rem)] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{picking ? "Add exercise" : "Edit workout"}</DialogTitle>
        </DialogHeader>

        {picking ? (
          <ExercisePicker
            onPick={(ex) => {
              onAddExercise(ex);
              setPicking(false);
            }}
            onCancel={() => setPicking(false)}
          />
        ) : (
          <div className="-mx-1 max-h-[65dvh] space-y-4 overflow-y-auto px-1">
            {groups.map((g) => (
              <div key={g.exerciseId} className="space-y-2">
                <h3 className="text-sm font-semibold">{g.name}</h3>
                {g.sets.map((s, i) => (
                  <div
                    key={s.id}
                    className={cn(
                      "rounded-lg border p-2.5",
                      s.done ? "border-primary/40 bg-primary/5" : "bg-background",
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Set {i + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onPatch(s.id, { done: !s.done })}
                          className={cn(
                            "h-9 rounded-md border px-2.5 text-sm font-medium transition-colors",
                            s.done
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-input hover:border-primary/40",
                          )}
                        >
                          {s.done ? "Logged" : "Mark"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(s.id)}
                          aria-label={`Delete set ${i + 1}`}
                          className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Stepper
                        label="kg"
                        value={s.weight}
                        step={2.5}
                        inputMode="decimal"
                        ariaLabel={`set ${i + 1} weight`}
                        onChange={(v) => onPatch(s.id, { weight: snapWeight(v) })}
                      />
                      <Stepper
                        label="Reps"
                        value={s.reps}
                        step={1}
                        inputMode="numeric"
                        ariaLabel={`set ${i + 1} reps`}
                        onChange={(v) => onPatch(s.id, { reps: snapReps(v) })}
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        RPE
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        min="1"
                        max="10"
                        placeholder="optional"
                        value={s.rpe ?? ""}
                        onChange={(e) =>
                          onPatch(s.id, {
                            rpe: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        aria-label={`Set ${i + 1} RPE`}
                        className="h-8 max-w-24 text-center text-sm"
                      />
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1"
                  onClick={() => onAddSet(g.exerciseId)}
                >
                  <Plus className="size-4" /> Add set
                </Button>
              </div>
            ))}

            <Button
              variant="secondary"
              className="w-full gap-2"
              onClick={() => setPicking(true)}
            >
              <Plus className="size-4" /> Add exercise
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ExercisePicker({
  onPick,
  onCancel,
}: {
  onPick: (ex: CachedExercise) => void;
  onCancel: () => void;
}) {
  const [q, setQ] = useState("");
  const [list, setList] = useState<CachedExercise[]>([]);
  // Starts true: the fetch below fires on the mount that follows, and flipping
  // it inside the effect would be a cascading render for no gain.
  const [loading, setLoading] = useState(true);

  // Fetch the catalogue once and filter client-side — instant search, and the
  // localStorage cache keeps the picker usable with no signal in the basement.
  useEffect(() => {
    listExercises()
      .then((l) => {
        setList(l);
        cacheExercises(l);
      })
      .catch(() => setList(getCachedExercises()))
      .finally(() => setLoading(false));
  }, []);

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? list.filter((ex) => ex.name.toLowerCase().includes(needle))
    : list;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
        <Input
          autoFocus
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="max-h-[55dvh] space-y-1 overflow-y-auto">
        {loading && list.length === 0 ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-md px-3 py-2"
            >
              <span className="gb-skeleton h-4 w-40" />
              <span className="gb-skeleton h-3 w-12" />
            </div>
          ))
        ) : (
          <>
            {filtered.map((ex) => (
              <button
                key={ex.id}
                onClick={() => onPick(ex)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
              >
                <span>{ex.name}</span>
                <span className="text-xs text-muted-foreground">
                  {ex.muscleGroup}
                </span>
              </button>
            ))}
            {!loading && filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No matches.
              </p>
            )}
          </>
        )}
      </div>
      <Button variant="ghost" className="w-full" onClick={onCancel}>
        Back
      </Button>
    </div>
  );
}
