"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  Minus,
  Trash2,
  Check,
  Search,
  Flag,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  RestTimer,
  RestTimerProvider,
  useRestTimer,
} from "@/components/rest-timer";
import {
  cacheExercises,
  getCachedExercises,
  getLocalWorkout,
  saveLocalWorkout,
  type CachedExercise,
  type LocalWorkout,
  type LocalSet,
} from "@/lib/offline-store";
import { useWakeLock } from "@/lib/use-wake-lock";
import { listExercises } from "@/server/actions/exercises";
import { getPrefillSets, syncOfflineWorkout } from "@/server/actions/workouts";

type Exercise = CachedExercise;

/** Batches IndexedDB writes without letting the UI lag behind them. */
const PERSIST_DEBOUNCE_MS = 300;

export default function ActiveWorkoutPage() {
  const { clientId } = useParams<{ clientId: string }>();
  return (
    // Keyed so switching between two active workouts remounts the timer
    // instead of carrying one workout's countdown into the other.
    <RestTimerProvider key={clientId} storageKey={`gb-rest-${clientId}`}>
      <WorkoutBody />
    </RestTimerProvider>
  );
}

function WorkoutBody() {
  const { clientId } = useParams<{ clientId: string }>();
  const router = useRouter();
  const restTimer = useRestTimer();
  const [workout, setWorkout] = useState<LocalWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    getLocalWorkout(clientId)
      .then((w) => setWorkout(w ?? null))
      .finally(() => setLoading(false));
  }, [clientId]);

  const pendingWrite = useRef<LocalWorkout | null>(null);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushWrite = useCallback(async () => {
    if (writeTimer.current) {
      clearTimeout(writeTimer.current);
      writeTimer.current = null;
    }
    const next = pendingWrite.current;
    pendingWrite.current = null;
    if (next) await saveLocalWorkout(next);
  }, []);

  const cancelWrite = useCallback(() => {
    if (writeTimer.current) {
      clearTimeout(writeTimer.current);
      writeTimer.current = null;
    }
    pendingWrite.current = null;
  }, []);

  // React state updates immediately; the IndexedDB write is batched. The dial
  // changes weight at every detent of a drag, and writing the whole workout
  // object per detent is an order of magnitude more writes than the steppers
  // ever made. The first change in a window still lands within 300 ms.
  const persist = useCallback(
    (next: LocalWorkout) => {
      setWorkout(next);
      pendingWrite.current = next;
      if (writeTimer.current) return;
      writeTimer.current = setTimeout(() => {
        writeTimer.current = null;
        void flushWrite();
      }, PERSIST_DEBOUNCE_MS);
    },
    [flushWrite],
  );

  // A batched write must not be lost to a backgrounded tab or a navigation —
  // those are exactly the moments a phone takes away mid-workout.
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") void flushWrite();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void flushWrite();
    };
  }, [flushWrite]);

  useWakeLock(!loading && workout !== null && !finishing);

  function patchSet(id: string, patch: Partial<LocalSet>) {
    if (!workout) return;
    const prev = workout.sets.find((s) => s.id === id);
    // Auto-start rest timer the moment a set is flipped to done.
    if (prev && !prev.done && patch.done === true) restTimer.start();
    void persist({
      ...workout,
      sets: workout.sets.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });
  }

  function deleteSet(id: string) {
    if (!workout) return;
    void persist({ ...workout, sets: workout.sets.filter((s) => s.id !== id) });
  }

  function addSet(exerciseId: string) {
    if (!workout) return;
    const ofEx = workout.sets.filter((s) => s.exerciseId === exerciseId);
    const last = ofEx[ofEx.length - 1];
    const template = last ?? workout.sets[0];
    if (!template) return;
    const newSet: LocalSet = {
      id: `${clientId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      exerciseId,
      exerciseName: template.exerciseName,
      muscleGroup: template.muscleGroup,
      reps: last?.reps ?? 0,
      weight: last?.weight ?? 0,
      done: false,
      order: workout.sets.length,
    };
    void persist({ ...workout, sets: [...workout.sets, newSet] });
  }

  async function addExercise(ex: Exercise) {
    if (!workout) return;
    let prefill: { reps: number; weight: number }[] = [];
    try {
      prefill = await getPrefillSets(ex.id);
    } catch {
      /* offline → start from zero */
    }
    const base = prefill.length > 0 ? prefill : [{ reps: 0, weight: 0 }];
    const newSets: LocalSet[] = base.map((p, i) => ({
      id: `${clientId}_${Date.now()}_${i}`,
      exerciseId: ex.id,
      exerciseName: ex.name,
      muscleGroup: ex.muscleGroup,
      reps: p.reps,
      weight: p.weight,
      prev: prefill[i] ?? null,
      done: false,
      order: workout.sets.length + i,
    }));
    void persist({ ...workout, sets: [...workout.sets, ...newSets] });
  }

  async function finish() {
    if (!workout) return;
    const doneSets = workout.sets.filter((s) => s.done);
    if (doneSets.length === 0) {
      toast.error("Mark at least one set as done first.");
      return;
    }
    setFinishing(true);
    // Drop any batched write still holding the pre-finish workout — letting it
    // fire after this would clear finishedAt and resurrect the session.
    cancelWrite();
    const finished: LocalWorkout = {
      ...workout,
      finishedAt: new Date().toISOString(),
      sets: workout.sets.filter((s) => s.done || s.reps > 0 || s.weight > 0),
    };
    await saveLocalWorkout(finished);
    try {
      await syncOfflineWorkout({
        clientId: finished.clientId,
        startedAt: finished.startedAt,
        finishedAt: finished.finishedAt,
        note: finished.note,
        sets: finished.sets.map((s) => ({
          exerciseId: s.exerciseId,
          reps: s.reps,
          weight: s.weight,
          rpe: s.rpe ?? null,
          done: s.done,
          order: s.order,
        })),
      });
      await saveLocalWorkout({ ...finished, synced: true });
      toast.success("Workout saved.");
    } catch {
      toast.success("Saved offline — will sync when you're back online.");
    }
    router.push("/dashboard");
  }

  if (loading) {
    return (
      <main className="gb-page-in mx-auto max-w-3xl space-y-4 px-4 py-5 pb-36">
        <div className="space-y-1.5">
          <div className="gb-skeleton h-6 w-40" />
          <div className="gb-skeleton h-3 w-28" />
        </div>
        <div className="gb-skeleton h-28 w-full rounded-xl" />
        <div className="gb-skeleton h-40 w-full rounded-xl" />
      </main>
    );
  }
  if (!workout) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 px-4 py-10 text-center">
        <p className="text-muted-foreground">
          This workout isn&rsquo;t on this device.
        </p>
        <Button onClick={() => router.push("/dashboard")}>Back to home</Button>
      </main>
    );
  }

  // Group sets by exercise, preserving first-seen order.
  const groups: { exerciseId: string; name: string; sets: LocalSet[] }[] = [];
  for (const s of workout.sets) {
    let g = groups.find((x) => x.exerciseId === s.exerciseId);
    if (!g) {
      g = { exerciseId: s.exerciseId, name: s.exerciseName, sets: [] };
      groups.push(g);
    }
    g.sets.push(s);
  }

  const doneCount = workout.sets.filter((s) => s.done).length;
  const totalVolume = workout.sets
    .filter((s) => s.done)
    .reduce((sum, s) => sum + s.weight * s.reps, 0);

  return (
    <main className="gb-page-in mx-auto max-w-3xl space-y-4 px-4 py-5 pb-36">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
          Active workout
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base lg:text-lg">
          Started{" "}
          {new Date(workout.startedAt).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Sticky rest timer — always visible while logging. */}
      <div className="sticky top-2 z-20 -mx-1">
        <RestTimer />
      </div>

      <AnimatePresence initial={false}>
        {groups.map((g) => (
          <motion.div
            key={g.exerciseId}
            layout
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg sm:text-xl lg:text-2xl">
                  {g.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <AnimatePresence initial={false}>
                  {g.sets.map((s, i) => (
                    <motion.div
                      key={s.id}
                      layout
                      initial={{ opacity: 0, height: 0, y: -6 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0, x: -24 }}
                      transition={{
                        duration: 0.22,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <SetTile
                        index={i}
                        set={s}
                        onPatch={(p) => patchSet(s.id, p)}
                        onDelete={() => deleteSet(s.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1"
                  onClick={() => addSet(g.exerciseId)}
                >
                  <Plus className="size-4" /> Add set
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      <AddExerciseDialog onPick={addExercise} />

      {/* Fixed Finish bar. Safe-area-aware on iOS notch devices. */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="text-sm leading-tight text-muted-foreground sm:text-base">
            <span className="font-semibold text-foreground tabular-nums">
              {doneCount}
            </span>{" "}
            sets ·{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {Math.round(totalVolume).toLocaleString("en-IN")}
            </span>{" "}
            kg
          </div>
          <Button
            onClick={finish}
            disabled={finishing}
            size="lg"
            className="min-w-[8.5rem] gap-2"
          >
            <Flag className="size-4" />
            {finishing ? "Saving…" : "Finish"}
          </Button>
        </div>
      </div>
    </main>
  );
}

function SetTile({
  index,
  set,
  onPatch,
  onDelete,
}: {
  index: number;
  set: LocalSet;
  onPatch: (p: Partial<LocalSet>) => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`rounded-lg border p-2.5 transition-colors ${
        set.done ? "border-primary/40 bg-primary/5" : "bg-background"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Set {index + 1}
          {set.prev && (
            <span className="ml-2 normal-case tracking-normal tabular-nums">
              Last: {set.prev.weight} kg × {set.prev.reps}
            </span>
          )}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPatch({ done: !set.done })}
            aria-label={set.done ? "Mark set undone" : "Mark set done"}
            className={`flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-sm font-medium transition-colors ${
              set.done
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input hover:border-primary/40"
            }`}
          >
            <Check className="size-4" />
            {set.done ? "Done" : "Mark"}
          </button>
          <button
            onClick={onDelete}
            aria-label="Delete set"
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stepper
          label="kg"
          value={set.weight}
          step={2.5}
          inputMode="decimal"
          ariaLabel={`Set ${index + 1} weight`}
          onChange={(v) => onPatch({ weight: v })}
        />
        <Stepper
          label="Reps"
          value={set.reps}
          step={1}
          min={0}
          inputMode="numeric"
          ariaLabel={`Set ${index + 1} reps`}
          onChange={(v) => onPatch({ reps: Math.max(0, Math.round(v)) })}
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
          value={set.rpe ?? ""}
          onChange={(e) =>
            onPatch({
              rpe: e.target.value ? Number(e.target.value) : null,
            })
          }
          aria-label={`Set ${index + 1} RPE`}
          className="h-8 max-w-24 text-center text-sm"
        />
      </div>
    </div>
  );
}

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
  function bump(delta: number) {
    const next = Math.max(min, Math.round((value + delta) * 100) / 100);
    onChange(next);
  }
  return (
    <div className="flex items-stretch overflow-hidden rounded-md border bg-background">
      <button
        type="button"
        onClick={() => bump(-step)}
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
        onClick={() => bump(step)}
        aria-label={`Increase ${ariaLabel} by ${step}`}
        className="flex size-11 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted active:bg-muted/80"
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}

function AddExerciseDialog({ onPick }: { onPick: (ex: Exercise) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [list, setList] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch the full catalogue once per open and filter client-side — instant
  // search, and the localStorage cache keeps the picker usable offline.
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listExercises()
      .then((l) => {
        setList(l);
        cacheExercises(l);
      })
      .catch(() => setList(getCachedExercises()))
      .finally(() => setLoading(false));
  }, [open]);

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? list.filter((ex) => ex.name.toLowerCase().includes(needle))
    : list;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="secondary" className="w-full gap-2" />}
      >
        <Plus className="size-4" /> Add exercise
      </DialogTrigger>
      <DialogContent className="max-h-[80dvh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Add exercise</DialogTitle>
        </DialogHeader>
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
                  onClick={() => {
                    onPick(ex);
                    setOpen(false);
                    setQ("");
                  }}
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
      </DialogContent>
    </Dialog>
  );
}
