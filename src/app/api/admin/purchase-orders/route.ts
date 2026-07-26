// GET/POST /api/admin/purchase-orders — purchase orders (purchase_orders table).
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!useSupabase) return NextResponse.json({ purchaseOrders: [] });
  try {
    const { data } = await supabaseAdmin
      .from("purchase_orders")
      .select("*, supplier:suppliers(name), items:purchase_order_items(*)")
      .order("created_at", { ascending: false });
    const purchaseOrders = (data ?? []).map((p) => {
      const x = p as Record<string, unknown>;
      return {
        id: x.id, poNumber: x.po_number, supplierId: x.supplier_id,
        supplier: (x.supplier as Record<string, unknown> | undefined)?.name ?? "—",
        status: x.status, total: Number(x.total ?? 0), notes: x.notes,
        expectedAt: x.expected_at, createdAt: x.created_at,
        items: Array.isArray(x.items) ? x.items : [],
      };
    });
    return NextResponse.json({ purchaseOrders });
  } catch (err) {
    console.error("admin purchase-orders GET:", err);
    return NextResponse.json({ purchaseOrders: [] }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  if (!useSupabase) return NextResponse.json({ ok: true });
  try {
    const poNumber = (b.poNumber as string) ?? `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`;
    const { data, error } = await supabaseAdmin.from("purchase_orders").insert({
      po_number: poNumber,
      supplier_id: b.supplierId ?? null,
      warehouse_id: b.warehouseId ?? process.env.DEFAULT_WAREHOUSE_ID ?? null,
      status: (b.status as string) ?? "draft",
      total: Number(b.total ?? 0),
      created_by: session.userId,
      notes: b.notes ?? null,
    }).select("id, po_number").single();
    if (error) throw error;
    // Insert line items if provided.
    const items = Array.isArray(b.items) ? (b.items as Record<string, unknown>[]) : [];
    if (items.length) {
      await supabaseAdmin.from("purchase_order_items").insert(items.map((it) => ({
        po_id: data.id, product_id: it.productId ?? it.product_id,
        qty_ordered: Number(it.qty ?? it.qtyOrdered ?? 1),
        unit_cost: Number(it.unitCost ?? it.unit_cost ?? 0),
      })));
    }
    return NextResponse.json({ id: data.id, poNumber: data.po_number, success: true }, { status: 201 });
  } catch (err) {
    console.error("admin purchase-orders POST:", err);
    return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 });
  }
}
