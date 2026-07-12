import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { updateProductStock } from "@/lib/supabase-db";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !["warehouse", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { productId, adjustment, reason, location } = body;

    if (!productId || typeof adjustment !== "number" || !isFinite(adjustment)) {
      return NextResponse.json({ error: "productId and a finite numeric adjustment are required" }, { status: 400 });
    }

    if (Math.abs(adjustment) > 10000) {
      return NextResponse.json({ error: "Adjustment exceeds maximum allowed delta of 10,000 units" }, { status: 400 });
    }

    if (useSupabase) {
      await updateProductStock(productId, adjustment);
    }

    console.log(`[warehouse/adjust] ${session.userId} adjusted ${productId} by ${adjustment} — ${reason ?? "no reason"} @ ${location ?? "n/a"}`);

    return NextResponse.json({
      success: true,
      productId,
      adjustment,
      message: "Stock adjusted successfully",
    });
  } catch (err) {
    console.error("[warehouse/adjust] Error:", err);
    return NextResponse.json({ error: "Failed to adjust inventory" }, { status: 500 });
  }
}
