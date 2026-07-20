import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getAdminStats as getAdminStatsLegacy, getAllOrders } from "@/lib/db";
import { getAdminStats } from "@/lib/supabase-db";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const stats = await getAdminStats();

    // Recent orders with retailer info
    const { data: recentOrders } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, status, total, created_at, retailer:users!retailer_id(name, store_name)")
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({ stats, recentOrders: recentOrders ?? [] });
  }

  const stats = getAdminStatsLegacy();
  const recentOrders = getAllOrders().slice(0, 10);
  return NextResponse.json({ stats, recentOrders });
}
