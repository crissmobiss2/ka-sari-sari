import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { amount, orderId, description, email, name, phone } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Payment service not configured" }, { status: 503 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kasarisari.vercel.app";
    const encoded = Buffer.from(`${secretKey}:`).toString("base64");

    const response = await fetch("https://api.paymongo.com/v1/sources", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: Math.round(amount * 100), // centavos
            currency: "PHP",
            type: "gcash",
            redirect: {
              success: `${baseUrl}/checkout/success?orderId=${orderId}&method=gcash`,
              failed: `${baseUrl}/checkout/failed?orderId=${orderId}&method=gcash`,
            },
            description: description || `Ka Sari-Sari Order ${orderId}`,
            billing: {
              name: name || "Ka Sari-Sari Customer",
              email: email || "customer@kasarisari.ph",
              phone: phone || "+639000000000",
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("PayMongo GCash error:", errorData);
      return NextResponse.json(
        { error: "Payment source creation failed", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      sourceId: data.data.id,
      checkoutUrl: data.data.attributes.redirect.checkout_url,
      status: data.data.attributes.status,
    });
  } catch (error) {
    console.error("GCash payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
