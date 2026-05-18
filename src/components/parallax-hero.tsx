"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

// Scroll-driven parallax. Honors prefers-reduced-motion (no transform then).
export function ParallaxHero() {
  const back = useRef<HTMLDivElement>(null);
  const mid = useRef<HTMLDivElement>(null);
  const fore = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (back.current)
          back.current.style.transform = `translate3d(0, ${y * 0.4}px, 0)`;
        if (mid.current)
          mid.current.style.transform = `translate3d(0, ${y * 0.22}px, 0)`;
        if (fore.current)
          fore.current.style.transform = `translate3d(0, ${y * -0.08}px, 0)`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="relative isolate overflow-hidden">
      {/* Parallax background layers */}
      <div
        ref={back}
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 size-[44rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/25 via-amber-500/10 to-transparent blur-3xl"
        aria-hidden
      />
      <div
        ref={mid}
        className="pointer-events-none absolute right-[-10rem] top-40 -z-10 size-[28rem] rounded-full bg-gradient-to-tr from-primary/15 to-transparent blur-3xl"
        aria-hidden
      />

      <div
        ref={fore}
        className="mx-auto max-w-3xl px-6 py-28 text-center sm:py-36"
      >
        <span className="inline-flex items-center rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          Offline-first · No bloat · ₹0 to start
        </span>
        <h1 className="mt-6 text-balance text-5xl font-bold tracking-tight sm:text-7xl">
          Log every set.
          <span className="block bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
            Beat last week.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
          The workout tracker for people who train a real split. Every set
          prefills from last session — so progressive overload is just showing
          up and beating the number.
        </p>
        <div className="mt-9 flex justify-center gap-3">
          <Link
            href="/sign-up"
            className={buttonVariants({ size: "lg" })}
          >
            Start free
          </Link>
          <Link
            href="/pricing"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            See pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
