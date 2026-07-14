import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getOrderById as legacyGet, saveOrder as legacySave } from "@/lib/db";
import {
  getOrderById as sbGet,
  updateOrderStatus,
  createNotification,
  createPickListForOrder,
} from "@/lib/supabase-db";
import { sendPushToUser } from "@/lib/push";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

const STATUS_MESSAGES: Record<string, string> = {
  confirmed:        "Your order has been confirmed and is being prepared.",
  picking:          "We're picking your items from the warehouse.",
  picked:           "Your order has been packed and is ready for pickup.",
  dispatched:       "Your order is on its way!",
  out_for_delivery: "Your order is out for delivery.",
  delivered:        "Your order has been delivered. Thank you!",
  cancelled:        "Your order has been cancelled.",
  failed:           "We were unable to complete your delivery. We'll contact you shortly.",
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  if (useSupabase) {
    const order = await sbGet(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (session.role === "retailer" && order.retailerId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Normalize item fields to match UI expectations (quantity/totalPrice)
    const mapped = {
      ...order,
      items: (order.items ?? []).map((i) => ({
        id: i.id,
        orderId: i.orderId,
        productId: i.productId,
        productName: i.productName,
        productImage: i.productImage,
        quantity: i.qty,
        unitPrice: i.unitPrice,
        totalPrice: i.subtotal,
      })),
    };
    return NextResponse.json({ order: mapped });
  }

  const order = legacyGet(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (session.role === "retailer" && order.userId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ order });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["admin", "warehouse", "driver"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, driverId, notes } = body;

  const validStatuses = [
    "pending", "confirmed", "picking", "picked",
    "dispatched", "out_for_delivery", "delivered", "failed", "cancelled",
  ];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (useSupabase) {
    const order = await sbGet(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const now = new Date().toISOString();
    await updateOrderStatus(id, status, {
      driverId,
      confirmedAt: status === "confirmed" ? now : undefined,
      dispatchedAt: status === "dispatched" ? now : undefined,
      deliveredAt: status === "delivered" ? now : undefined,
    });

    // Auto-create pick list when confirmed
    if (status === "confirmed") {
      try {
        const warehouseId = process.env.DEFAULT_WAREHOUSE_ID ?? "00000000-0000-0000-0000-000000000010";
        await createPickListForOrder(id, warehouseId);
      } catch (e) {
        console.warn("Pick list creation failed:", e);
      }
    }

    // Notify retailer of status change
    const message = STATUS_MESSAGES[status];
    if (message && order.retailerId) {
      await createNotification(order.retailerId, {
        title: `Order ${status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}`,
        body: message,
        type: `order_${status}`,
        data: { orderId: id },
      });
      sendPushToUser(order.retailerId, {
        title: `Order Update — ${id}`,
        body: message,
        url: `/orders/${id}`,
        tag: `order-${id}`,
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, status });
  }

  // Fallback: in-memory
  const order = legacyGet(id);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  const updated = {
    ...order,
    status: status ?? order.status,
    notes: notes ?? order.notes,
    updatedAt: new Date().toISOString(),
    fulfillmentEvents: [
      ...order.fulfillmentEvents,
      ...(status ? [{ id: `fe-${Date.now()}`, orderId: id, status, performedBy: session.name, createdAt: new Date().toISOString() }] : []),
    ],
  };
  legacySave(updated);
  return NextResponse.json({ order: updated });
}
