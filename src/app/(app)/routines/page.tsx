import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { limitsFor, isPro } from "@/lib/plan";
import { AppNav } from "@/components/app-nav";
import {
  CreateRoutineButton,
  DeleteRoutineButton,
} from "@/components/routine-manager";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Routines",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function RoutinesPage() {
  const user = await requireAuth();
  const routines = await db.routine.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: {
      items: { orderBy: { order: "asc" }, include: { exercise: true } },
    },
  });
  const atLimit =
    !isPro(user.plan) && routines.length >= limitsFor(user.plan).maxRoutines;

  return (
    <div className="min-h-dvh pb-20 sm:pb-0">
      <AppNav />
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Routines</h1>
          <CreateRoutineButton atLimit={atLimit} />
        </div>

        {!isPro(user.plan) && (
          <p className="text-xs text-muted-foreground">
            Free plan: 1 routine. Pro unlocks unlimited.
          </p>
        )}

        {routines.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No routines yet. Create one to start a workout in one tap.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {routines.map((r) => (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-base">
                    {r.name}
                    <DeleteRoutineButton id={r.id} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground">
                  {r.items.map((it) => it.exercise.name).join(" · ")}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
