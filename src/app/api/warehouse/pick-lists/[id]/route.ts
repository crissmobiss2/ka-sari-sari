// GET/PATCH /api/warehouse/pick-lists/[id]
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { updatePickListItem, completePickList, updateOrderStatus, createNotification } from "@/lib/supabase-db";
import { sendPushToUser } from "@/lib/push";
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

      // Look up the order associated with this pick list and notify the retailer
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const { data: pickList } = await supabaseAdmin
          .from("pick_lists")
          .select("order_id, order:orders(retailer_id, order_number)")
          .eq("id", id)
          .single();

        if (pickList?.order_id) {
          await updateOrderStatus(pickList.order_id, "packed");
          const retailerId = (pickList.order as { retailer_id?: string } | null)?.retailer_id;
          const orderNum = (pickList.order as { order_number?: string } | null)?.order_number ?? pickList.order_id;
          if (retailerId) {
            await createNotification(retailerId, {
              title: "Order Packed",
              body: `Order #${orderNum} has been packed and is ready for dispatch.`,
              type: "order_packed",
              data: { orderId: pickList.order_id },
            });
            sendPushToUser(retailerId, {
              title: "Order Packed",
              body: `Order #${orderNum} is packed and ready to ship!`,
              url: `/orders/${pickList.order_id}`,
            }).catch(() => {});
          }
        }
      }
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
