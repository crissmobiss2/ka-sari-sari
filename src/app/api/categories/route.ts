import { NextResponse } from "next/server";
import { CATEGORIES, PRODUCTS } from "@/lib/mock-data";
import { getCategories, getProducts } from "@/lib/supabase-db";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function GET() {
  if (useSupabase) {
    try {
      const [cats, products] = await Promise.all([
        getCategories(),
        getProducts({ activeOnly: true }),
      ]);
      const categories = cats.map((cat) => ({
        ...cat,
        productCount: products.filter((p) => p.categoryId === cat.id).length,
      }));
      return NextResponse.json({ categories });
    } catch {
      return NextResponse.json({ categories: [] });
    }
  }

  const categories = CATEGORIES.map((cat) => ({
    ...cat,
    productCount: PRODUCTS.filter((p) => p.categoryId === cat.id && p.isActive).length,
  }));
  return NextResponse.json({ categories });
}
