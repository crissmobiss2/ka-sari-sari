// GET /api/admin/subscriptions — retailer subscriptions, derived from the users
// table (subscription_status / subscription_expires_at). No separate table.
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ subscriptions: [] });
  try {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id, name, store_name, phone, subscription_status, subscription_expires_at, created_at")
      .eq("role", "retailer")
      .order("created_at", { ascending: false });
    const subscriptions = (data ?? []).map((u) => {
      const x = u as Record<string, unknown>;
      return {
        id: x.id, storeName: x.store_name ?? "—", ownerName: x.name, phone: x.phone,
        plan: "Standard",
        status: x.subscription_status ?? "trial",
        startedAt: x.created_at,
        expiresAt: x.subscription_expires_at ?? null,
      };
    });
    return NextResponse.json({ subscriptions });
  } catch (err) {
    console.error("admin subscriptions GET:", err);
    return NextResponse.json({ subscriptions: [] }, { status: 200 });
  }
}
