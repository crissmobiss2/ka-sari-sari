import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getAllOrders, getOrderById, saveOrder } from "@/lib/db";
import { getDriverDeliveries } from "@/lib/supabase-db";
import { supabaseAdmin } from "@/lib/supabase";
import type { OrderStatus } from "@/types";

const DELIVERY_STATUSES: OrderStatus[] = ["out_for_delivery", "delivered", "failed_delivery"];

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !["driver", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const driverId = session.role === "admin"
      ? searchParams.get("driverId") ?? session.userId
      : session.userId;

    const deliveries = await getDriverDeliveries(driverId);

    const filtered = statusFilter
      ? deliveries.filter((d) => d.status === statusFilter)
      : deliveries;

    return NextResponse.json({ deliveries: filtered, total: filtered.length });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as OrderStatus | null;

  let orders = getAllOrders().filter((o) => DELIVERY_STATUSES.includes(o.status));
  if (status) orders = orders.filter((o) => o.status === status);

  return NextResponse.json({ deliveries: orders, total: orders.length });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !["driver", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderId, status, notes } = await req.json();

  const driverStatuses: OrderStatus[] = ["out_for_delivery", "delivered", "failed_delivery", "returned"];
  if (!driverStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid delivery status" }, { status: 400 });
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const order = getOrderById(orderId);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const updated = {
    ...order,
    status,
    notes: notes ?? order.notes,
    updatedAt: new Date().toISOString(),
    fulfillmentEvents: [
      ...order.fulfillmentEvents,
      {
        id: `fe-${Date.now()}`,
        orderId,
        status,
        note: notes,
        performedBy: session.name,
        createdAt: new Date().toISOString(),
      },
    ],
  };

  saveOrder(updated);
  return NextResponse.json({ delivery: updated });
}
