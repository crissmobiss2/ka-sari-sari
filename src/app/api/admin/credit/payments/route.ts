// POST /api/admin/credit/payments — record a credit repayment.
// NOTE: there is no outstanding-balance ledger yet (a documented follow-up for
// the full credit-line feature), so this acknowledges the payment without
// mutating a balance. Wire to the ledger when it exists.
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  const amount = Number(b.amount ?? 0);
  if (!b.accountId || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "accountId and a positive amount are required" }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
