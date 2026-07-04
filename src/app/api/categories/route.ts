import { NextResponse } from "next/server";
import { CATEGORIES, PRODUCTS } from "@/lib/mock-data";

export async function GET() {
  const categories = CATEGORIES.map((cat) => ({
    ...cat,
    productCount: PRODUCTS.filter((p) => p.categoryId === cat.id && p.isActive).length,
  }));

  return NextResponse.json({ categories });
}
