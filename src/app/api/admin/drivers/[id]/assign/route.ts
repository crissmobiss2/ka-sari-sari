// POST /api/admin/drivers/[id]/assign — assign a driver to a route's deliveries.
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: driverId } = await params;
  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ ok: true });
  try {
    // A "route" is a group of pending deliveries; assign them to this driver.
    // routeId is derived as route-<driverId>; reassign that group's deliveries.
    const routeId = String(b.routeId ?? "");
    const fromDriver = routeId.replace(/^route-/, "");
    if (fromDriver && fromDriver !== "unassigned") {
      await supabaseAdmin.from("deliveries")
        .update({ driver_id: driverId, status: "assigned" })
        .eq("driver_id", fromDriver)
        .in("status", ["pending", "assigned"]);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin drivers assign:", err);
    return NextResponse.json({ error: "Failed to assign driver" }, { status: 500 });
  }
}
