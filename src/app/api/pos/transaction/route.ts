import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

// POST /api/pos/transaction — record a retailer POS sale.
// Idempotent: the client supplies a stable clientTxnId (generated at sale time,
// possibly minutes earlier while offline). Re-posting the same sale is a no-op,
// so the offline outbox can retry freely without double-recording or
// double-decrementing stock.
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !["retailer", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      clientTxnId,
      deviceId,
      receiptNumber,
      items,
      total,
      method,
      paymentRef,
      posType,
      clientCreatedAt,
    } = body;

    if (!items?.length || !total || !method) {
      return NextResponse.json(
        { error: "items, total, and method are required" },
        { status: 400 }
      );
    }

    // Tolerate direct/legacy callers that don't supply offline fields.
    const txnId = clientTxnId ?? crypto.randomUUID();
    const receipt =
      receiptNumber ??
      `OR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`;
    const createdAt = clientCreatedAt ?? new Date().toISOString();

    if (!useSupabase) {
      // Demo mode: no persistence, but echo success so the offline outbox drains.
      return NextResponse.json({
        success: true,
        transactionId: txnId,
        receiptNumber: receipt,
      });
    }

    const { data, error } = await supabaseAdmin.rpc("record_pos_sale", {
      p_client_txn_id: txnId,
      p_retailer_id: session.userId,
      p_device_id: deviceId ?? null,
      p_items: items,
      p_total: total,
      p_method: method,
      p_ref: paymentRef ?? null,
      p_pos_type: posType ?? "walk_in",
      p_receipt: receipt,
      p_client_created_at: createdAt,
    });

    if (error) {
      console.error("[pos/transaction] RPC error:", error.code, error.message);
      return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 });
    }

    const row = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({
      success: true,
      transactionId: row?.id ?? txnId,
      receiptNumber: row?.receipt_number ?? receipt,
    });
  } catch {
    return NextResponse.json({ error: "Failed to process transaction" }, { status: 500 });
  }
}
