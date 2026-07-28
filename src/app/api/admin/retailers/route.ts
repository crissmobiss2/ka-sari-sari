// GET /api/admin/retailers — retailers awaiting verification (review queue).
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { listRetailersForReview } from "@/lib/supabase-db";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ retailers: [] });
  }

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const statuses = statusParam
    ? statusParam.split(",").map((s) => s.trim()).filter(Boolean)
    : ["pending", "under_review"];

  const rows = await listRetailersForReview(statuses);
  const retailers = rows.map((r) => {
    const profile = Array.isArray(r.profile) ? r.profile[0] : r.profile;
    const docs = Array.isArray(r.docs) ? r.docs : [];
    const p = (profile ?? {}) as Record<string, unknown>;
    return {
      id: r.id,
      name: r.name,
      phone: r.phone,
      storeName: r.store_name,
      city: r.city,
      province: r.province,
      verificationStatus: r.verification_status,
      submittedAt: r.submitted_at,
      createdAt: r.created_at,
      ownerFullName: p.owner_full_name ?? null,
      storeType: p.store_type ?? null,
      docCount: docs.length,
    };
  });

  return NextResponse.json({ retailers, total: retailers.length });
}
