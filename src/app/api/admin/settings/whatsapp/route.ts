// GET/POST /api/admin/settings/whatsapp — WhatsApp Business config.
// The API key is stored server-side (app_settings); never returned to the client.
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = "whatsapp";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!useSupabase) return NextResponse.json({ phoneNumber: "", connectionStatus: "disconnected" });
  try {
    const { data } = await supabaseAdmin.from("app_settings").select("value").eq("key", KEY).single();
    const v = (data?.value ?? {}) as Record<string, unknown>;
    // Never expose the stored API key.
    return NextResponse.json({
      phoneNumber: v.phoneNumber ?? "",
      connectionStatus: v.connectionStatus ?? "disconnected",
      hasApiKey: !!v.apiKey,
    });
  } catch (err) {
    console.error("admin whatsapp GET:", err);
    return NextResponse.json({ phoneNumber: "", connectionStatus: "disconnected" }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  if (!useSupabase) return NextResponse.json({ ok: true });
  try {
    const { data: existing } = await supabaseAdmin.from("app_settings").select("value").eq("key", KEY).single();
    const prev = (existing?.value ?? {}) as Record<string, unknown>;
    const value = {
      ...prev,
      phoneNumber: b.phoneNumber ?? prev.phoneNumber ?? "",
      apiKey: b.apiKey ? String(b.apiKey) : prev.apiKey ?? "",
    };
    await supabaseAdmin.from("app_settings").upsert({ key: KEY, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin whatsapp POST:", err);
    return NextResponse.json({ error: "Failed to save WhatsApp config" }, { status: 500 });
  }
}
