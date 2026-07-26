// GET/POST /api/admin/credit — credit accounts overview.
// Derived from users (credit_limit/credit_terms). There is no outstanding-
// balance ledger yet (documented follow-up), so outstanding is 0 here.
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!useSupabase) return NextResponse.json({ accounts: [] });
  try {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id, name, store_name, city, credit_limit, credit_terms, status")
      .eq("role", "retailer")
      .gt("credit_limit", 0);
    const accounts = (data ?? []).map((u) => {
      const x = u as Record<string, unknown>;
      return {
        id: x.id, retailer: x.name, store: x.store_name ?? "—", city: x.city ?? "—",
        creditLimit: Number(x.credit_limit ?? 0), outstanding: 0,
        terms: Number(x.credit_terms ?? 0), oldestInvoiceDays: 0,
        status: x.status === "suspended" ? "suspended" : "good",
      };
    });
    return NextResponse.json({ accounts });
  } catch (err) {
    console.error("admin credit GET:", err);
    return NextResponse.json({ accounts: [] }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  if (!useSupabase) return NextResponse.json({ ok: true });
  try {
    // Grant/set a credit line by matching the retailer by store or name.
    const retailer = String(b.retailer ?? "");
    const limit = Number(b.creditLimit ?? 0);
    const terms = Number(b.terms ?? 0);
    if (retailer) {
      await supabaseAdmin.from("users")
        .update({ credit_limit: limit, credit_terms: terms })
        .or(`store_name.eq.${retailer},name.eq.${retailer}`)
        .eq("role", "retailer");
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("admin credit POST:", err);
    return NextResponse.json({ error: "Failed to set credit line" }, { status: 500 });
  }
}
