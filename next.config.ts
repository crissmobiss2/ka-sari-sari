import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "images.openfoodfacts.org" },
      { protocol: "https", hostname: "static.openfoodfacts.org" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      // Supabase Storage
      { protocol: "https", hostname: "**.supabase.co" },
      // Vercel Blob
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
  },
};

export default nextConfig;
