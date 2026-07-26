// GET /api/admin/routes — delivery routes, derived from the deliveries table
// grouped by driver. No separate routes table.
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ routes: [] });
  try {
    const { data } = await supabaseAdmin
      .from("deliveries")
      .select("id, order_id, driver_id, status, route_position, driver:users!driver_id(name)")
      .in("status", ["pending", "assigned", "en_route", "arrived"]);
    // Group active deliveries into one route per driver.
    const byDriver = new Map<string, { driverId: string; driver: string; stops: unknown[]; }>();
    for (const d of data ?? []) {
      const x = d as Record<string, unknown>;
      const driverId = String(x.driver_id ?? "unassigned");
      if (!byDriver.has(driverId)) {
        byDriver.set(driverId, {
          driverId,
          driver: (x.driver as Record<string, unknown> | undefined)?.name as string ?? "Unassigned",
          stops: [],
        });
      }
      byDriver.get(driverId)!.stops.push({ id: x.id, orderId: x.order_id, status: x.status, position: x.route_position });
    }
    const routes = Array.from(byDriver.values()).map((r, i) => ({
      id: `route-${r.driverId}`,
      name: `Route ${i + 1}`,
      driverId: r.driverId,
      driver: r.driver,
      stopCount: r.stops.length,
      stops: r.stops,
      status: "active",
    }));
    return NextResponse.json({ routes });
  } catch (err) {
    console.error("admin routes GET:", err);
    return NextResponse.json({ routes: [] }, { status: 200 });
  }
}
