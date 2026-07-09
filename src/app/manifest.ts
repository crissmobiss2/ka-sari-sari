import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ka Sari-Sari: Warehouse Ordering",
    short_name: "Ka Sari-Sari",
    description: "Order directly from our warehouse. Fair prices, fast delivery for your sari-sari store.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f47028",
    orientation: "portrait",
    categories: ["shopping", "business"],
    lang: "fil",
    icons: [
      { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Browse Catalog", url: "/catalog", description: "Order from 500+ warehouse products" },
      { name: "My Orders", url: "/orders", description: "Track your active orders" },
      { name: "My Cart", url: "/cart", description: "View cart and checkout" },
    ],
    screenshots: [],
  };
}
