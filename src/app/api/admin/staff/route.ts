// GET/POST /api/admin/staff — staff accounts (users with a staff role).
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
const STAFF_ROLES = ["admin", "warehouse", "driver"];

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!useSupabase) return NextResponse.json({ staff: [] });
  try {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id, name, phone, role, status, created_at")
      .in("role", STAFF_ROLES)
      .order("created_at", { ascending: false });
    const staff = (data ?? []).map((u) => ({
      id: u.id, name: u.name, phone: u.phone, role: u.role,
      status: u.status ?? "active", createdAt: u.created_at,
    }));
    return NextResponse.json({ staff });
  } catch (err) {
    console.error("admin staff GET:", err);
    return NextResponse.json({ staff: [] }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const role = typeof b.role === "string" && STAFF_ROLES.includes(b.role) ? b.role : "warehouse";
  const phone = typeof b.phone === "string" ? b.phone.trim() : "";
  if (!name || !phone) return NextResponse.json({ error: "name and phone are required" }, { status: 400 });

  // Temp password the admin can share; the staff member resets it on first login.
  const tempPassword = typeof b.password === "string" && b.password.length >= 6
    ? b.password
    : `kss${Math.floor(1000 + Math.random() * 9000)}`;

  if (!useSupabase) return NextResponse.json({ id: `staff-${Date.now()}`, tempPassword });

  try {
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const { data, error } = await supabaseAdmin.from("users").insert({
      phone, name, role, password_hash: passwordHash, status: "active",
    }).select("id").single();
    if (error) throw error;
    return NextResponse.json({ id: data.id, tempPassword, success: true }, { status: 201 });
  } catch (err) {
    console.error("admin staff POST:", err);
    return NextResponse.json({ error: "Failed to create staff account" }, { status: 500 });
  }
}
