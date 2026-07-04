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
      <div className="bg-white shadow-lg rounded-lg border-l-4 border-[#f47028] px-4 py-3 flex items-center gap-3">
        <span className="text-2xl flex-shrink-0" aria-hidden="true">
          🏪
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">Add to Home Screen</p>
          <p className="text-xs text-gray-500 leading-tight mt-0.5">
            Install for faster access, even offline
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="flex-shrink-0 bg-[#f47028] hover:bg-[#d95e1f] text-white text-sm font-semibold px-3 py-1.5 rounded-md transition-colors"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 text-lg leading-none transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
}
