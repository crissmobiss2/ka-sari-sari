// POST /api/admin/settings/whatsapp/connect — mark WhatsApp connected.
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const KEY = "whatsapp";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ ok: true, connectionStatus: "connected" });
  try {
    const { data } = await supabaseAdmin.from("app_settings").select("value").eq("key", KEY).single();
    const value = { ...((data?.value ?? {}) as Record<string, unknown>), connectionStatus: "connected" };
    await supabaseAdmin.from("app_settings").upsert({ key: KEY, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    return NextResponse.json({ ok: true, connectionStatus: "connected" });
  } catch (err) {
    console.error("admin whatsapp connect:", err);
    return NextResponse.json({ error: "Failed to connect" }, { status: 500 });
  }
}
