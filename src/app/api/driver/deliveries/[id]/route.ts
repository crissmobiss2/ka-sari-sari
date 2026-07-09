// PATCH /api/driver/deliveries/[id] — update delivery status, record POD, log failed attempt
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  recordDeliveryProof,
  recordDeliveryAttempt,
  updateOrderStatus,
  createNotification,
  getOrderById,
} from "@/lib/supabase-db";
import { sendPushToUser } from "@/lib/push";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "driver") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: deliveryId } = await params;
  const body = await req.json();
  const {
    action, // "delivered" | "failed_attempt"
    proofPhotoUrl,
    signatureUrl,
    recipientName,
    codCollected,
    lat,
    lng,
    failureReason,
    notes,
    orderId,
  } = body;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ ok: true }); // dev fallback
  }

  try {
    if (action === "delivered") {
      await recordDeliveryProof(deliveryId, {
        proofPhotoUrl,
        signatureUrl,
        recipientName,
        codCollected,
        lat,
        lng,
      });

      if (orderId) {
        await updateOrderStatus(orderId, "delivered", {
          deliveredAt: new Date().toISOString(),
        });
        const order = await getOrderById(orderId);
        if (order?.retailerId) {
          await createNotification(order.retailerId, {
            title: "Order Delivered",
            body: "Your order has been delivered. Thank you for choosing Ka Sari-Sari!",
            type: "order_delivered",
            data: { orderId },
          });
          sendPushToUser(order.retailerId, {
            title: "Delivered ✓",
            body: `Order ${orderId} has been delivered.`,
            url: `/orders/${orderId}`,
          }).catch(() => {});
        }
      }
    } else if (action === "failed_attempt") {
      await recordDeliveryAttempt(deliveryId, failureReason ?? "not_home", notes);
      if (orderId) {
        const order = await getOrderById(orderId);
        if (order?.retailerId) {
          await createNotification(order.retailerId, {
            title: "Delivery Attempt Failed",
            body: `We tried to deliver your order but were unable to. Reason: ${failureReason ?? "not home"}. We'll try again.`,
            type: "delivery_failed",
            data: { orderId },
          });
        }
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delivery update error:", err);
    return NextResponse.json({ error: "Failed to update delivery" }, { status: 500 });
  }
}
