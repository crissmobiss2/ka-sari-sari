import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getOrdersByUser, getAllOrders, saveOrder } from "@/lib/db";
import {
  getOrdersByUser as sbGetByUser,
  getAllOrders as sbGetAll,
  createOrder as sbCreate,
  createNotification,
} from "@/lib/supabase-db";
import { sendPushToUser } from "@/lib/push";
import type { Order } from "@/types";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

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
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const driverId = searchParams.get("driverId") ?? undefined;

  if (useSupabase) {
    const isAdmin = session.role === "admin";
    const orders = isAdmin
      ? await sbGetAll({ status, driverId, limit: 100 })
      : await sbGetByUser(session.userId);
    // Map to UI-expected shape
    const mapped = orders.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      userId: o.retailerId,
      storeId: o.retailerId,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      subtotal: o.subtotal,
      deliveryFee: o.deliveryFee,
      total: o.total,
      deliveryAddress: o.deliveryAddress,
      notes: o.notes,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
      retailer: o.retailer,
      items: (o.items ?? []).map(i => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        productImage: i.productImage,
        quantity: i.qty,
        unitPrice: i.unitPrice,
        totalPrice: i.subtotal,
      })),
    }));
    const filtered = status ? mapped.filter(o => o.status === status) : mapped;
    return NextResponse.json({ orders: filtered, total: filtered.length });
  }

  let orders = session.role === "admin" ? getAllOrders() : getOrdersByUser(session.userId);
  if (status) orders = orders.filter(o => o.status === status);
  return NextResponse.json({ orders, total: orders.length });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { items, deliveryAddress, deliveryCity, deliveryNotes, paymentMethod, subtotal, deliveryFee, total } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Order must have at least one item" }, { status: 400 });
    }
    if (!deliveryAddress) {
      return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });
    }

    const orderId = generateOrderId();
    const now = new Date().toISOString();

    if (useSupabase) {
      const order = await sbCreate({
        id: orderId,
        orderNumber: orderId,
        retailerId: session.userId,
        subtotal: subtotal ?? 0,
        deliveryFee: deliveryFee ?? 80,
        discount: 0,
        total: total ?? 0,
        paymentMethod: paymentMethod ?? "cod",
        deliveryAddress,
        deliveryCity,
        notes: deliveryNotes,
        items: items.map((item: {
          productId: string;
          name?: string;
          productName?: string;
          imageUrl?: string;
          productImage?: string;
          quantity?: number;
          qty?: number;
          unitPrice: number;
          totalPrice?: number;
        }) => ({
          productId: item.productId,
          productName: item.name ?? item.productName ?? "",
          productImage: item.imageUrl ?? item.productImage,
          qty: item.quantity ?? item.qty ?? 1,
          unitPrice: item.unitPrice,
          subtotal: item.totalPrice ?? (item.unitPrice * (item.quantity ?? 1)),
        })),
      });

      // Notify admin via push
      await createNotification(session.userId, {
        title: "Order Placed",
        body: `Your order ${orderId} has been received and is being processed.`,
        type: "order_created",
        data: { orderId },
      });
      sendPushToUser(session.userId, {
        title: "Order Placed ✓",
        body: `${orderId} — ₱${(total ?? 0).toLocaleString()} — processing now`,
        url: `/orders/${orderId}`,
        tag: orderId,
      }).catch(() => {});

      return NextResponse.json({ order: { id: order.id, orderNumber: order.orderNumber, status: order.status } }, { status: 201 });
    }

    // Fallback: in-memory
    const order: Order = {
      id: orderId,
      orderNumber: orderId,
      storeId: session.userId,
      userId: session.userId,
      items: items.map((item: { productId: string; product?: object; quantity: number; unitPrice: number; totalPrice: number }, i: number) => ({
        id: `oi-${Date.now()}-${i}`,
        orderId,
        productId: item.productId,
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        status: "pending" as const,
      })),
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: paymentMethod ?? "cod",
      subtotal: subtotal ?? 0,
      deliveryFee: deliveryFee ?? 80,
      total: total ?? 0,
      deliveryAddress,
      notes: deliveryNotes ?? "",
      fulfillmentEvents: [],
      createdAt: now,
      updatedAt: now,
    };
    saveOrder(order);
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error("Create order error:", err);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
