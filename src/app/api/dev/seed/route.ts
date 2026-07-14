import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { CATEGORIES, PRODUCTS } from "@/lib/mock-data";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  try {
    // Upsert categories
    const catRows = CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      is_active: c.isActive,
      display_order: c.sortOrder,
    }));
    const { error: catErr } = await supabaseAdmin
      .from("categories")
      .upsert(catRows, { onConflict: "id" });
    if (catErr) throw new Error(`Categories: ${catErr.message}`);

    // Upsert products in batches of 50
    const prodRows = PRODUCTS.map((p) => ({
      id: p.id,
      category_id: p.categoryId,
      name: p.name,
      slug: p.slug ?? null,
      brand: p.brand ?? null,
      unit: p.unit,
      unit_size: p.unitSize ?? null,
      price: p.price,
      srp: p.srp ?? null,
      sku: p.sku ?? null,
      barcode: p.barcode ?? null,
      min_order_qty: p.minOrderQty ?? 1,
      is_active: p.isActive,
      is_featured: p.isFeatured,
      stock_qty: p.stock ?? 0,
      low_stock_threshold: p.lowStockThreshold ?? 10,
      image_url: p.imageUrl ?? null,
      description: p.description ?? null,
    }));

    let inserted = 0;
    for (let i = 0; i < prodRows.length; i += 50) {
      const batch = prodRows.slice(i, i + 50);
      const { error: prodErr } = await supabaseAdmin
        .from("products")
        .upsert(batch, { onConflict: "id" });
      if (prodErr) throw new Error(`Products batch ${i}: ${prodErr.message}`);
      inserted += batch.length;
    }

    return NextResponse.json({
      ok: true,
      categories: catRows.length,
      products: inserted,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Seed error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
