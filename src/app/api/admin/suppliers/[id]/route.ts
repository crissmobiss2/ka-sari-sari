// PATCH /api/admin/suppliers/[id] — update a supplier.
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ ok: true });
  try {
    const patch: Record<string, unknown> = {};
    if (b.name != null) patch.name = b.name;
    if (b.contact != null || b.contactName != null) patch.contact_name = b.contact ?? b.contactName;
    if (b.email != null) patch.email = b.email;
    if (b.phone != null) patch.phone = b.phone;
    if (b.city != null || b.address != null) patch.address = b.address ?? b.city;
    if (b.status != null) patch.is_active = b.status !== "inactive";
    await supabaseAdmin.from("suppliers").update(patch).eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin suppliers PATCH:", err);
    return NextResponse.json({ error: "Failed to update supplier" }, { status: 500 });
  }
}
