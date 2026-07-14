"use client";

import { useEffect, useState } from "react";
import { toastSuccess } from "@/store/toast";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker?.register("/sw.js").catch(() => {
        // SW registration failure is non-fatal
      });
    }

    // Check if already dismissed this session
    const dismissed = sessionStorage.getItem("kss-pwa-dismissed");
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      (window as Window & { deferredPrompt?: BeforeInstallPromptEvent }).deferredPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      toastSuccess("Ka Sari-Sari added to your home screen!");
    }
    setDeferredPrompt(null);
    setVisible(false);
    delete (window as Window & { deferredPrompt?: BeforeInstallPromptEvent }).deferredPrompt;
  };

  const handleDismiss = () => {
    sessionStorage.setItem("kss-pwa-dismissed", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 z-40 px-3">
      <div className="bg-card shadow-lg rounded-lg border-l-4 border-brand-500 px-4 py-3 flex items-center gap-3">
        <span className="text-2xl flex-shrink-0" aria-hidden="true">
          🏪
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">Add to Home Screen</p>
          <p className="text-xs text-muted-foreground leading-tight mt-0.5">
            Install for faster access, even offline
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="flex-shrink-0 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-3 py-1.5 rounded-md transition-colors"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          className="flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}
