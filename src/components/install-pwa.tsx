"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

// Chromium fires `beforeinstallprompt` once install criteria are met.
// We stash it and surface a button — modern Chrome no longer shows the
// auto-prompt, so the user needs a visible trigger.
type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPWA() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Already running standalone? Hide.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS legacy
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    if (standalone) setInstalled(true);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !evt) return null;

  return (
    <Button
      size="sm"
      variant="outline"
      className="gap-1.5"
      onClick={async () => {
        await evt.prompt();
        const choice = await evt.userChoice;
        if (choice.outcome === "accepted") setInstalled(true);
        setEvt(null);
      }}
    >
      <Download className="size-4" /> Install
    </Button>
  );
}
