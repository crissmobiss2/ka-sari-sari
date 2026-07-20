import { NextRequest, NextResponse } from "next/server";
import { PRODUCTS } from "@/lib/mock-data";
import { getProductByIdOrSlug } from "@/lib/supabase-db";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (useSupabase) {
    const product = await getProductByIdOrSlug(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ product });
  }

  const product = PRODUCTS.find((p) => p.id === id || p.slug === id);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json({ product });
}
