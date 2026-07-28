# The Dial — active-workout logging redesign

**Date:** 2026-07-28
**Status:** approved, ready for implementation plan
**Scope:** replaces the active-workout screen. Voice input is explicitly deferred to a second pass.

## Problem

Logging a set mid-workout costs 3–5 precise taps on ~36–44px targets, with the OS numeric
keyboard opening for any non-increment value. The screen sleeps between sets, the rest timer
lives in React-only state so a reload or a screen lock loses it, and its `setInterval`
decrement drifts when the tab is throttled. All of this happens while standing, one-handed,
with chalky hands, in 60–90 second attention windows.

Four confirmed pain points: fiddly number entry, too many taps per set, no glanceable
context, and screen sleep losing your place.

## Concept

The screen *is* the loaded barbell. The thing you physically change between sets is the load,
in plate-sized increments — so the primary control is a detented dial you can operate by feel,
not a pair of steppers you have to aim at.

**Rejected default:** the vertical scroll of exercise cards with per-set stepper rows. One
exercise fills the screen; you move between them by swiping.

**Signature interaction:** drag along the dial ring to change weight. It snaps to plate
detents and fires a short haptic tick at each one, so 100 → 110 kg is four bumps you can feel
without looking.

## Layout

Single screen, three bands, no scroll:

- **Top (~15%)** — exercise name, set pips (one plate-shaped pip per set, filled when done,
  tappable to jump), workout elapsed clock, offline indicator.
- **Middle (~40%)** — the stage: current weight × reps in large tabular figures, last
  session's numbers as a faint reference line. Horizontal swipe anywhere in this band moves
  between exercises.
- **Bottom (~45%)** — the dial, in the thumb zone. Concentric rings: **outer = weight**
  (2.5 kg detents), **inner = reps** (1-rep detents). Centre is the log button. Above the
  dial, a full-width **"Same as last time"** button.

The gesture split is deliberate: the stage owns horizontal swipe, the dial owns drag. They
never contend for the same pointer.

## The ring is also the rest timer

One control surface, two states. Logging a set flips the ring from **input** to **rest**: the
same ring drains as rest counts down, the centre shows remaining time. Tapping the centre or
the timer hitting zero flips it back to input, pre-loaded with the next set.

This removes the separate sticky rest-timer widget from the workout screen entirely.

## Components

New, each with one job:

| File | Responsibility |
| --- | --- |
| `src/lib/plates.ts` | Pure detent math: snapping, increments, clamping. No React. |
| `src/lib/haptics.ts` | Capability-checked `navigator.vibrate` wrapper; respects `prefers-reduced-motion`. |
| `src/lib/use-wake-lock.ts` | Screen wake lock with re-acquire on visibility change. |
| `src/components/workout/dial.tsx` | Controlled dual-ring input. Props in, values out. Knows nothing about workouts. |
| `src/components/workout/set-pips.tsx` | Pip row, tap to select. |
| `src/components/workout/exercise-stage.tsx` | Current exercise readout + swipe navigation. |
| `src/components/workout/edit-sheet.tsx` | Full set list for review, correction, RPE, delete. |

`src/app/(app)/workout/[clientId]/page.tsx` — currently 553 lines holding the entire flow —
becomes a thin container: load workout from IndexedDB, own the set-mutation callbacks, compose
the above. Extracting is part of this work, not separate cleanup: the dial cannot be reasoned
about or adjusted while it lives inside a 553-line file.

`src/components/rest-timer.tsx` keeps its provider (the timer must survive navigation) but the
visual widget is no longer rendered on the workout route.

## Interaction detail

**Dial drag.** The dial is **relative, not absolute**: dragging changes the value by detents
travelled from where the thumb landed, rather than mapping ring position to an absolute weight.
This matters — an absolute mapping would have to compress the whole plausible weight range into
one sweep, making each detent tiny and forcing a calibration decision the user would feel. With
relative drag, "four bumps is +10 kg" holds identically at 40 kg and at 140 kg, and the range is
unbounded.

Implementation: track pointer angle relative to ring centre, accumulate angular delta, and
commit one increment per fixed angular step (~12°). `setPointerCapture` on pointerdown so the
drag survives the thumb leaving the ring. Each detent crossed fires one haptic tick, throttled
to at most one per crossing — a fast flick crossing six detents fires six ticks, not sixty.

