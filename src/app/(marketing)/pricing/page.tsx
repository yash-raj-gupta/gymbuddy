import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Pricing",
  description: "INR-first pricing. Free forever tier, ₹99/mo Pro, Founder Lifetime ₹1,499.",
};

const tiers = [
  {
    name: "Free",
    price: "₹0",
    sub: "forever",
    features: [
      "Workout logging",
      "Full exercise library + custom exercises",
      "1 saved routine",
      "Last 30 days history",
      "Rest timer",
    ],
    cta: "Start free",
    href: "/sign-up",
    highlight: false,
  },
  {
    name: "GymBuddy Pro",
    price: "₹99",
    sub: "/mo · or ₹799/yr",
    features: [
      "Everything in Free",
      "Unlimited history",
      "Progress charts + PR tracking",
      "Unlimited routines",
      "CSV export",
    ],
    cta: "Go Pro",
    href: "/sign-up?plan=pro",
    highlight: true,
  },
  {
    name: "Founder Lifetime",
    price: "₹1,499",
    sub: "one-time · first 100 only",
    features: [
      "Everything in Pro",
      "Forever — no renewals",
      "Support a solo builder",
    ],
    cta: "Become a founder",
    href: "/sign-up?plan=lifetime",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-5xl flex-1 px-6 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Simple pricing</h1>
        <p className="mt-3 text-muted-foreground">
          Cheaper than a notebook that lies to you. UPI, cards, wallets via
          Razorpay.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {tiers.map((t) => (
          <Card
            key={t.name}
            className={t.highlight ? "border-primary shadow-lg" : ""}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t.name}</CardTitle>
                {t.highlight && <Badge>Popular</Badge>}
              </div>
              <CardDescription>
                <span className="text-2xl font-bold text-foreground">
                  {t.price}
                </span>{" "}
                {t.sub}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {t.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link
                href={t.href}
                className={buttonVariants({
                  variant: t.highlight ? "default" : "outline",
                  className: "w-full",
                })}
              >
                {t.cta}
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
      <p className="mt-10 text-center text-sm text-muted-foreground">
        Free-tier limits are enforced server-side. Prices in INR, billed via
        Razorpay.
      </p>
    </main>
  );
}
