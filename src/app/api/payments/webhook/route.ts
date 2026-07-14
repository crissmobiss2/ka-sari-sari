import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { updateOrderPayment, updateOrderStatus, getOrderById, creditWallet, createNotification } from "@/lib/supabase-db";
import { sendPushToUser } from "@/lib/push";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("paymongo-signature");
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("[PayMongo webhook] PAYMONGO_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }
    const parts = signature.split(",");
    const timestamp = parts.find(p => p.startsWith("t="))?.split("=")[1];
    const sigHash = parts.find(p => p.startsWith("te="))?.split("=")[1];
    if (!timestamp || !sigHash) {
      return NextResponse.json({ error: "Malformed signature" }, { status: 401 });
    }
    const expectedBuf = Buffer.from(
      createHmac("sha256", webhookSecret).update(`${timestamp}.${rawBody}`).digest("hex")
    );
    const actualBuf = Buffer.from(sigHash);
    if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.data?.attributes?.type;
    const eventData = event.data?.attributes?.data;
    console.log("[PayMongo webhook]", eventType, eventData?.id);

    switch (eventType) {
      case "payment.paid": {
        const paymentIntentId = eventData?.attributes?.payment_intent_id ?? eventData?.id;
        const metadata = eventData?.attributes?.metadata ?? {};
        const orderId = metadata.order_id;

        if (orderId) {
          await updateOrderPayment(orderId, "paid", paymentIntentId);
          await updateOrderStatus(orderId, "confirmed", {
            confirmedAt: new Date().toISOString(),
          });

          const order = await getOrderById(orderId);
          if (order?.retailerId) {
            await createNotification(order.retailerId, {
              title: "Payment Confirmed",
              body: `Your payment for order ${orderId} was successful. Order is now being processed.`,
              type: "payment_paid",
              data: { orderId },
            });
            sendPushToUser(order.retailerId, {
              title: "Payment Confirmed ✓",
              body: `Order ${orderId} — payment received`,
              url: `/orders/${orderId}`,
              tag: `payment-${orderId}`,
            }).catch(() => {});
          }
        }
        break;
      }

      case "payment.failed": {
        const metadata = eventData?.attributes?.metadata ?? {};
        const orderId = metadata.order_id;
        if (orderId) {
          await updateOrderPayment(orderId, "failed");
          await updateOrderStatus(orderId, "failed");
          const order = await getOrderById(orderId);
          if (order?.retailerId) {
            await createNotification(order.retailerId, {
              title: "Payment Failed",
              body: `Payment for order ${orderId} was declined. Please try again.`,
              type: "payment_failed",
              data: { orderId },
            });
          }
        }
        break;
      }

      case "source.chargeable": {
        // GCash/Maya redirect flow — source became chargeable, charge it now
        const sourceId = eventData?.id;
        const amount = eventData?.attributes?.amount;
        const currency = eventData?.attributes?.currency ?? "PHP";
        const metadata = eventData?.attributes?.metadata ?? {};
        const orderId = metadata.order_id;

        const secretKey = process.env.PAYMONGO_SECRET_KEY;
        if (secretKey && sourceId) {
          const encoded = Buffer.from(`${secretKey}:`).toString("base64");
          const chargeRes = await fetch("https://api.paymongo.com/v1/payments", {
            method: "POST",
            headers: { Authorization: `Basic ${encoded}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              data: {
                attributes: {
                  amount,
                  currency,
                  source: { id: sourceId, type: "source" },
                  description: `Ka Sari-Sari Order ${orderId}`,
                  statement_descriptor: "KA SARI-SARI",
                  metadata: { order_id: orderId },
                },
              },
            }),
          });
          if (!chargeRes.ok) {
            const errBody = await chargeRes.text();
            console.error("[webhook] source.chargeable charge failed", chargeRes.status, errBody);
            return NextResponse.json({ error: "charge failed" }, { status: 500 });
          }
        }
        break;
      }

      // Wallet top-up via PayMongo
      case "link.payment.paid": {
        const metadata = eventData?.attributes?.metadata ?? {};
        const userId = metadata.user_id;
        const amountCentavos = eventData?.attributes?.amount ?? 0;
        if (userId && amountCentavos > 0) {
          const amount = amountCentavos / 100;
          await creditWallet(userId, amount, "Wallet Top-Up via PayMongo", eventData?.id);
          await createNotification(userId, {
            title: "Wallet Credited",
            body: `₱${amount.toLocaleString("en-PH")} has been added to your Ka Sari-Sari wallet.`,
            type: "wallet_credited",
            data: { amount },
          });
          sendPushToUser(userId, {
            title: "Wallet Credited ✓",
            body: `₱${amount.toLocaleString("en-PH")} added to your wallet`,
            url: "/wallet",
          }).catch(() => {});
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[PayMongo webhook] Error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
