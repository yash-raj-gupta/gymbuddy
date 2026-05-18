import { ClerkProvider } from "@clerk/nextjs";

// Auth-scoped layout. Clerk lives here (not at root) so marketing pages
// stay statically renderable without Clerk keys present.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
