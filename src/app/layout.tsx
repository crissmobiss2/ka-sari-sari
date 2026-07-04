import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#f47028",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "Ka Sari-Sari: Warehouse Ordering for Sari-Sari Stores",
    template: "%s | Ka Sari-Sari",
  },
  description:
    "Order directly from our warehouse. Fair prices, reliable stock, fast delivery for your sari-sari store.",
  keywords: ["sari-sari store", "wholesale", "ordering platform", "Philippines", "MSME", "warehouse"],
  authors: [{ name: "Ka Sari-Sari" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ka Sari-Sari",
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    type: "website",
    locale: "fil_PH",
    url: "https://ka-sari-sari.vercel.app",
    title: "Ka Sari-Sari: Warehouse Ordering Platform",
    description: "Order warehouse stock direct to your sari-sari store. Fast delivery, fair prices, 500+ products.",
    siteName: "Ka Sari-Sari",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ka Sari-Sari: Warehouse Ordering Platform",
    description: "Order warehouse stock direct to your sari-sari store. Fast delivery, fair prices, 500+ products.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fil" className={`${inter.variable} ${plusJakarta.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f47028" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
