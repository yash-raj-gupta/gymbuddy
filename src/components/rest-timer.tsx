"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Timer, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRESETS = [60, 90, 120, 180];

export function RestTimer() {
  const [duration, setDuration] = useState(90);
  const [remaining, setRemaining] = useState(90);
  const [running, setRunning] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
  }, []);

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          stop();
          setRunning(false);
          // Vibration API — gymbuddy-prd.md §4 feature 4 (tab open).
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate([300, 120, 300]);
          }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return stop;
  }, [running, stop]);

  function setPreset(s: number) {
    stop();
    setRunning(false);
    setDuration(s);
    setRemaining(s);
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = duration ? (remaining / duration) * 100 : 0;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Timer className="size-4 text-primary" /> Rest timer
      </div>
      <div className="relative mb-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-3xl font-bold tabular-nums">
          {mm}:{ss}
        </span>
        <div className="flex gap-2">
          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => setRunning((r) => !r)}
          >
            {running ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => {
              stop();
              setRunning(false);
              setRemaining(duration);
            }}
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        {PRESETS.map((s) => (
          <Button
            key={s}
            size="xs"
            variant={duration === s ? "default" : "outline"}
            onClick={() => setPreset(s)}
            className="flex-1"
          >
            {s}s
          </Button>
        ))}
      </div>
    </div>
  );
}
