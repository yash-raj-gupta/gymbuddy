import { AppNav } from "@/components/app-nav";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function HistoryDetailLoading() {
  return (
    <div className="min-h-dvh pb-20 sm:pb-0">
      <AppNav />
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <div className="gb-skeleton h-4 w-16" />
        <div className="space-y-2">
          <div className="gb-skeleton h-7 w-2/3" />
          <div className="gb-skeleton h-4 w-1/2" />
        </div>
        <div className="gb-stagger space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div className="gb-skeleton h-4 w-40" />
                  <div className="gb-skeleton h-3 w-24" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div className="flex justify-between" key={j}>
                    <div className="gb-skeleton h-3 w-14" />
                    <div className="gb-skeleton h-3 w-24" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
