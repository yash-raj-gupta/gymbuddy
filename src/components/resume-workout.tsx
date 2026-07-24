"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  deleteLocalWorkout,
  getInProgressWorkouts,
  type LocalWorkout,
} from "@/lib/offline-store";

// Surfaces an unfinished local session so a dropped connection or a closed
// tab mid-gym doesn't lose the workout. Reads IndexedDB only — works offline.
export function ResumeWorkout() {
  const router = useRouter();
  const [workout, setWorkout] = useState<LocalWorkout | null>(null);

  useEffect(() => {
    getInProgressWorkouts()
      .then((list) => setWorkout(list[0] ?? null))
      .catch(() => {});
  }, []);

  if (!workout) return null;

  const done = workout.sets.filter((s) => s.done).length;

  async function discard() {
    if (!workout) return;
    await deleteLocalWorkout(workout.clientId);
    setWorkout(null);
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div>
          <p className="font-medium">Workout in progress</p>
          <p className="text-sm text-muted-foreground sm:text-base">
            Started{" "}
            {new Date(workout.startedAt).toLocaleString("en-IN", {
              weekday: "short",
              hour: "numeric",
              minute: "2-digit",
            })}{" "}
            · {done}/{workout.sets.length} sets done
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Discard workout"
            onClick={discard}
          >
            <Trash2 className="size-4" />
          </Button>
          <Button
            className="gap-2"
            onClick={() => router.push(`/workout/${workout.clientId}`)}
          >
            <Play className="size-4" /> Resume
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
