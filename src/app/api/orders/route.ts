import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getOrdersByUser, getAllOrders, saveOrder } from "@/lib/db";
import type { Order, OrderStatus } from "@/types";

function generateOrderId() {
  const d = new Date();
  const yy = d.getFullYear().toString().slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `KSS-${yy}${mm}${dd}-${rand}`;
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as OrderStatus | null;

  let orders = session.role === "admin"
    ? getAllOrders()
    : getOrdersByUser(session.userId);

  if (status) {
    orders = orders.filter((o) => o.status === status);
  }

  return NextResponse.json({ orders, total: orders.length });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { items, deliveryAddress, deliveryNotes, paymentMethod, subtotal, deliveryFee, total } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Order must have at least one item" }, { status: 400 });
    }
    if (!deliveryAddress) {
      return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });
    }

    const orderId = generateOrderId();
    const now = new Date().toISOString();

    const order: Order = {
      id:               orderId,
      orderNumber:      orderId,
      storeId:          session.userId,
      userId:           session.userId,
      items:            items.map((item: { productId: string; product?: object; quantity: number; unitPrice: number; totalPrice: number }, i: number) => ({
        id:          `oi-${Date.now()}-${i}`,
        orderId,
        productId:   item.productId,
        product:     item.product,
        quantity:    item.quantity,
        unitPrice:   item.unitPrice,
        totalPrice:  item.totalPrice,
        status:      "pending" as const,
      })),
      status:           "pending",
      paymentStatus:    "pending",
      paymentMethod:    paymentMethod || "cod",
      subtotal:         subtotal || 0,
      deliveryFee:      deliveryFee || 80,
      total:            total || 0,
      deliveryAddress,
      notes:            deliveryNotes || "",
      fulfillmentEvents: [],
      createdAt:        now,
      updatedAt:        now,
    };

    saveOrder(order);
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error("Create order error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
