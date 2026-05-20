"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { listExercises } from "@/server/actions/exercises";
import { createRoutine, deleteRoutine } from "@/server/actions/routines";

type Exercise = Awaited<ReturnType<typeof listExercises>>[number];

export function CreateRoutineButton({ atLimit }: { atLimit: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [q, setQ] = useState("");
  const [all, setAll] = useState<Exercise[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingList(true);
    listExercises()
      .then(setAll)
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, [open]);

  function toggle(id: string) {
    setPicked((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  }

  async function submit() {
    if (!name.trim() || picked.length === 0) {
      toast.error("Name the routine and pick at least one exercise.");
      return;
    }
    setBusy(true);
    try {
      await createRoutine({ name, exerciseIds: picked });
      toast.success("Routine saved.");
      setName("");
      setPicked([]);
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save routine.");
    } finally {
      setBusy(false);
    }
  }

  const filtered = q
    ? all.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()))
    : all;

  if (atLimit) {
    return (
      <Link
        href="/pricing"
        className={buttonVariants({ size: "sm", variant: "outline" })}
      >
        Upgrade for more routines
      </Link>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1" />}>
        <Plus className="size-4" /> New routine
      </DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Create routine</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="r-name">Name</Label>
            <Input
              id="r-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Push Day"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Filter exercises…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="max-h-[40dvh] space-y-1 overflow-y-auto rounded-md border p-1">
            {loadingList && all.length === 0 &&
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded px-3 py-2"
                >
                  <span className="gb-skeleton h-4 w-40" />
                  <span className="gb-skeleton h-3 w-12" />
                </div>
              ))}
            {filtered.map((e) => (
              <button
                key={e.id}
                onClick={() => toggle(e.id)}
                className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm ${
                  picked.includes(e.id)
                    ? "bg-primary/10 text-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <span>{e.name}</span>
                <span className="text-xs text-muted-foreground">
                  {picked.includes(e.id) ? "✓ added" : e.muscleGroup}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {picked.length} selected
          </p>
          <Button onClick={submit} disabled={busy} className="w-full">
            {busy ? "Saving…" : "Save routine"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteRoutineButton({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      aria-label="Delete routine"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await deleteRoutine(id);
          router.refresh();
        } catch {
          toast.error("Could not delete.");
          setBusy(false);
        }
      }}
      className="text-muted-foreground hover:text-destructive"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
