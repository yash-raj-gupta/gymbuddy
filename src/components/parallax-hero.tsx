"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

// Multi-layer scroll parallax with depth fade. Honors reduced-motion.
export function ParallaxHero() {
  const grid = useRef<HTMLDivElement>(null);
  const blobA = useRef<HTMLDivElement>(null);
  const blobB = useRef<HTMLDivElement>(null);
  const blobC = useRef<HTMLDivElement>(null);
  const fore = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        const vh = window.innerHeight || 1;
        const p = Math.min(y / vh, 1); // 0→1 over first viewport
        if (grid.current) {
          grid.current.style.transform = `translate3d(0, ${y * 0.5}px, 0)`;
          grid.current.style.opacity = `${0.5 - p * 0.5}`;
        }
        if (blobA.current)
          blobA.current.style.transform = `translate3d(0, ${y * 0.55}px, 0)`;
        if (blobB.current)
          blobB.current.style.transform = `translate3d(${y * 0.12}px, ${y * 0.32}px, 0)`;
        if (blobC.current)
          blobC.current.style.transform = `translate3d(${-y * 0.1}px, ${y * 0.42}px, 0)`;
        if (fore.current) {
          fore.current.style.transform = `translate3d(0, ${y * -0.12}px, 0) scale(${1 - p * 0.05})`;
          fore.current.style.opacity = `${1 - p * 0.85}`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="relative isolate flex min-h-[78vh] items-center overflow-hidden">
      {/* Layer 0 — perspective grid */}
      <div
        ref={grid}
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklch, var(--primary) 22%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklch, var(--primary) 22%, transparent) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      {/* Layer 1 — large emerald glow */}
      <div
        ref={blobA}
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 size-[46rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--primary)_38%,transparent),transparent_65%)] blur-3xl"
      />
      {/* Layer 2 — drifting accents */}
      <div
        ref={blobB}
        aria-hidden
        className="pointer-events-none absolute right-[-8rem] top-24 -z-10 size-[26rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--chart-2)_34%,transparent),transparent_60%)] blur-3xl"
      />
      <div
        ref={blobC}
        aria-hidden
        className="pointer-events-none absolute bottom-[-6rem] left-[-6rem] -z-10 size-[24rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--chart-4)_26%,transparent),transparent_60%)] blur-3xl"
      />

      {/* Foreground */}
      <div
        ref={fore}
        className="mx-auto w-full max-w-3xl px-6 py-14 text-center will-change-transform"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur sm:text-sm lg:text-base">
          <span className="size-1.5 rounded-full bg-primary" />
          Offline-first · No bloat · ₹0 to start
        </span>
        <h1 className="mt-7 text-balance text-5xl font-bold tracking-tight sm:text-7xl">
          Log every set.
          <span className="mt-1 block bg-gradient-to-r from-primary via-primary to-emerald-400 bg-clip-text text-transparent">
            Beat last week.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground sm:text-xl">
          The workout tracker for people who train a real split. Every set
          prefills from last session — progressive overload is just showing up
          and beating the number.
        </p>
        <div className="mt-9 flex justify-center gap-3">
          <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
            Start free
          </Link>
          <Link
            href="/pricing"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            See pricing
          </Link>
        </div>
        <p className="mt-6 animate-pulse text-xs text-muted-foreground sm:text-sm lg:text-base">
          ↓ scroll
        </p>
      </div>
    </section>
  );
}
