// GET /api/analytics/summary — the retailer's real spend/savings summary,
// computed from their orders. In demo mode returns {} so the page uses its
// own computed fallback.
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getOrdersByUser } from "@/lib/supabase-db";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({});
  }

  try {
    const orders = await getOrdersByUser(session.userId);
    const orderCount = orders.length;
    const totalSpent = orders.reduce((s, o) => s + Number(o.total ?? 0), 0);
    const avgOrder = orderCount ? Math.round(totalSpent / orderCount) : 0;

    // Savings vs SRP, summed across line items where SRP is known.
    let srpTotal = 0;
    for (const o of orders) {
      const items = (o as unknown as { items?: Array<Record<string, unknown>> }).items ?? [];
      for (const it of items) {
        const qty = Number(it.quantity ?? it.qty ?? 1);
        const price = Number(it.price ?? it.unitPrice ?? it.unit_price ?? 0);
        const srp = Number(it.srp ?? price);
        srpTotal += srp * qty;
      }
    }
    const savings = Math.max(0, srpTotal - totalSpent);
    const savingsPct = srpTotal > 0 ? Math.round((savings / srpTotal) * 100) : 0;

    const last = orders[0] as unknown as { createdAt?: string; created_at?: string } | undefined;
    const lastIso = last?.createdAt ?? last?.created_at;
    const lastOrderLabel = lastIso
      ? new Date(lastIso).toLocaleDateString("en-PH", { month: "short", day: "numeric" })
      : "—";

    return NextResponse.json({
      totalSpent, orderCount, avgOrder, savings, savingsPct, srpTotal, lastOrderLabel,
    });
  } catch (err) {
    console.error("analytics summary error:", err);
    return NextResponse.json({}, { status: 200 }); // page falls back to its own compute
  }
}
