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
    const { date, deliveries } = await req.json();
    // deliveries = [{ deliveryId, orderId, codExpected, codCollected }]

    const totalExpected = deliveries.reduce((s: number, d: { codExpected: number }) => s + (d.codExpected ?? 0), 0);
    const totalCollected = deliveries.reduce((s: number, d: { codCollected: number }) => s + (d.codCollected ?? 0), 0);
    const variance = totalCollected - totalExpected;

    const { data, error } = await supabaseAdmin
      .from("cod_settlements")
      .upsert({
        driver_id: session.userId,
        date: date ?? new Date().toISOString().split("T")[0],
        total_collected: totalCollected,
        total_expected: totalExpected,
        variance,
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
