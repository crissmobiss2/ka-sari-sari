"use client";
import { ThemeProvider } from "next-themes";
import { ToastContainer } from "@/components/ui/toast-container";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <ToastContainer />
    </ThemeProvider>
  );
}
