// GET/PUT /api/admin/settings — admin settings, stored per section in app_settings.
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!useSupabase) return NextResponse.json({ settings: {} });
  try {
    const { data } = await supabaseAdmin.from("app_settings").select("key, value");
    const settings: Record<string, unknown> = {};
    for (const row of data ?? []) settings[(row as { key: string }).key] = (row as { value: unknown }).value;
    return NextResponse.json({ settings });
  } catch (err) {
    console.error("admin settings GET:", err);
    return NextResponse.json({ settings: {} }, { status: 200 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  const section = typeof b.section === "string" ? b.section : "general";
  if (!useSupabase) return NextResponse.json({ ok: true });
  try {
    await supabaseAdmin.from("app_settings").upsert(
      { key: section, value: b.fields ?? {}, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin settings PUT:", err);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
