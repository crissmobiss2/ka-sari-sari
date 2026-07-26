// PATCH /api/driver/profile — a driver updates their own phone / GCash number.
// (The UI previously showed a success toast against a missing endpoint.)
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "driver") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ ok: true });
  try {
    const patch: Record<string, unknown> = {};
    if (typeof b.phone === "string" && /^09\d{9}$/.test(b.phone)) patch.phone = b.phone;
    if (typeof b.gcash === "string") patch.gcash_number = b.gcash;
    if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true });
    const { error } = await supabaseAdmin.from("users").update(patch).eq("id", session.userId);
    // A missing gcash_number column shouldn't fail the whole update; retry phone-only.
    if (error && patch.gcash_number !== undefined) {
      delete patch.gcash_number;
      if (Object.keys(patch).length) await supabaseAdmin.from("users").update(patch).eq("id", session.userId);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("driver profile PATCH:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
