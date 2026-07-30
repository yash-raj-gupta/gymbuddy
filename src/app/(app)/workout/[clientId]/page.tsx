"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Flag, ListChecks, Repeat2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RestTimerProvider, useRestTimer } from "@/components/rest-timer";
import { Dial } from "@/components/workout/dial";
import { SetPips } from "@/components/workout/set-pips";
import { ExerciseStage } from "@/components/workout/exercise-stage";
import { EditSheet, ExactSetDialog } from "@/components/workout/edit-sheet";
import {
  getLocalWorkout,
  saveLocalWorkout,
  type CachedExercise,
  type LocalWorkout,
  type LocalSet,
} from "@/lib/offline-store";
import { confirmHaptic } from "@/lib/haptics";
import { snapReps, snapWeight, stepReps, stepWeight } from "@/lib/plates";
import { useOnline } from "@/lib/use-online";
import { useWakeLock } from "@/lib/use-wake-lock";
import { getPrefillSets, syncOfflineWorkout } from "@/server/actions/workouts";

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
  const online = useOnline();
  const [workout, setWorkout] = useState<LocalWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [exactOpen, setExactOpen] = useState(false);

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

  // Group sets by exercise, preserving first-seen order.
  const groups = useMemo(() => {
    const out: { exerciseId: string; name: string; sets: LocalSet[] }[] = [];
    for (const s of workout?.sets ?? []) {
      let g = out.find((x) => x.exerciseId === s.exerciseId);
      if (!g) {
        g = { exerciseId: s.exerciseId, name: s.exerciseName, sets: [] };
        out.push(g);
      }
      g.sets.push(s);
    }
    return out;
  }, [workout]);

  // Selection is derived, not stored, so a deleted set can never strand the
  // dial on an id that no longer exists.
  const sets = workout?.sets ?? [];
  const current =
    sets.find((s) => s.id === selectedSetId) ??
    sets.find((s) => !s.done) ??
    sets[0] ??
    null;
  const groupIndex = current
    ? groups.findIndex((g) => g.exerciseId === current.exerciseId)
    : -1;
  const group = groupIndex >= 0 ? groups[groupIndex] : null;

  const patchSet = useCallback(
    (id: string, patch: Partial<LocalSet>) => {
      if (!workout) return;
      const before = workout.sets.find((s) => s.id === id);
      // Auto-start rest the moment a set is flipped to done.
      if (before && !before.done && patch.done === true) restTimer.start();
      persist({
        ...workout,
        sets: workout.sets.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      });
    },
    [persist, restTimer, workout],
  );

  const deleteSet = useCallback(
    (id: string) => {
      if (!workout) return;
      persist({ ...workout, sets: workout.sets.filter((s) => s.id !== id) });
    },
    [persist, workout],
  );

  const addSet = useCallback(
    (exerciseId: string) => {
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
      persist({ ...workout, sets: [...workout.sets, newSet] });
    },
    [clientId, persist, workout],
  );

  const addExercise = useCallback(
    async (ex: CachedExercise) => {
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
        // Prefills come out of Postgres as Float, so they can arrive off the
        // plate grid the dial steps on.
        reps: snapReps(p.reps),
        weight: snapWeight(p.weight),
        prev: prefill[i] ?? null,
        done: false,
        order: workout.sets.length + i,
      }));
      persist({ ...workout, sets: [...workout.sets, ...newSets] });
      setSelectedSetId(newSets[0]?.id ?? null);
    },
    [clientId, persist, workout],
  );

  /** Log the current set and move to whatever should be logged next. */
  const logCurrent = useCallback(
    (values?: { weight: number; reps: number }) => {
      if (!current || !group) return;
      confirmHaptic();
      patchSet(current.id, { ...values, done: true });
      const rest = group.sets.filter((s) => s.id !== current.id && !s.done);
      if (rest.length > 0) {
        setSelectedSetId(rest[0].id);
        return;
      }
      // Exercise finished — fall through to the next one with work left.
      const nextGroup = groups
        .slice(groupIndex + 1)
        .find((g) => g.sets.some((s) => !s.done));
      const nextSet = nextGroup?.sets.find((s) => !s.done);
      if (nextSet) setSelectedSetId(nextSet.id);
    },
    [current, group, groupIndex, groups, patchSet],
  );

  const goToGroup = useCallback(
    (delta: number) => {
      if (groups.length < 2 || groupIndex < 0) return;
      const next =
        groups[(groupIndex + delta + groups.length) % groups.length];
      const target = next.sets.find((s) => !s.done) ?? next.sets[0];
      if (target) setSelectedSetId(target.id);
    },
    [groupIndex, groups],
  );

  async function finish() {
    if (!workout) return;
    const doneSets = workout.sets.filter((s) => s.done);
    if (doneSets.length === 0) {
      toast.error("Log at least one set first.");
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
      <main className="mx-auto flex h-[100dvh] max-w-md flex-col gap-4 px-4 py-5">
        <div className="gb-skeleton h-10 w-full rounded-lg" />
        <div className="gb-skeleton h-24 w-full rounded-xl" />
        <div className="gb-skeleton mx-auto aspect-square w-full max-w-[min(20rem,70vw,40dvh)] rounded-full" />
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

  const resting = restTimer.running;

  return (
    <main
      className="mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <header className="shrink-0 space-y-1 px-4 pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Elapsed startedAt={workout.startedAt} />
            {!online && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[0.7rem] font-medium text-amber-600 dark:text-amber-400">
                Offline
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label="Edit sets"
              onClick={() => setEditOpen(true)}
            >
              <ListChecks className="size-5" />
            </Button>
            <Button
              onClick={finish}
              disabled={finishing}
              size="lg"
              className="gap-2"
            >
              <Flag className="size-4" />
              {finishing ? "Saving…" : "Finish"}
            </Button>
          </div>
        </div>
        {group && (
          <SetPips
            sets={group.sets}
            currentId={current?.id ?? null}
            onSelect={setSelectedSetId}
          />
        )}
      </header>

      {current && group ? (
        <>
          <ExerciseStage
            name={group.name}
            position={groupIndex + 1}
            total={groups.length}
            weight={current.weight}
            reps={current.reps}
            prev={current.prev}
            done={current.done}
            onPrev={() => goToGroup(-1)}
            onNext={() => goToGroup(1)}
          />

          <footer className="shrink-0 space-y-3 px-4 pb-4">
            <Button
              variant="secondary"
              className="h-12 w-full gap-2 text-base"
              disabled={!current.prev || resting}
              onClick={() =>
                current.prev &&
                logCurrent({
                  weight: snapWeight(current.prev.weight),
                  reps: snapReps(current.prev.reps),
                })
              }
            >
              <Repeat2 className="size-5" /> Same as last time
            </Button>
            <Dial
              mode={resting ? "rest" : "input"}
              weight={current.weight}
              reps={current.reps}
              onWeightDetents={(d) =>
                patchSet(current.id, { weight: stepWeight(current.weight, d) })
              }
              onRepsDetents={(d) =>
                patchSet(current.id, { reps: stepReps(current.reps, d) })
              }
              onLog={() => logCurrent()}
              onSkipRest={restTimer.reset}
              onLongPress={() => setExactOpen(true)}
              restRemaining={restTimer.remaining}
              restDuration={restTimer.duration}
            />
          </footer>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-muted-foreground">
            No exercises yet. Add one to start logging.
          </p>
          <Button onClick={() => setEditOpen(true)}>Add exercise</Button>
        </div>
      )}

      <EditSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        groups={groups}
        onPatch={patchSet}
        onDelete={deleteSet}
        onAddSet={addSet}
        onAddExercise={addExercise}
      />
      <ExactSetDialog
        set={current}
        open={exactOpen}
        onOpenChange={setExactOpen}
        onPatch={(patch) => current && patchSet(current.id, patch)}
      />
    </main>
  );
}

/** Workout clock. Derived from the start timestamp, so it survives a reload. */
function Elapsed({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const secs = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return (
    <span
      className="font-mono text-sm font-semibold tabular-nums text-muted-foreground"
      aria-label="Workout elapsed time"
    >
      {h > 0 ? `${h}:${String(m).padStart(2, "0")}` : m}:
      {String(s).padStart(2, "0")}
    </span>
  );
}
