"use client";
import { ThemeProvider } from "next-themes";
import { ToastContainer } from "@/components/ui/toast-container";
import { PwaInstallPrompt } from "@/components/ui/pwa-install-prompt";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <ToastContainer />
      <PwaInstallPrompt />
    </ThemeProvider>
  );
}
