import type { Metadata } from "next";
import Link from "next/link";
import {
  Zap,
  WifiOff,
  TrendingUp,
  Repeat,
  Timer,
  ListChecks,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { JsonLd } from "@/components/json-ld";
import { ParallaxHero } from "@/components/parallax-hero";
import { AppPreview } from "@/components/app-preview";
import { Reveal } from "@/components/reveal";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "GymBuddy — log every set, beat last week",
  description:
    "Offline-first workout tracker for split training. Log reps, sets and weight in seconds, apply progressive overload, see if you beat last week.",
  alternates: { canonical: appUrl },
  openGraph: {
    title: "GymBuddy — log every set, beat last week",
    description:
      "Offline-first workout tracker for split training. Progressive overload, no bloat.",
    url: appUrl,
    siteName: "GymBuddy",
    locale: "en_IN",
    type: "website",
  },
  robots: { index: true, follow: true },
};

const features = [
  {
    icon: Zap,
    title: "Log in seconds",
    body: "Tap through sets. Every set auto-prefills from your last session — progressive overload without the mental math.",
  },
  {
    icon: WifiOff,
    title: "Works fully offline",
    body: "Gym basement, no signal? Log the whole session offline. It syncs the instant you reconnect.",
  },
  {
    icon: TrendingUp,
    title: "Beat last week",
    body: "Per-exercise charts, estimated 1RM and PR badges. The one question that matters, answered at a glance.",
  },
  {
    icon: Repeat,
    title: "Repeat-set & +1",
    body: "One tap copies your last set. No re-typing weight and reps every single time.",
  },
  {
    icon: Timer,
    title: "Rest timer + buzz",
    body: "Configurable countdown that vibrates when it's time for the next set. Eyes off the phone.",
  },
  {
    icon: ListChecks,
    title: "Saved routines",
    body: "Build your split once, start a session in one tap with every exercise pre-loaded.",
  },
];

const steps = [
  {
    n: "1",
    t: "Start a session",
    d: "Pick a saved routine or go ad-hoc.",
  },
  {
    n: "2",
    t: "Log each set",
    d: "Weight, reps, optional RPE — prefilled from last time.",
  },
  {
    n: "3",
    t: "See progress",
    d: "Charts and PRs update the moment you finish.",
  },
];

const faqs = [
  {
    q: "Is it free?",
    a: "Yes — everything is free right now: logging, the full exercise library, custom exercises, unlimited routines, full history, charts and CSV export.",
  },
  {
    q: "Does it need internet?",
    a: "No. GymBuddy is offline-first. Log your whole workout in airplane mode; it syncs automatically when you're back online.",
  },
  {
    q: "Will it slow me down at the gym?",
    a: "It's built for speed: sets prefill from last session, one tap repeats a set, and the rest timer buzzes so you're not staring at the screen.",
  },
];

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: "GymBuddy", url: appUrl },
      { "@type": "WebSite", name: "GymBuddy", url: appUrl },
      {
        "@type": "SoftwareApplication",
        name: "GymBuddy",
        applicationCategory: "HealthApplication",
        operatingSystem: "Web, Android (PWA)",
        offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <main className="flex-1">
      <JsonLd data={jsonLd} />

      <header className="sticky top-0 z-40 border-b border-transparent bg-background/70 backdrop-blur transition-colors">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight">GymBuddy</span>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/pricing"
              className="text-muted-foreground hover:text-foreground"
            >
              Pricing
            </Link>
            <Link href="/sign-up" className={buttonVariants({ size: "sm" })}>
              Start free
            </Link>
          </nav>
        </div>
      </header>

      <ParallaxHero />

      {/* Product preview — fills the page, shows the loop */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid items-center gap-10 rounded-3xl border bg-card/40 p-8 sm:p-12 md:grid-cols-2">
          <Reveal className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">
              The whole app is one screen
            </h2>
            <p className="text-muted-foreground">
              No dashboards to configure, no nutrition nags. Open it, start a
              workout, beat the number you see prefilled. That&rsquo;s the
              product.
            </p>
            <ul className="space-y-2 text-sm">
              {[
                "Last session's numbers, prefilled",
                "Offline-first — never lose a set",
                "Rest timer buzzes for you",
              ].map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary" />
                  {x}
                </li>
              ))}
            </ul>
            <Link
              href="/sign-up"
              className={buttonVariants({ className: "mt-2" })}
            >
              Start logging — free
            </Link>
          </Reveal>
          <Reveal delay={120}>
            <AppPreview />
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <Reveal>
          <h2 className="mb-8 text-center text-2xl font-bold">
            Three taps to a logged workout
          </h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 90}>
              <div className="h-full rounded-2xl border bg-card p-6">
                <div className="mb-3 flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {s.n}
                </div>
                <h3 className="font-semibold">{s.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={(i % 3) * 80}>
                <div className="group h-full rounded-2xl border bg-card p-6 transition-colors hover:border-primary/40">
                  <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {f.body}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto grid max-w-5xl grid-cols-3 gap-4 px-6 py-10 text-center">
          {[
            ["₹0", "to start, everything unlocked"],
            ["100%", "works offline"],
            ["1-tap", "to start a saved routine"],
          ].map(([big, small]) => (
            <Reveal key={big}>
              <p className="text-2xl font-bold sm:text-3xl">{big}</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {small}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <Reveal>
          <h2 className="mb-8 text-center text-2xl font-bold">FAQ</h2>
        </Reveal>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={i * 70}>
              <div className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold">{f.q}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border bg-primary px-8 py-14 text-center text-primary-foreground">
            <div className="absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-2xl" />
            <h2 className="text-balance text-3xl font-bold sm:text-4xl">
              Stop guessing your weights.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm opacity-90">
              Log today&rsquo;s session, and next week the app tells you exactly
              what to beat.
            </p>
            <Link
              href="/sign-up"
              className={buttonVariants({
                variant: "secondary",
                size: "lg",
                className: "mt-7",
              })}
            >
              Start free — no card
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="flex justify-center gap-4">
          <Link href="/legal/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/legal/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
        </div>
        <p className="mt-3">© {new Date().getFullYear()} GymBuddy</p>
      </footer>
    </main>
  );
}
