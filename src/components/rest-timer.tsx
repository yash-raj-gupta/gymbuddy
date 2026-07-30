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
import { alertHaptic } from "@/lib/haptics";

const PRESETS = [60, 90, 120, 180];
const DEFAULT_DURATION = 90;

type Persisted = {
  duration: number;
  /** Absolute epoch ms, or null when not counting down. */
  endsAt: number | null;
  pausedRemaining: number;
};

function secondsUntil(endsAt: number): number {
  return Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
}

function readPersisted(key: string | null): Persisted | null {
  if (!key || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    if (typeof parsed.duration !== "number") return null;
    return {
      duration: parsed.duration,
      endsAt: typeof parsed.endsAt === "number" ? parsed.endsAt : null,
      pausedRemaining:
        typeof parsed.pausedRemaining === "number" ? parsed.pausedRemaining : 0,
    };
  } catch {
    return null;
  }
}

function restoreInitialState(key: string | null): {
  duration: number;
  remaining: number;
  endsAt: number | null;
} {
  const saved = readPersisted(key);
  if (!saved) {
    return {
      duration: DEFAULT_DURATION,
      remaining: DEFAULT_DURATION,
      endsAt: null,
    };
  }
  if (saved.endsAt !== null && saved.endsAt > Date.now()) {
    return {
      duration: saved.duration,
      remaining: secondsUntil(saved.endsAt),
      endsAt: saved.endsAt,
    };
  }
  // Rest elapsed while we were away — restore it finished, but stay silent.
  // The alert already fired, or the moment has long since passed.
  return {
    duration: saved.duration,
    remaining: saved.endsAt !== null ? 0 : saved.pausedRemaining,
    endsAt: null,
  };
}

function writePersisted(key: string | null, value: Persisted): void {
  if (!key || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode / quota — the timer still works in-session */
  }
}

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

export function RestTimerProvider({
  children,
  storageKey = null,
}: {
  children: React.ReactNode;
  /** Scopes persisted timer state, so two workouts never share a countdown. */
  storageKey?: string | null;
}) {
  // Restored synchronously rather than in an effect. Safe against hydration
  // mismatch because the provider renders no DOM of its own, and every consumer
  // of these values sits behind the workout page's `loading` branch, which is
  // still true during SSR and the hydration render.
  const [initial] = useState(() => restoreInitialState(storageKey));
  const [duration, setDuration] = useState(initial.duration);
  const [remaining, setRemaining] = useState(initial.remaining);
  // Absolute deadline while running; null when paused, reset, or finished.
  // Deriving `remaining` from this instead of decrementing a counter is what
  // makes the timer survive background throttling and a screen lock.
  const [endsAt, setEndsAt] = useState<number | null>(initial.endsAt);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const firedFor = useRef<number | null>(null);
  const running = endsAt !== null;

  // Snapshot Notification.permission on mount.
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifEnabled(Notification.permission === "granted");
    }
  }, []);

  useEffect(() => {
    writePersisted(storageKey, { duration, endsAt, pausedRemaining: remaining });
  }, [storageKey, duration, endsAt, remaining]);

  useEffect(() => {
    if (endsAt === null) return;

    const sync = () => {
      const left = secondsUntil(endsAt);
      setRemaining(left);
      if (left > 0) return;
      setEndsAt(null);
      // Guard against a double fire (StrictMode remount, or a visibility sync
      // landing in the same tick as the interval).
      if (firedFor.current === endsAt) return;
      firedFor.current = endsAt;
      // gymbuddy-prd.md §4 feature 4: vibration; plus audio + notification.
      alertHaptic();
      playBeep();
      fireNotification();
    };

    // Sub-second so the displayed second flips close to when it actually turns.
    const id = setInterval(sync, 250);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") sync();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    sync();

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [endsAt]);

  const start = useCallback(
    (seconds?: number) => {
      const s = seconds ?? duration;
      setDuration(s);
      setRemaining(s);
      setEndsAt(Date.now() + s * 1000);
    },
    [duration],
  );

  const toggle = useCallback(() => {
    if (endsAt !== null) {
      // Pause: freeze whatever is actually left, not the last rendered value.
      setRemaining(secondsUntil(endsAt));
      setEndsAt(null);
      return;
    }
    // If finished, Play restarts from full duration.
    const from = remaining === 0 ? duration : remaining;
    setRemaining(from);
    setEndsAt(Date.now() + from * 1000);
  }, [endsAt, remaining, duration]);

  const reset = useCallback(() => {
    setEndsAt(null);
    setRemaining(duration);
  }, [duration]);

  const setPreset = useCallback((s: number) => {
    setEndsAt(null);
    setDuration(s);
    setRemaining(s);
  }, []);

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
