"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Dumbbell, LayoutGrid, ListChecks, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnline } from "@/lib/use-online";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { href: "/dashboard", label: "Home", icon: LayoutGrid },
  { href: "/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/routines", label: "Routines", icon: ListChecks },
  { href: "/progress", label: "Progress", icon: LineChart },
];

export function AppNav() {
  const pathname = usePathname();
  const online = useOnline();

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-base font-bold sm:text-lg lg:text-xl"
          >
            <Dumbbell className="size-5 text-primary sm:size-6 lg:size-7" />
            GymBuddy
          </Link>
          <div className="flex items-center gap-3">
            {!online && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400 sm:text-sm">
                Offline
              </span>
            )}
            <ThemeToggle />
            <UserButton />
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-3xl">
          {links.map((l) => {
            const active = pathname === l.href;
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" />
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <nav className="mx-auto hidden max-w-3xl gap-1 px-4 py-3 sm:flex">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors lg:px-4 lg:py-2 lg:text-base",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
