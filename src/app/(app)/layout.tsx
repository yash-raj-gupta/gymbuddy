import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { SyncManager } from "@/components/sync-manager";
import { ServiceWorkerRegister } from "@/components/service-worker-register";

// Auth-scoped layout. Clerk lives here (not at root) so marketing pages
// stay statically renderable without Clerk keys present.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      {children}
      <SyncManager />
      <ServiceWorkerRegister />
      <Toaster position="top-center" richColors />
    </ClerkProvider>
  );
}
