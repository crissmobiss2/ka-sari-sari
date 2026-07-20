// PATCH /api/admin/payments/[id] — update payment status (admin only)
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();
  const allowed = ["completed", "failed", "pending", "processing"] as const;
  type PaymentStatus = typeof allowed[number];
  if (!allowed.includes(status as PaymentStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ id, status });
  }

  const { error } = await supabaseAdmin
    .from("orders")
    .update({ payment_status: status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id, status });
}
