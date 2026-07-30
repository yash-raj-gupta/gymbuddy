"use client";

import type { LocalSet } from "@/lib/offline-store";
import { cn } from "@/lib/utils";

// One plate-shaped pip per set of the current exercise. Filled means logged.
// Tapping jumps — the only way back to a set you already passed without
// opening the edit sheet.

export function SetPips({
  sets,
  currentId,
  onSelect,
}: {
  sets: LocalSet[];
  currentId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto"
      role="tablist"
      aria-label="Sets"
    >
      {sets.map((s, i) => {
        const current = s.id === currentId;
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={current}
            aria-label={`Set ${i + 1}${s.done ? ", logged" : ""}`}
            onClick={() => onSelect(s.id)}
            // 44px tall target; the visible pip is smaller and centred in it.
            className="flex h-11 min-w-8 shrink-0 items-center justify-center px-0.5"
          >
            <span
              className={cn(
                "flex h-7 w-6 items-center justify-center rounded-[4px] border-2 text-[0.7rem] font-bold tabular-nums transition-colors",
                s.done
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground",
                current && "ring-2 ring-ring ring-offset-2 ring-offset-background",
              )}
            >
              {i + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}
