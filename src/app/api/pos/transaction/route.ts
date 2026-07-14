import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !["retailer", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { items, total, method, paymentRef, posType } = body;

    if (!items?.length || !total || !method) {
      return NextResponse.json({ error: "items, total, and method are required" }, { status: 400 });
    }

    const transactionId = `TXN-${Date.now()}`;
    const receiptNumber = `OR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`;

    if (useSupabase) {
      const { error } = await supabaseAdmin.from("pos_transactions").insert({
        retailer_id: session.userId,
        items,
        total,
        payment_method: method,
        payment_ref: paymentRef,
        pos_type: posType ?? "walk_in",
        receipt_number: receiptNumber,
      });
      if (error) {
        console.error("[pos/transaction] DB write error:", error.code, error.message);
        return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 });
      }

      // Decrement stock for each sold item
      const stockItems = items as Array<{ productId?: string; quantity?: number }>;
      const decrements = stockItems
        .filter((item) => item.productId)
        .map(async (item) => {
          const { data: prod } = await supabaseAdmin
            .from("products")
            .select("stock_qty")
            .eq("id", item.productId!)
            .single();
          if (!prod) return;
          const newQty = Math.max(0, (prod.stock_qty ?? 0) - (item.quantity ?? 1));
          await supabaseAdmin
            .from("products")
            .update({ stock_qty: newQty })
            .eq("id", item.productId!);
        });
      await Promise.allSettled(decrements);
    }

    return NextResponse.json({ success: true, transactionId, receiptNumber });
  } catch {
    return NextResponse.json({ error: "Failed to process transaction" }, { status: 500 });
  }
}
