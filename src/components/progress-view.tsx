"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Lock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  getExerciseProgress,
  getPRs,
  type ProgressPoint,
} from "@/server/actions/progress";

type Opt = { id: string; name: string };

export function ProgressView({ exercises }: { exercises: Opt[] }) {
  const [exId, setExId] = useState<string>(exercises[0]?.id ?? "");
  const [locked, setLocked] = useState(false);
  const [points, setPoints] = useState<ProgressPoint[]>([]);
  const [prs, setPrs] = useState<Awaited<ReturnType<typeof getPRs>>>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!exId) return;
    setLoading(true);
    Promise.all([getExerciseProgress(exId), getPRs(exId)])
      .then(([prog, pr]) => {
        if ("locked" in prog && prog.locked) {
          setLocked(true);
          setPoints([]);
        } else {
          setLocked(false);
          setPoints("points" in prog ? prog.points : []);
        }
        setPrs(pr);
      })
      .finally(() => setLoading(false));
  }, [exId]);

  if (exercises.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Log a few workouts and your progress charts show up here.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Select value={exId} onValueChange={(v) => setExId(v ?? "")}>
        <SelectTrigger>
          <SelectValue placeholder="Pick an exercise" />
        </SelectTrigger>
        <SelectContent>
          {exercises.map((e) => (
            <SelectItem key={e.id} value={e.id}>
              {e.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {locked ? (
        <Card className="border-primary/40">
          <CardContent className="space-y-3 py-10 text-center">
            <Lock className="mx-auto size-6 text-primary" />
            <p className="font-medium">Progress charts are a Pro feature</p>
            <p className="text-sm text-muted-foreground">
              See top-set weight, estimated 1RM and volume over time.
            </p>
            <Link
              href="/pricing"
              className={buttonVariants({ className: "mx-auto" })}
            >
              Upgrade to Pro — ₹99/mo
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {prs && (
            <div className="grid grid-cols-3 gap-2">
              <PrBadge label="Heaviest" value={`${prs.heaviestWeight} kg`} />
              <PrBadge label="Best e1RM" value={`${prs.bestEst1RM} kg`} />
              <PrBadge
                label="Best volume"
                value={prs.bestVolume.toLocaleString("en-IN")}
              />
            </div>
          )}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Top-set weight & estimated 1RM
              </CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              {loading ? (
                <div className="gb-skeleton size-full rounded-md" />
              ) : points.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No finished sets for this exercise yet.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={points}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} width={32} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="topWeight"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      dot={false}
                      name="Top weight"
                    />
                    <Line
                      type="monotone"
                      dataKey="est1RM"
                      stroke="var(--chart-4)"
                      strokeWidth={2}
                      dot={false}
                      name="Est. 1RM"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function PrBadge({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 font-bold">{value}</p>
        <Badge variant="secondary" className="mt-1 text-[10px]">
          PR
        </Badge>
      </CardContent>
    </Card>
  );
}
