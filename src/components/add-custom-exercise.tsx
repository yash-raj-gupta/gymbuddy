"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { createCustomExercise } from "@/server/actions/exercises";
import { MUSCLE_GROUPS } from "@/lib/exercise-catalogue";

export function AddCustomExercise() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [mg, setMg] = useState<string>("CHEST");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createCustomExercise({ name, muscleGroup: mg });
      toast.success("Exercise added.");
      setName("");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Could not add exercise.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button size="sm" variant="outline" className="gap-1" />}
      >
        <Plus className="size-4" /> Custom
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a custom exercise</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ex-name">Name</Label>
            <Input
              id="ex-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pendlay Row"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Muscle group</Label>
            <Select value={mg} onValueChange={(v) => setMg(v ?? "CHEST")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MUSCLE_GROUPS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={submit} disabled={busy} className="w-full">
            {busy ? "Adding…" : "Add exercise"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
