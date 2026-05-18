import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AnalyticsProvider } from "@/components/analytics-provider";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "GymBuddy — log every set, beat last week",
    template: "%s · GymBuddy",
  },
  description:
    "Offline-first workout tracker for split training. Log reps, sets and weight in seconds. Progressive overload, no bloat.",
  applicationName: "GymBuddy",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "GymBuddy", statusBarStyle: "default" },
  openGraph: {
    title: "GymBuddy — log every set, beat last week",
    description:
      "Offline-first workout tracker for split training. Progressive overload, no bloat.",
    url: appUrl,
    siteName: "GymBuddy",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "GymBuddy" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
