import { NextRequest, NextResponse } from "next/server";
import { PRODUCTS } from "@/lib/mock-data";
import { getProducts, upsertProduct } from "@/lib/supabase-db";
import { getSessionFromRequest } from "@/lib/auth";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const search   = searchParams.get("search") ?? undefined;
  const featured = searchParams.get("featured") === "true";
  const page     = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit    = Math.min(100, Number(searchParams.get("limit") || "50"));

  if (useSupabase) {
    const products = await getProducts({
      categoryId: category,
      search,
      featured: featured || undefined,
      activeOnly: true,
      limit,
      offset: (page - 1) * limit,
    });
    // Map to format expected by existing UI
    const mapped = products.map(p => ({
      id: p.id,
      categoryId: p.categoryId,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      unit: p.unit,
      unitSize: p.unitSize,
      price: p.price,
      srp: p.srp,
      sku: p.sku,
      minOrderQty: p.minOrderQty,
      isActive: p.isActive,
      isFeatured: p.isFeatured,
      stock: p.stockQty,
      lowStockThreshold: p.lowStockThreshold,
      imageUrl: p.imageUrl ?? `https://picsum.photos/seed/${p.slug ?? p.id}/400/400`,
      description: p.description,
    }));
    return NextResponse.json({ products: mapped, total: mapped.length, page, limit });
  }

  // Fallback: mock data
  let products = PRODUCTS.filter((p) => p.isActive);
  if (category) products = products.filter((p) => p.categoryId === category);
  if (search) {
    const s = search.toLowerCase();
    products = products.filter(
      (p) => p.name.toLowerCase().includes(s) || p.brand?.toLowerCase().includes(s)
    );
  }
  if (featured) products = products.filter((p) => p.isFeatured);
  const total = products.length;
  const data  = products.slice((page - 1) * limit, page * limit);
  return NextResponse.json({ products: data, total, page, limit });
}

// POST — admin: create or update product
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!useSupabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!body.categoryId) {
      return NextResponse.json({ error: "categoryId is required" }, { status: 400 });
    }
    if (typeof body.price !== "number" || body.price <= 0) {
      return NextResponse.json({ error: "price must be a positive number" }, { status: 400 });
    }
    if (!body.unit?.trim()) {
      return NextResponse.json({ error: "unit is required" }, { status: 400 });
    }

    const product = await upsertProduct({
      id: body.id ?? `p-${Date.now()}`,
      categoryId: body.categoryId,
      name: body.name,
      slug: body.slug ?? body.name?.toLowerCase().replace(/\s+/g, "-"),
      brand: body.brand,
      unit: body.unit,
      unitSize: body.unitSize,
      price: body.price,
      srp: body.srp,
      sku: body.sku,
      barcode: body.barcode,
      minOrderQty: body.minOrderQty ?? 1,
      isActive: body.isActive ?? true,
      isFeatured: body.isFeatured ?? false,
      stockQty: body.stock ?? body.stockQty ?? 0,
      lowStockThreshold: body.lowStockThreshold ?? 10,
      reorderPoint: body.reorderPoint ?? 20,
      imageUrl: body.imageUrl,
      description: body.description,
    });
    return NextResponse.json({ product });
  } catch (err) {
    console.error("Product upsert error:", err);
    return NextResponse.json({ error: "Failed to save product" }, { status: 500 });
  }
}
