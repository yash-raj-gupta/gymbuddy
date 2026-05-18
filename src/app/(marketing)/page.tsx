import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { JsonLd } from "@/components/json-ld";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "GymBuddy — log every set, beat last week",
  description:
    "Offline-first workout tracker for split training. Log reps, sets and weight in seconds, apply progressive overload, see if you beat last week. Free tier, ₹99/mo Pro.",
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    title: "Log in seconds",
    body: "Pick a routine, tap through sets. Each set auto-prefills from last session — that's your progressive-overload cue.",
  },
  {
    title: "Works offline",
    body: "No gym wifi? Doesn't matter. Logging works fully offline and syncs the moment you reconnect.",
  },
  {
    title: "See if you beat last week",
    body: "Per-exercise charts, estimated 1RM, and PR badges. The one question that actually matters, answered.",
  },
];

const faqs = [
  {
    q: "Is it free?",
    a: "Yes — logging, the full exercise library, custom exercises, one routine and 30 days of history are free forever. Pro unlocks unlimited history and charts.",
  },
  {
    q: "Does it need internet?",
    a: "No. GymBuddy is offline-first. Log your whole workout in airplane mode; it syncs later.",
  },
  {
    q: "What does Pro cost?",
    a: "₹99/mo or ₹799/yr. First 100 users can grab Founder Lifetime for ₹1,499 one-time.",
  },
];

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "GymBuddy",
        url: appUrl,
      },
      {
        "@type": "WebSite",
        name: "GymBuddy",
        url: appUrl,
      },
      {
        "@type": "SoftwareApplication",
        name: "GymBuddy",
        applicationCategory: "HealthApplication",
        operatingSystem: "Web, Android (PWA)",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
        },
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
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-lg font-bold tracking-tight">GymBuddy</span>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
            Pricing
          </Link>
          <Link href="/sign-up" className={buttonVariants({ size: "sm" })}>
            Start free
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
          Log every set. Beat last week.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
          The offline-first workout tracker for people who train a real split.
          No bloat, no subscriptions you forget to cancel. Just log → see
          progress.
        </p>
        <div className="mt-8 flex justify-center gap-3">
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
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-20 sm:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title}>
            <CardHeader>
              <CardTitle>{f.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {f.body}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-24">
        <h2 className="mb-8 text-center text-2xl font-bold">FAQ</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <Card key={f.q}>
              <CardHeader>
                <CardTitle className="text-base">{f.q}</CardTitle>
                <CardDescription className="pt-1 text-sm">
                  {f.a}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="flex justify-center gap-4">
          <Link href="/legal/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/legal/privacy" className="hover:text-foreground">
            Privacy
          </Link>
        </div>
        <p className="mt-3">© {new Date().getFullYear()} GymBuddy</p>
      </footer>
    </main>
  );
}
