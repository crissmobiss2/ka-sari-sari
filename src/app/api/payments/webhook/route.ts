import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("paymongo-signature");
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

    // Verify webhook signature
    if (webhookSecret && signature) {
      const parts = signature.split(",");
      const timestamp = parts.find((p) => p.startsWith("t="))?.split("=")[1];
      const sigHash = parts.find((p) => p.startsWith("te="))?.split("=")[1];

      if (timestamp && sigHash) {
        const expectedSig = createHmac("sha256", webhookSecret)
          .update(`${timestamp}.${rawBody}`)
          .digest("hex");

        if (expectedSig !== sigHash) {
          console.error("Invalid PayMongo webhook signature");
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.data?.attributes?.type;
    const eventData = event.data?.attributes?.data;

    console.log("PayMongo webhook event:", eventType, eventData?.id);

    switch (eventType) {
      case "payment.paid": {
        const paymentId = eventData?.id;
        const metadata = eventData?.attributes?.metadata;
        const orderId = metadata?.order_id;
        // TODO: update order status to "confirmed" in database
        // await db.orders.update({ id: orderId, status: "confirmed", paymentId });
        console.log(`Payment ${paymentId} confirmed for order ${orderId}`);
        break;
      }

      case "payment.failed": {
        const paymentId = eventData?.id;
        const metadata = eventData?.attributes?.metadata;
        const orderId = metadata?.order_id;
        // TODO: update order status to "failed" in database
        console.log(`Payment ${paymentId} failed for order ${orderId}`);
        break;
      }

      case "source.chargeable": {
        // For GCash/Maya - source is chargeable, create payment charge
        const sourceId = eventData?.id;
        const amount = eventData?.attributes?.amount;
        const currency = eventData?.attributes?.currency;
        const metadata = eventData?.attributes?.metadata;
        const orderId = metadata?.order_id;

        const secretKey = process.env.PAYMONGO_SECRET_KEY;
        if (secretKey) {
          const encoded = Buffer.from(`${secretKey}:`).toString("base64");
          await fetch("https://api.paymongo.com/v1/payments", {
            method: "POST",
            headers: {
              Authorization: `Basic ${encoded}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              data: {
                attributes: {
                  amount,
                  currency,
                  source: { id: sourceId, type: "source" },
                  description: `Ka Sari-Sari Order ${orderId}`,
                  statement_descriptor: "KA SARI-SARI",
                },
              },
            }),
          });
        }
        break;
      }

      default:
        console.log("Unhandled PayMongo event:", eventType);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
