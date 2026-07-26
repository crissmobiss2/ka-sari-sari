// GET /api/admin/payments — real payment transactions derived from orders.
// The dashboard previously showed a fabricated static list; this returns the
// actual order/payment records. Demo mode returns an empty list.
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getAllOrders } from "@/lib/supabase-db";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ transactions: [] });
  }

  try {
    const orders = await getAllOrders({ limit: 200 });
    const transactions = orders.map((o) => {
      const x = o as unknown as Record<string, unknown>;
      const status = String(x.status ?? "");
      const paid = ["delivered", "out_for_delivery", "dispatched", "picked", "packed"].includes(status);
      const retailer = x.retailerName
        ?? (x.retailer as Record<string, unknown> | undefined)?.name
        ?? "—";
      return {
        id: `tx-${x.id}`,
        orderId: x.id,
        orderNumber: x.orderNumber ?? x.order_number ?? x.id,
        retailer,
        method: x.paymentMethod ?? x.payment_method ?? "cod",
        amount: Number(x.total ?? 0),
        status: status === "cancelled" || status === "failed" ? "failed" : paid ? "completed" : "pending",
        date: x.createdAt ?? x.created_at ?? new Date().toISOString(),
      };
    });
    return NextResponse.json({ transactions });
  } catch (err) {
    console.error("admin payments error:", err);
    return NextResponse.json({ transactions: [] }, { status: 200 });
  }
}
