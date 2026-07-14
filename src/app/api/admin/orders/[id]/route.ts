// PATCH /api/admin/orders/[id] — admin order management (assign driver, dispatch, cancel)
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  updateOrderStatus,
  createNotification,
  getOrderById,
} from "@/lib/supabase-db";
import { sendPushToUser } from "@/lib/push";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data } = await supabaseAdmin
    .from("orders")
    .select(`
      *,
      retailer:users!retailer_id(id, name, store_name, phone),
      items:order_items(*, product:products(name, sku, unit)),
      delivery:deliveries(*, driver:users!driver_id(id, name, phone))
    `)
    .eq("id", id)
    .single();

  return NextResponse.json({ order: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action, driverId, reason } = body;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const order = await getOrderById(id);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (action === "assign_driver") {
      if (!driverId) return NextResponse.json({ error: "driverId required" }, { status: 400 });

      // Create or update delivery record
      const { data: existingDelivery } = await supabaseAdmin
        .from("deliveries")
        .select("id")
        .eq("order_id", id)
        .single();

      if (existingDelivery) {
        await supabaseAdmin
          .from("deliveries")
          .update({ driver_id: driverId, status: "assigned" })
          .eq("id", existingDelivery.id);
      } else {
        await supabaseAdmin.from("deliveries").insert({
          order_id: id,
          driver_id: driverId,
          status: "assigned",
          scheduled_date: new Date().toISOString().split("T")[0],
        });
      }

      await updateOrderStatus(id, "dispatched");

      // Notify retailer
      if (order.retailerId) {
        await createNotification(order.retailerId, {
          title: "Order Dispatched",
          body: "Your order is on its way! A driver has been assigned.",
          type: "order_dispatched",
          data: { orderId: id },
        });
        sendPushToUser(order.retailerId, {
          title: "On the way!",
          body: "Your order has been dispatched.",
          url: `/orders/${id}`,
        }).catch(() => {});
      }

      // Notify driver
      await createNotification(driverId, {
        title: "New Delivery Assigned",
        body: `Order #${order.orderNumber ?? id} has been assigned to you.`,
        type: "delivery_assigned",
        data: { orderId: id },
      });
      sendPushToUser(driverId, {
        title: "New Delivery",
        body: `Order #${order.orderNumber ?? id} assigned.`,
        url: "/driver/deliveries",
      }).catch(() => {});

    } else if (action === "start_picking") {
      await updateOrderStatus(id, "picking");
      if (order.retailerId) {
        await createNotification(order.retailerId, {
          title: "Order Being Prepared",
          body: `Order #${order.orderNumber ?? id} is now being picked by our warehouse team.`,
          type: "order_picking",
          data: { orderId: id },
        });
        sendPushToUser(order.retailerId, {
          title: "Preparing your order",
          body: `Order #${order.orderNumber ?? id} is being picked.`,
          url: `/orders/${id}`,
        }).catch(() => {});
      }
    } else if (action === "mark_packed") {
      await updateOrderStatus(id, "packed");
      if (order.retailerId) {
        await createNotification(order.retailerId, {
          title: "Order Packed",
          body: `Order #${order.orderNumber ?? id} is packed and ready for dispatch.`,
          type: "order_packed",
          data: { orderId: id },
        });
        sendPushToUser(order.retailerId, {
          title: "Order Packed",
          body: `Order #${order.orderNumber ?? id} is ready to ship!`,
          url: `/orders/${id}`,
        }).catch(() => {});
      }
    } else if (action === "cancel") {
      await updateOrderStatus(id, "cancelled");
      if (order.retailerId) {
        await createNotification(order.retailerId, {
          title: "Order Cancelled",
          body: reason ? `Your order was cancelled: ${reason}` : "Your order has been cancelled.",
          type: "order_cancelled",
          data: { orderId: id },
        });
        sendPushToUser(order.retailerId, {
          title: "Order Cancelled",
          body: reason ?? "Your order has been cancelled.",
          url: `/orders/${id}`,
        }).catch(() => {});
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Admin order update error:", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
