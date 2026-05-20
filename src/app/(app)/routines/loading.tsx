import { AppNav } from "@/components/app-nav";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function RoutinesLoading() {
  return (
    <div className="min-h-dvh pb-20 sm:pb-0">
      <AppNav />
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="gb-skeleton h-7 w-32" />
          <div className="gb-skeleton h-8 w-28" />
        </div>
        <div className="gb-stagger space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="gb-skeleton h-4 w-32" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="gb-skeleton h-3 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
