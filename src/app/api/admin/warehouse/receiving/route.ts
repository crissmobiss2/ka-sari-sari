// POST /api/admin/warehouse/receiving — record received goods and add stock.
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !["admin", "warehouse"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ ok: true });
  try {
    // receivedQty maps product id → quantity received. Add each to stock.
    const received = (b.receivedQty ?? {}) as Record<string, unknown>;
    for (const [productId, qty] of Object.entries(received)) {
      const n = Number(qty);
      if (productId && Number.isFinite(n) && n > 0) {
        await supabaseAdmin.rpc("adjust_stock", { p_product_id: productId, p_delta: n });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin warehouse receiving:", err);
    return NextResponse.json({ error: "Failed to record receiving" }, { status: 500 });
  }
}
