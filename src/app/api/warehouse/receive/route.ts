// POST /api/warehouse/receive — goods receiving against purchase order
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !["warehouse", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ purchaseOrders: [] });
  }

  const { data } = await supabaseAdmin
    .from("purchase_orders")
    .select("*, supplier:suppliers(name), items:purchase_order_items(*, product:products(name, sku, unit))")
    .in("status", ["ordered", "partial"])
    .order("created_at", { ascending: false });

  return NextResponse.json({ purchaseOrders: data ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !["warehouse", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ ok: true });
  }

  try {
    const { purchaseOrderId, items, notes } = await req.json();
    // items = [{ purchaseOrderItemId, productId, qtyReceived, batchNumber, expiryDate }]

    for (const item of items) {
      // Increment PO item qty received (read-then-write to avoid overwriting existing partial receipts)
      const { data: existingItem } = await supabaseAdmin
        .from("purchase_order_items")
        .select("qty_received")
        .eq("id", item.purchaseOrderItemId)
        .single();

      const currentQtyReceived = existingItem?.qty_received ?? 0;
      await supabaseAdmin
        .from("purchase_order_items")
        .update({ qty_received: currentQtyReceived + item.qtyReceived })
        .eq("id", item.purchaseOrderItemId);

      // Adjust warehouse stock
      await supabaseAdmin.rpc("adjust_stock", {
        p_product_id: item.productId,
        p_delta: item.qtyReceived,
      });

      // Record batch/expiry if provided (FEFO)
      if (item.expiryDate) {
        await supabaseAdmin
          .from("product_stock")
          .update({
            batch_number: item.batchNumber,
            expiry_date: item.expiryDate,
            last_received_at: new Date().toISOString(),
          })
          .eq("product_id", item.productId)
          .eq("warehouse_id", process.env.DEFAULT_WAREHOUSE_ID ?? "");
      }
    }

    // Check if PO is fully received
    const { data: poItems } = await supabaseAdmin
      .from("purchase_order_items")
      .select("qty_ordered, qty_received")
      .eq("purchase_order_id", purchaseOrderId);

    const allReceived = poItems?.every(
      (i) => (i.qty_received ?? 0) >= i.qty_ordered
    );

    await supabaseAdmin
      .from("purchase_orders")
      .update({
        status: allReceived ? "received" : "partial",
        received_at: allReceived ? new Date().toISOString() : undefined,
        notes: notes ?? undefined,
      })
      .eq("id", purchaseOrderId);

    return NextResponse.json({ ok: true, fullyReceived: allReceived });
  } catch (err) {
    console.error("Goods receiving error:", err);
    return NextResponse.json({ error: "Failed to process receiving" }, { status: 500 });
  }
}
