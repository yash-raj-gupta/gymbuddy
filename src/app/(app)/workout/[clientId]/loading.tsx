import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Active workout is client-rendered (loads from IndexedDB) — this is just
// the initial bundle fallback so the page never flashes blank.
export default function WorkoutLoading() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 px-4 py-5 pb-28">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="gb-skeleton h-6 w-40" />
          <div className="gb-skeleton h-3 w-28" />
        </div>
        <div className="gb-skeleton h-9 w-24" />
      </div>
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="gb-skeleton h-3 w-16" />
          <div className="gb-skeleton h-2 w-full" />
          <div className="flex items-center justify-between">
            <div className="gb-skeleton h-8 w-20" />
            <div className="flex gap-2">
              <div className="gb-skeleton h-8 w-8 rounded-lg" />
              <div className="gb-skeleton h-8 w-8 rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <div className="gb-skeleton h-4 w-44" />
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="gb-skeleton h-9 w-full" />
            ))}
          </CardContent>
        </Card>
      ))}
    </main>
  );
}
