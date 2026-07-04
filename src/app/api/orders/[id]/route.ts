import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getOrderById, saveOrder } from "@/lib/db";
import type { OrderStatus } from "@/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = getOrderById(id);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Retailers can only see their own orders
  if (session.role === "retailer" && order.userId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ order });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!["admin", "warehouse", "driver"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const order = getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { status, notes } = await req.json();
  const validStatuses: OrderStatus[] = [
    "pending", "confirmed", "picking", "packed",
    "out_for_delivery", "delivered", "cancelled",
  ];

  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = {
    ...order,
    status:    status    || order.status,
    notes:     notes     ?? order.notes,
    updatedAt: new Date().toISOString(),
    fulfillmentEvents: [
      ...order.fulfillmentEvents,
      ...(status
        ? [{
            id:          `fe-${Date.now()}`,
            orderId:     id,
            status,
            performedBy: session.name,
            createdAt:   new Date().toISOString(),
          }]
        : []),
    ],
  };

  saveOrder(updated);
  return NextResponse.json({ order: updated });
}
