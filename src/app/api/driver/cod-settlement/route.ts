// Driver end-of-day COD reconciliation
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !["driver", "admin"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ settlements: [] });
  }

  const driverId = session.role === "admin"
    ? new URL(req.url).searchParams.get("driverId") ?? session.userId
    : session.userId;

  const { data } = await supabaseAdmin
    .from("cod_settlements")
    .select("*")
    .eq("driver_id", driverId)
    .order("date", { ascending: false })
    .limit(30);

  return NextResponse.json({ settlements: data ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "driver") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ ok: true });
  }

  try {
    // UI sends { deliveredCount, failedCount, codCollected, notes, date }
    // Legacy array-based format { date, deliveries } is also supported for backwards compatibility
    const body = await req.json();

    let totalCollected: number;
    let totalExpected: number;
    let deliveredCount: number | undefined;
    let failedCount: number | undefined;
    let notes: string | undefined;
    let date: string | undefined;

    if (Array.isArray(body.deliveries)) {
      // Legacy format: per-delivery array
      const deliveries: { codExpected?: number; codCollected?: number }[] = body.deliveries;
      totalExpected = deliveries.reduce((s, d) => s + (d.codExpected ?? 0), 0);
      totalCollected = deliveries.reduce((s, d) => s + (d.codCollected ?? 0), 0);
      date = body.date;
    } else {
      // Current UI format: summary totals
      totalCollected = Number(body.codCollected ?? 0);
      totalExpected = Number(body.codExpected ?? body.codCollected ?? 0);
      deliveredCount = body.deliveredCount;
      failedCount = body.failedCount;
      notes = body.notes;
      date = body.date;
    }

    const variance = totalCollected - totalExpected;

    const { data, error } = await supabaseAdmin
      .from("cod_settlements")
      .upsert({
        driver_id: session.userId,
        date: date ?? new Date().toISOString().split("T")[0],
        total_collected: totalCollected,
        total_expected: totalExpected,
        variance,
        delivered_count: deliveredCount,
        failed_count: failedCount,
        notes: notes ?? null,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      }, { onConflict: "driver_id,date" })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ settlement: data });
  } catch (err) {
    console.error("COD settlement error:", err);
    return NextResponse.json({ error: "Failed to submit settlement" }, { status: 500 });
  }
}
