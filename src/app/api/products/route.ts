import { NextRequest, NextResponse } from "next/server";
import { PRODUCTS } from "@/lib/mock-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search   = searchParams.get("search")?.toLowerCase();
  const featured = searchParams.get("featured") === "true";
  const page     = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit    = Math.min(100, Number(searchParams.get("limit") || "50"));

  let products = PRODUCTS.filter((p) => p.isActive);

  if (category) {
    products = products.filter((p) => p.categoryId === category);
  }

  if (search) {
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.brand?.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search)
    );
  }

  if (featured) {
    products = products.filter((p) => p.isFeatured);
  }

  const total = products.length;
  const start = (page - 1) * limit;
  const data  = products.slice(start, start + limit);

  return NextResponse.json({ products: data, total, page, limit });
}
