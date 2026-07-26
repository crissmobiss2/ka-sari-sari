// PATCH /api/admin/purchase-orders/[id] — update PO status/fields.
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ ok: true });
  try {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (b.status != null) patch.status = b.status;
    if (b.notes != null) patch.notes = b.notes;
    if (b.total != null) patch.total = Number(b.total);
    await supabaseAdmin.from("purchase_orders").update(patch).eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin purchase-orders PATCH:", err);
    return NextResponse.json({ error: "Failed to update purchase order" }, { status: 500 });
  }
}
