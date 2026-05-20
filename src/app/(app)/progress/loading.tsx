import { AppNav } from "@/components/app-nav";
import { Card } from "@/components/ui/card";

export default function ProgressLoading() {
  return (
    <div className="min-h-dvh pb-20 sm:pb-0">
      <AppNav />
      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <div className="gb-skeleton h-7 w-44" />
        <div className="gb-skeleton h-10 w-full" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-3">
              <div className="gb-skeleton h-3 w-16" />
              <div className="gb-skeleton mt-2 h-5 w-20" />
            </Card>
          ))}
        </div>
        <Card>
          <div className="p-4">
            <div className="gb-skeleton h-3 w-48" />
          </div>
          <div className="gb-skeleton mx-4 mb-4 h-56 w-[calc(100%-2rem)]" />
        </Card>
      </main>
    </div>
  );
}
