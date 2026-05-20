import { Flame, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { DashboardSummary } from "@/server/actions/dashboard";
import { Card, CardContent } from "@/components/ui/card";

function delta(now: number, prev: number) {
  if (prev === 0) return now === 0 ? 0 : 100;
  return Math.round(((now - prev) / prev) * 100);
}

function DeltaPill({ value }: { value: number }) {
  const cls =
    value > 0
      ? "text-emerald-600 dark:text-emerald-400"
      : value < 0
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground";
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs ${cls}`}>
      <Icon className="size-3" />
      {value > 0 ? "+" : ""}
      {value}%
    </span>
  );
}

function streakFrom(heatmap: { date: string; count: number }[]): number {
  // Count consecutive trailing days with ≥1 workout, counting today only if logged.
  let s = 0;
  for (let i = heatmap.length - 1; i >= 0; i--) {
    if (heatmap[i]!.count > 0) s += 1;
    else break;
  }
  return s;
}

export function DashboardStats({ summary }: { summary: DashboardSummary }) {
  const { thisWeek, lastWeek, heatmap } = summary;
  const dDays = delta(thisWeek.days, lastWeek.days);
  const dSets = delta(thisWeek.sets, lastWeek.sets);
  const dVol = delta(thisWeek.volume, lastWeek.volume);
  const streak = streakFrom(heatmap);

  return (
    <Card>
      <CardContent className="space-y-5 p-4 sm:p-5">
        {/* This-week stats */}
        <div className="grid grid-cols-3 gap-3">
          <Stat
            label="Days"
            value={`${thisWeek.days}/7`}
            sub={<DeltaPill value={dDays} />}
          />
          <Stat
            label="Sets"
            value={thisWeek.sets.toLocaleString("en-IN")}
            sub={<DeltaPill value={dSets} />}
          />
          <Stat
            label="Volume"
            value={`${Math.round(thisWeek.volume / 1000)} t`}
            sub={<DeltaPill value={dVol} />}
            hint={`${Math.round(thisWeek.volume).toLocaleString(
              "en-IN",
            )} kg·reps`}
          />
        </div>

        {/* Streak + heatmap */}
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-sm">
            <Flame
              className={`size-4 ${
                streak > 0 ? "text-amber-500" : "text-muted-foreground"
              }`}
            />
            <span className="font-semibold tabular-nums">{streak}</span>
            <span className="text-muted-foreground">
              day{streak === 1 ? "" : "s"}
            </span>
          </div>
          <Heatmap heatmap={heatmap} />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  sub,
  hint,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className="mt-0.5 text-xl font-bold tabular-nums sm:text-2xl"
        title={hint}
      >
        {value}
      </p>
      {sub && <div className="mt-0.5">{sub}</div>}
    </div>
  );
}

function Heatmap({ heatmap }: { heatmap: { date: string; count: number }[] }) {
  // 12 weeks × 7 days. heatmap is oldest → newest.
  const cols: { date: string; count: number }[][] = [];
  for (let i = 0; i < heatmap.length; i += 7) {
    cols.push(heatmap.slice(i, i + 7));
  }

  const color = (c: number) => {
    if (c === 0) return "bg-muted";
    if (c === 1) return "bg-primary/40";
    if (c === 2) return "bg-primary/70";
    return "bg-primary";
  };

  return (
    <div className="flex-1 overflow-x-auto">
      <div className="flex gap-[3px]" style={{ width: "fit-content" }}>
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-[3px]">
            {col.map((d) => (
              <div
                key={d.date}
                title={`${d.date} · ${d.count} workout${d.count === 1 ? "" : "s"}`}
                className={`size-[11px] rounded-[3px] ${color(d.count)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-muted-foreground">
        Last 12 weeks · brighter = more sessions
      </p>
    </div>
  );
}
