import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MUSCLE_GROUPS } from "@/lib/exercise-catalogue";
import { AppNav } from "@/components/app-nav";
import { AddCustomExercise } from "@/components/add-custom-exercise";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Exercises",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ExercisesPage() {
  const user = await requireAuth();
  const exercises = await db.exercise.findMany({
    where: { OR: [{ userId: null }, { userId: user.id }] },
    orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
  });

  return (
    <div className="min-h-dvh pb-20 sm:pb-0">
      <AppNav />
      <main className="gb-page-in mx-auto max-w-3xl space-y-6 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
            Exercise library
          </h1>
          <AddCustomExercise />
        </div>

        {MUSCLE_GROUPS.map((mg) => {
          const items = exercises.filter((e) => e.muscleGroup === mg);
          if (items.length === 0) return null;
          return (
            <section key={mg} className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground lg:text-base">
                {mg}
              </h2>
              <Card>
                <CardContent className="divide-y p-0">
                  {items.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between px-4 py-2.5 text-sm sm:text-base lg:text-lg"
                    >
                      <span>{e.name}</span>
                      {e.isCustom && (
                        <Badge variant="secondary" className="text-xs">
                          Custom
                        </Badge>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          );
        })}
      </main>
    </div>
  );
}
