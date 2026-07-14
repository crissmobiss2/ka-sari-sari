// POST /api/payments/topup
// Creates a PayMongo payment link for wallet top-up
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { pesosToCentavos } from "@/lib/paymongo";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rlKey = `payment:topup:${session.userId ?? getClientIp(req)}`;
  const { allowed, retryAfterSecs } = await checkRateLimit(rlKey, 10, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSecs) } }
    );
  }

  try {
    const { amount } = await req.json();
    if (!amount || amount < 50) {
      return NextResponse.json({ error: "Minimum top-up is ₱50" }, { status: 400 });
    }
    if (!process.env.PAYMONGO_SECRET_KEY) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
    }

    const encoded = Buffer.from(`${process.env.PAYMONGO_SECRET_KEY}:`).toString("base64");
    const res = await fetch("https://api.paymongo.com/v1/links", {
      method: "POST",
      headers: { Authorization: `Basic ${encoded}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: pesosToCentavos(amount),
            currency: "PHP",
            description: `Ka Sari-Sari Wallet Top-Up — ${session.name}`,
            remarks: `wallet-${session.userId}`,
            metadata: { user_id: session.userId },
          },
        },
      }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.errors?.[0]?.detail ?? "PayMongo error");

    const link = json.data;
    return NextResponse.json({
      linkId: link.id,
      checkoutUrl: link.attributes.checkout_url,
      referenceNumber: link.attributes.reference_number,
    });
  } catch (err) {
    console.error("Topup error:", err);
    return NextResponse.json({ error: "Failed to create payment link" }, { status: 500 });
  }
}
