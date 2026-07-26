// GET/POST /api/promotions — promotions/deals.
// There is no promotions table yet, so GET returns an empty list (the admin
// page shows its own empty state) and POST is accepted as a no-op. When a
// promotions table is added, wire the queries here.
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ promotions: [] });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  return NextResponse.json({ id: (b.id as string) ?? `promo-${Date.now()}`, ok: true }, { status: 201 });
}
