import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { amount, orderId, paymentMethodId } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Payment service not configured" }, { status: 503 });
    }

    const encoded = Buffer.from(`${secretKey}:`).toString("base64");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kasarisari.vercel.app";

    // Step 1: Create payment intent
    const intentRes = await fetch("https://api.paymongo.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: Math.round(amount * 100),
            currency: "PHP",
            payment_method_allowed: ["card"],
            capture_type: "automatic",
            description: `Ka Sari-Sari Order ${orderId}`,
            statement_descriptor: "KA SARI-SARI",
            return_url: `${baseUrl}/checkout/success?orderId=${orderId}&method=card`,
          },
        },
      }),
    });

    if (!intentRes.ok) {
      const errorData = await intentRes.json();
      return NextResponse.json({ error: "Failed to create payment intent", details: errorData }, { status: 400 });
    }

    const intentData = await intentRes.json();
    const intentId = intentData.data.id;
    const clientKey = intentData.data.attributes.client_key;

    // Step 2: Attach payment method if provided
    if (paymentMethodId) {
      const attachRes = await fetch(`https://api.paymongo.com/v1/payment_intents/${intentId}/attach`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${encoded}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          data: {
            attributes: {
              payment_method: paymentMethodId,
              client_key: clientKey,
              return_url: `${baseUrl}/checkout/success?orderId=${orderId}&method=card`,
            },
          },
        }),
      });

      const attachData = await attachRes.json();
      const status = attachData.data?.attributes?.status;
      const nextAction = attachData.data?.attributes?.next_action;

      return NextResponse.json({
        intentId,
        clientKey,
        status,
        nextAction,
        requiresAction: status === "awaiting_next_action",
        redirectUrl: nextAction?.redirect?.url,
      });
    }

    return NextResponse.json({ intentId, clientKey, status: "awaiting_payment_method" });
  } catch (error) {
    console.error("Card payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
