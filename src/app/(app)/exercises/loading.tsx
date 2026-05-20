import { AppNav } from "@/components/app-nav";
import { Card } from "@/components/ui/card";

export default function ExercisesLoading() {
  return (
    <div className="min-h-dvh pb-20 sm:pb-0">
      <AppNav />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="gb-skeleton h-7 w-44" />
          <div className="gb-skeleton h-8 w-24" />
        </div>
        {Array.from({ length: 3 }).map((_, g) => (
          <section key={g} className="space-y-2">
            <div className="gb-skeleton h-4 w-20" />
            <Card className="divide-y p-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <div className="gb-skeleton h-4 w-44" />
                  <div className="gb-skeleton h-3 w-10" />
                </div>
              ))}
            </Card>
          </section>
        ))}
      </main>
    </div>
  );
}
