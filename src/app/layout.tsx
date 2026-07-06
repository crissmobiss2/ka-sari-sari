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
  manifest: "/manifest.json",
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
    images: [
      {
        url: "https://ka-sari-sari.vercel.app/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Ka Sari-Sari — Wholesale Ordering for Sari-Sari Stores",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ka Sari-Sari: Warehouse Ordering Platform",
    description: "Order warehouse stock direct to your sari-sari store. Fast delivery, fair prices, 500+ products.",
    images: ["https://ka-sari-sari.vercel.app/opengraph-image"],
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fil" className={`${inter.variable} ${plusJakarta.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f47028" />
        {/* Favicon — SVG scales perfectly at any size */}
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* Open Graph / link preview image */}
        <meta property="og:image" content="https://ka-sari-sari.vercel.app/opengraph-image" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://ka-sari-sari.vercel.app" />
        {/* Twitter card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://ka-sari-sari.vercel.app/opengraph-image" />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
