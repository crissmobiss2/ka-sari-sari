// PATCH /api/admin/credit/[id]/status — suspend/reactivate a credit account.
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
    // Map the credit "status" onto the user's account status.
    const status = b.status === "suspended" ? "suspended" : "active";
    await supabaseAdmin.from("users").update({ status }).eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin credit status PATCH:", err);
    return NextResponse.json({ error: "Failed to update credit status" }, { status: 500 });
  }
}
