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
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          // Set theme before paint to avoid a flash. Default: dark.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('gb-theme')||'dark';var m=window.matchMedia('(prefers-color-scheme:dark)').matches;document.documentElement.classList.toggle('dark',t==='dark'||(t==='system'&&m));}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
