// POST /api/payments/create-intent
// Creates a PayMongo payment intent and returns the client key for the frontend
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { createPaymentIntent, pesosToCentavos } from "@/lib/paymongo";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { amount, orderId, description } = await req.json();
    if (!amount || !orderId) {
      return NextResponse.json({ error: "amount and orderId required" }, { status: 400 });
    }

    if (!process.env.PAYMONGO_SECRET_KEY) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
    }

    const intent = await createPaymentIntent(
      pesosToCentavos(amount),
      "PHP",
      description ?? `Ka Sari-Sari Order ${orderId}`
    );

    return NextResponse.json({
      intentId: intent.id,
      clientKey: intent.attributes.client_key,
      paymentMethods: intent.attributes.payment_method_allowed,
    });
  } catch (err) {
    console.error("Create intent error:", err);
    return NextResponse.json({ error: "Failed to create payment intent" }, { status: 500 });
  }
}
