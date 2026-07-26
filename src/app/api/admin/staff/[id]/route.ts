// PATCH /api/admin/staff/[id] — update a staff account (name/role/status).
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const STAFF_ROLES = ["admin", "warehouse", "driver"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ ok: true });
  try {
    const patch: Record<string, unknown> = {};
    if (typeof b.name === "string") patch.name = b.name;
    if (typeof b.role === "string" && STAFF_ROLES.includes(b.role)) patch.role = b.role;
    if (typeof b.status === "string") patch.status = b.status;
    await supabaseAdmin.from("users").update(patch).eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin staff PATCH:", err);
    return NextResponse.json({ error: "Failed to update staff account" }, { status: 500 });
  }
}
