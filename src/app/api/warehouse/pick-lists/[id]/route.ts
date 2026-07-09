// GET/PATCH /api/warehouse/pick-lists/[id]
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { updatePickListItem, completePickList } from "@/lib/supabase-db";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session || !["warehouse", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ pickList: null });
  }

  const { data } = await supabaseAdmin
    .from("pick_lists")
    .select("*, order:orders(order_number, delivery_address, retailer:users!retailer_id(name, store_name)), items:pick_list_items(*)")
    .eq("id", id)
    .single();

  return NextResponse.json({ pickList: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session || !["warehouse", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ ok: true });
  }

  try {
    if (body.action === "complete") {
      await completePickList(id);
    } else if (body.itemId) {
      await updatePickListItem(
        body.itemId,
        body.qtyPicked ?? 0,
        body.status ?? "picked"
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Pick list update error:", err);
    return NextResponse.json({ error: "Failed to update pick list" }, { status: 500 });
  }
}
