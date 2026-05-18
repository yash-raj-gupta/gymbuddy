"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Trash2, Check, Search, Flag } from "lucide-react";
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
import { RestTimer } from "@/components/rest-timer";
import {
  getLocalWorkout,
  saveLocalWorkout,
  type LocalWorkout,
  type LocalSet,
} from "@/lib/offline-store";
import { listExercises } from "@/server/actions/exercises";
import { getPrefillSets, syncOfflineWorkout } from "@/server/actions/workouts";

type Exercise = Awaited<ReturnType<typeof listExercises>>[number];

export default function ActiveWorkoutPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const router = useRouter();
  const [workout, setWorkout] = useState<LocalWorkout | null>(null);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    getLocalWorkout(clientId)
      .then((w) => setWorkout(w ?? null))
      .finally(() => setLoading(false));
  }, [clientId]);

  const persist = useCallback(async (next: LocalWorkout) => {
    setWorkout(next);
    await saveLocalWorkout(next);
  }, []);

  function patchSet(id: string, patch: Partial<LocalSet>) {
    if (!workout) return;
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
      <main className="mx-auto max-w-3xl px-4 py-10 text-sm text-muted-foreground">
        Loading workout…
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

  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-5 pb-28">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Active workout</h1>
          <p className="text-xs text-muted-foreground">
            Started{" "}
            {new Date(workout.startedAt).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Button onClick={finish} disabled={finishing} className="gap-2">
          <Flag className="size-4" />
          {finishing ? "Saving…" : "Finish"}
        </Button>
      </div>

      <RestTimer />

      {groups.map((g) => (
        <Card key={g.exerciseId}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{g.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-[1.5rem_1fr_1fr_2.5rem_2rem] items-center gap-2 text-xs text-muted-foreground">
              <span>#</span>
              <span>Weight (kg)</span>
              <span>Reps</span>
              <span className="text-center">Done</span>
              <span />
            </div>
            {g.sets.map((s, i) => (
              <div
                key={s.id}
                className="grid grid-cols-[1.5rem_1fr_1fr_2.5rem_2rem] items-center gap-2"
              >
                <span className="text-sm text-muted-foreground">{i + 1}</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={s.weight || ""}
                  onChange={(e) =>
                    patchSet(s.id, { weight: Number(e.target.value) || 0 })
                  }
                  className="h-9"
                />
                <Input
                  type="number"
                  inputMode="numeric"
                  value={s.reps || ""}
                  onChange={(e) =>
                    patchSet(s.id, { reps: Number(e.target.value) || 0 })
                  }
                  className="h-9"
                />
                <button
                  onClick={() => patchSet(s.id, { done: !s.done })}
                  aria-label="Toggle set done"
                  className={`mx-auto flex size-7 items-center justify-center rounded-md border ${
                    s.done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input"
                  }`}
                >
                  {s.done && <Check className="size-4" />}
                </button>
                <button
                  onClick={() => deleteSet(s.id)}
                  aria-label="Delete set"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
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
      ))}

      <AddExerciseDialog onPick={addExercise} />
    </main>
  );
}

function AddExerciseDialog({
  onPick,
}: {
  onPick: (ex: Exercise) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [list, setList] = useState<Exercise[]>([]);

  useEffect(() => {
    if (!open) return;
    listExercises(q || undefined)
      .then(setList)
      .catch(() => {});
  }, [open, q]);

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
          {list.map((ex) => (
            <button
              key={ex.id}
              onClick={() => {
                onPick(ex);
                setOpen(false);
                setQ("");
              }}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <span>{ex.name}</span>
              <span className="text-xs text-muted-foreground">
                {ex.muscleGroup}
              </span>
            </button>
          ))}
          {list.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No matches.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
