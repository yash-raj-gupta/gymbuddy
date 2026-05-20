"use client";

import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";

const KEY = "gb-ios-hint";

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPad on iPadOS 13+ reports MacIntel; sniff for touch to catch it.
  return (
    /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isSafariOnIOS(): boolean {
  const ua = navigator.userAgent;
  // Other iOS browsers identify themselves: CriOS (Chrome), FxiOS (Firefox),
  // EdgiOS (Edge), OPiOS (Opera). Safari ships none of those tokens.
  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // Legacy iOS flag.
  return (
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
    true
  );
}

export function IOSInstallHint() {
  const [show, setShow] = useState(false);
  const [inSafari, setInSafari] = useState(true);

  useEffect(() => {
    if (!isIOS()) return;
    if (isStandalone()) return;
    if (localStorage.getItem(KEY) === "dismissed") return;
    setInSafari(isSafariOnIOS());
    // Wait a couple of seconds — show after the user has seen the page.
    const t = setTimeout(() => setShow(true), 2200);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    localStorage.setItem(KEY, "dismissed");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Install GymBuddy on iPhone"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-sm rounded-2xl border bg-card/95 p-4 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:left-auto sm:right-4"
    >
      <button
        onClick={dismiss}
        aria-label="Dismiss install hint"
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Share className="size-4" />
        </div>
        <div className="space-y-1 text-sm">
          <p className="font-semibold">Install GymBuddy on your iPhone</p>
          {inSafari ? (
            <p className="text-muted-foreground">
              Tap the <span className="font-medium text-foreground">Share</span>{" "}
              icon below, then{" "}
              <span className="font-medium text-foreground">
                Add to Home Screen
              </span>
              .
            </p>
          ) : (
            <p className="text-muted-foreground">
              iOS only allows install from{" "}
              <span className="font-medium text-foreground">Safari</span>. Open
              this page in Safari, then{" "}
              <span className="font-medium text-foreground">Share</span> →{" "}
              <span className="font-medium text-foreground">
                Add to Home Screen
              </span>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
