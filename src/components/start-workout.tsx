"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listRoutines } from "@/server/actions/routines";
import { getPrefillMap, startWorkout } from "@/server/actions/workouts";
import { saveLocalWorkout, type LocalSet } from "@/lib/offline-store";

type Routine = Awaited<ReturnType<typeof listRoutines>>[number];

export function StartWorkout() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineId, setRoutineId] = useState<string>("none");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) listRoutines().then(setRoutines).catch(() => {});
  }, [open]);

  async function begin() {
    setBusy(true);
    const clientId =
      globalThis.crypto?.randomUUID?.() ?? `w_${Date.now()}_${Math.random()}`;
    const chosen = routines.find((r) => r.id === routineId);

    // Seed each routine exercise from the last finished session (progressive
    // overload); offline or first-time exercises fall back to a single 0/0 set.
    let prefill: Record<string, { reps: number; weight: number }[]> = {};
    if (chosen) {
      try {
        prefill = await getPrefillMap(chosen.items.map((it) => it.exerciseId));
      } catch {
        /* offline — start from zero */
      }
    }

    let order = 0;
    const sets: LocalSet[] = chosen
      ? chosen.items.flatMap((it, i) => {
          const last = prefill[it.exerciseId] ?? [];
          const base = last.length > 0 ? last : [{ reps: 0, weight: 0 }];
          return base.map((p, j) => ({
            id: `${clientId}_${i}_${j}`,
            exerciseId: it.exerciseId,
            exerciseName: it.exercise.name,
            muscleGroup: it.exercise.muscleGroup,
            reps: p.reps,
            weight: p.weight,
            prev: last[j] ?? null,
            done: false,
            order: order++,
          }));
        })
      : [];

    await saveLocalWorkout({
      clientId,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      note: null,
      sets,
      synced: false,
    });

    // Best-effort server reservation (idempotent by clientId); ignore offline.
    startWorkout({
      routineId: chosen?.id,
      clientId,
    }).catch(() => {});

    router.push(`/workout/${clientId}`);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button size="lg" className="w-full gap-2 text-base" />}
      >
        <Plus className="size-5" /> Start workout
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a workout</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select
            value={routineId}
            onValueChange={(v) => setRoutineId(v ?? "none")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Empty (add exercises as you go)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Empty — ad-hoc</SelectItem>
              {routines.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name} ({r.items.length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={begin} disabled={busy} className="w-full">
            {busy ? "Starting…" : "Begin"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
