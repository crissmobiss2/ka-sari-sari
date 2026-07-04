import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getAllOrders, getOrderById, saveOrder } from "@/lib/db";
import type { OrderStatus } from "@/types";

const DELIVERY_STATUSES: OrderStatus[] = ["out_for_delivery", "delivered", "failed_delivery"];

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !["driver", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as OrderStatus | null;

  // Drivers see orders that are ready for delivery or delivered
  let orders = getAllOrders().filter((o) =>
    DELIVERY_STATUSES.includes(o.status)
  );

  if (status) {
    orders = orders.filter((o) => o.status === status);
  }

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

  const order = getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const updated = {
    ...order,
    status,
    notes:     notes ?? order.notes,
    updatedAt: new Date().toISOString(),
    fulfillmentEvents: [
      ...order.fulfillmentEvents,
      {
        id:          `fe-${Date.now()}`,
        orderId,
        status,
        note:        notes,
        performedBy: session.name,
        createdAt:   new Date().toISOString(),
      },
    ],
  };

  saveOrder(updated);
  return NextResponse.json({ delivery: updated });
}
