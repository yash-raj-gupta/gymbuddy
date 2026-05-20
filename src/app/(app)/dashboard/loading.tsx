import { AppNav } from "@/components/app-nav";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Streaming fallback while the dashboard server fetches.
export default function DashboardLoading() {
  return (
    <div className="min-h-dvh pb-20 sm:pb-0">
      <AppNav />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <div className="space-y-2">
          <div className="gb-skeleton h-7 w-40" />
          <div className="gb-skeleton h-4 w-52" />
        </div>
        <div className="gb-skeleton h-11 w-full" />

        <div className="flex items-center justify-between">
          <div className="gb-skeleton h-5 w-32" />
          <div className="gb-skeleton h-7 w-24" />
        </div>

        <div className="gb-stagger space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="gb-skeleton h-4 w-24" />
                  <div className="gb-skeleton h-4 w-40" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="gb-skeleton h-3 w-60" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
