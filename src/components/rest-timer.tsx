"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Timer, Play, Pause, RotateCcw, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const PRESETS = [60, 90, 120, 180];

type Ctx = {
  duration: number;
  remaining: number;
  running: boolean;
  notifEnabled: boolean;
  start: (seconds?: number) => void;
  toggle: () => void;
  reset: () => void;
  setPreset: (s: number) => void;
  requestNotif: () => void;
};

const RestTimerCtx = createContext<Ctx | null>(null);

export function useRestTimer(): Ctx {
  const v = useContext(RestTimerCtx);
  if (!v) throw new Error("useRestTimer must be used inside RestTimerProvider");
  return v;
}

// Short beep via Web Audio — no asset to ship.
function playBeep() {
  try {
    const AC =
      (window as unknown as { AudioContext?: typeof AudioContext })
        .AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.0001;
    o.connect(g).connect(ctx.destination);
    const now = ctx.currentTime;
    // Two-tone "ding-ding".
    g.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    o.start(now);
    o.stop(now + 0.24);
    setTimeout(() => {
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      o2.type = "sine";
      o2.frequency.value = 1175;
      g2.gain.value = 0.0001;
      o2.connect(g2).connect(ctx.destination);
      const t = ctx.currentTime;
      g2.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
      o2.start(t);
      o2.stop(t + 0.28);
      // Close shortly after to free hardware on iOS.
      setTimeout(() => ctx.close().catch(() => {}), 600);
    }, 250);
  } catch {
    /* audio is best-effort */
  }
}

function fireNotification() {
  try {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    // Only when the tab isn't focused — otherwise the audio + vibration are enough.
    if (document.visibilityState === "visible" && document.hasFocus()) return;
    new Notification("Rest done — back to it.", {
      body: "Next set time.",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "gb-rest",
    });
  } catch {
    /* ignore */
  }
}

export function RestTimerProvider({ children }: { children: React.ReactNode }) {
  const [duration, setDuration] = useState(90);
  const [remaining, setRemaining] = useState(90);
  const [running, setRunning] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  // Snapshot Notification.permission on mount.
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifEnabled(Notification.permission === "granted");
    }
  }, []);

  const stopTick = useCallback(() => {
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
  }, []);

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          stopTick();
          setRunning(false);
          // gymbuddy-prd.md §4 feature 4: vibration; plus audio + notification.
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate([300, 120, 300]);
          }
          playBeep();
          fireNotification();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return stopTick;
  }, [running, stopTick]);

  const start = useCallback(
    (seconds?: number) => {
      const s = seconds ?? duration;
      setDuration(s);
      setRemaining(s);
      setRunning(true);
    },
    [duration],
  );

  const toggle = useCallback(() => {
    setRunning((r) => {
      // If finished, Play restarts from full duration.
      if (!r && remaining === 0) setRemaining(duration);
      return !r;
    });
  }, [remaining, duration]);

  const reset = useCallback(() => {
    stopTick();
    setRunning(false);
    setRemaining(duration);
  }, [duration, stopTick]);

  const setPreset = useCallback(
    (s: number) => {
      stopTick();
      setRunning(false);
      setDuration(s);
      setRemaining(s);
    },
    [stopTick],
  );

  const requestNotif = useCallback(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") {
      setNotifEnabled(true);
      return;
    }
    if (Notification.permission === "denied") return;
    Notification.requestPermission().then((p) => {
      setNotifEnabled(p === "granted");
    });
  }, []);

  const value: Ctx = {
    duration,
    remaining,
    running,
    notifEnabled,
    start,
    toggle,
    reset,
    setPreset,
    requestNotif,
  };

  return (
    <RestTimerCtx.Provider value={value}>{children}</RestTimerCtx.Provider>
  );
}

export function RestTimer() {
  const t = useRestTimer();
  const mm = String(Math.floor(t.remaining / 60)).padStart(2, "0");
  const ss = String(t.remaining % 60).padStart(2, "0");
  const pct = t.duration ? (t.remaining / t.duration) * 100 : 0;
  const denied =
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "denied";

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between text-sm font-medium">
        <span className="flex items-center gap-2">
          <Timer className="size-4 text-primary" /> Rest timer
        </span>
        <button
          type="button"
          onClick={t.requestNotif}
          disabled={denied}
          title={
            denied
              ? "Notifications blocked in browser settings"
              : t.notifEnabled
                ? "Notifications on"
                : "Enable notifications"
          }
          aria-label="Toggle rest-end notifications"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          {t.notifEnabled ? (
            <Bell className="size-4 text-primary" />
          ) : (
            <BellOff className="size-4" />
          )}
        </button>
      </div>
      <div className="relative mb-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-3xl font-bold tabular-nums sm:text-4xl">
          {mm}:{ss}
        </span>
        <div className="flex gap-2">
          <Button size="icon-sm" variant="outline" onClick={t.toggle}>
            {t.running ? (
              <Pause className="size-4" />
            ) : (
              <Play className="size-4" />
            )}
          </Button>
          <Button size="icon-sm" variant="outline" onClick={t.reset}>
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        {PRESETS.map((s) => (
          <Button
            key={s}
            size="xs"
            variant={t.duration === s ? "default" : "outline"}
            onClick={() => t.setPreset(s)}
            className="flex-1"
          >
            {s}s
          </Button>
        ))}
      </div>
    </div>
  );
}
