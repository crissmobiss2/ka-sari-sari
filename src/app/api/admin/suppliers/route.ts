// GET /api/admin/suppliers — list suppliers.  POST — create a supplier.
//
// The suppliers table (supabase/migrations/001_initial_schema.sql) only stores
// name, contact_name, email, phone, address, is_active, created_at. The admin
// page's richer Supplier shape (city, terms, leadTime, totalPurchases, lastOrder,
// categories) has no backing columns, so those are returned with safe defaults.
// `city` is round-tripped through the `address` column (the page has no address
// field and stores its city there on create), keeping create→list consistent.
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

type SupplierRow = {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

// Coerce an unknown JSON value to a trimmed non-empty string, else null.
function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ suppliers: [] });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("suppliers")
      .select("id, name, contact_name, email, phone, address, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const suppliers = ((data ?? []) as SupplierRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      contact: row.contact_name ?? "",
      phone: row.phone ?? "",
      email: row.email ?? "",
      city: row.address ?? "",
      status: row.is_active === false ? "inactive" : "active",
      terms: "COD",
      leadTime: 0,
      totalPurchases: 0,
      lastOrder: "—",
      categories: [] as string[],
    }));

    return NextResponse.json({ suppliers });
  } catch (err) {
    console.error("admin suppliers GET error:", err);
    return NextResponse.json({ suppliers: [] }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = str(body.name);
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ ok: true });
  }

  try {
    const status = typeof body.status === "string" ? body.status : "active";
    const { data, error } = await supabaseAdmin
      .from("suppliers")
      .insert({
        name,
        contact_name: str(body.contact),
        email: str(body.email),
        phone: str(body.phone),
        address: str(body.address) ?? str(body.city),
        is_active: status !== "inactive",
      })
      .select("id, name, contact_name, email, phone, address, is_active, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, supplier: data }, { status: 201 });
  } catch (err) {
    console.error("admin suppliers POST error:", err);
    return NextResponse.json({ error: "Failed to create supplier" }, { status: 500 });
  }
}
