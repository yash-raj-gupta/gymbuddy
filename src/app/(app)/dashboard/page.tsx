import { UserButton } from "@clerk/nextjs";
import { requireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Auth + DB read → render per request, never prerendered.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <main className="mx-auto max-w-3xl flex-1 px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {user.email} · {user.plan} plan
          </p>
        </div>
        <UserButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Start a workout</CardTitle>
          <CardDescription>
            Pick a routine or log ad-hoc. Sets prefill from your last session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled>Start workout (coming next)</Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Logging UI is the next build phase per the PRD.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