**Log.** Tap centre → set marked done, pip fills, ring flips to rest mode, a heavier confirming
haptic fires, the next set becomes current.

**Same as last time.** One tap: logs the current set at its prefilled values (`LocalSet.prev`).
This is the escape hatch for the common case and the fastest path in the app.

**Exact numbers.** Long-press the dial centre opens a numeric dialog (existing `ui/dialog` +
`ui/input`). This is the only path that opens the OS keyboard, and it's opt-in.

**Corrections.** The edit sheet lists every set with the familiar stepper rows, RPE field, and
delete. Nothing becomes unreachable — the dial is the fast path, the sheet is the complete one.

## Data

**No schema change.** `LocalSet` (`src/lib/offline-store.ts:8`) already carries `reps`,
`weight`, `rpe`, `done`, `order`, and `prev`. RPE moves out of the per-set row into the numeric
dialog and edit sheet, since it's optional and rarely set mid-rack.

**Persistence stays local-first and unchanged in shape** — mutate React state, write the
workout to IndexedDB, sync the whole workout once on finish via `syncOfflineWorkout`.

**One required fix:** `persist` (`page.tsx:71`) currently writes the entire workout object to
IndexedDB on every single change. Under a dial drag that is one write per detent. The IndexedDB
write must be debounced (~300 ms trailing) while React state stays immediate, with a forced
flush on set-log, on `visibilitychange`, and on finish. Without this the dial makes writes
roughly an order of magnitude more frequent than the current steppers do.

## Screen sleep and timer drift

**Wake lock.** Request `navigator.wakeLock.request("screen")` while the workout screen is
mounted; re-acquire on `visibilitychange` → visible, because the lock is released automatically
whenever the page is hidden. Release on unmount. Feature-detected — absent support is a silent
no-op, never an error.

**Timer correctness.** The rest timer currently decrements a counter on a 1-second interval,
which drifts under background throttling and resets on reload. Replace the stored state with an
absolute `endsAt` timestamp plus `duration`, persisted to `localStorage` under a
`clientId`-scoped key, and derive `remaining` from `Date.now()` on each tick and on
`visibilitychange`. Rest state is ephemeral UI state, so it belongs in `localStorage`, not in
the workout record.

## Platform reality

`navigator.vibrate` is **not supported on iOS Safari**. The by-feel premise of the dial is
therefore Android-only. On iOS the dial still works and still snaps to detents; the feedback is
visual (the detent notch flashes) instead of tactile. This is an accepted, stated limitation
rather than something to work around — the primary target is the installed Android PWA.

No audible detent click: earbuds are assumed to be playing music.

## Accessibility floor

- Both rings are `role="slider"` with `aria-valuenow`/`min`/`max`/`valuetext`, focusable, and
  driven by arrow keys as well as drag.
- `prefers-reduced-motion` suppresses ring animation and the haptic ticks; the existing
  reduced-motion block at `globals.css:235` is extended, not bypassed.
- All primary targets ≥ 44px. The dial rings are ~44px thick each.
- Real DOM text for the current values, not canvas-only, so screen readers get the numbers.

## Verification

The repo has no test runner and none is being added — that would be scope this task didn't
ask for. Verification is therefore:

1. `pnpm build` — clean.
2. `pnpm lint` — no new errors beyond the pre-existing baseline.
3. A real logged session on the installed Android PWA: log sets by feel with the screen at
   arm's length, confirm haptic detents, confirm the screen does not sleep, background the app
   mid-rest and confirm the timer returns with the correct remaining time, and confirm a
   reload mid-workout restores both the sets and the running timer.

`src/lib/plates.ts` is deliberately pure so that if a test runner is added later, the detent
math is directly testable without a DOM.

## Explicitly out of scope

- **Voice input.** Ships as an opt-in layer on top of this in a second pass. It additionally
  requires changing `Permissions-Policy` at `next.config.ts:29`, which currently disables the
  microphone outright with `microphone=()`.
- Plate math / bar loading display, supersets, warm-up set types, unit switching (kg is
  hardcoded throughout today), and per-set rest duration recording. None are needed for the
  dial and none have a schema field.
