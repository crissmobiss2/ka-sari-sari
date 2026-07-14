import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ drivers: [] });
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, phone, vehicle_plate, vehicle_type, status, area, created_at")
    .eq("role", "driver")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ drivers: data ?? [] });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, phone, vehiclePlate, vehicleType, area } = await req.json();

  if (!name || !phone || !vehiclePlate) {
    return NextResponse.json({ error: "name, phone, and vehiclePlate are required" }, { status: 400 });
  }
  if (!phone.startsWith("09") || phone.length < 11) {
    return NextResponse.json({ error: "Invalid Philippine mobile number" }, { status: 400 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const tempPassword = Math.random().toString(36).slice(-8);
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("phone", phone)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({
      name,
      phone,
      password_hash: passwordHash,
      role: "driver",
      vehicle_plate: vehiclePlate.toUpperCase(),
      vehicle_type: vehicleType ?? "Van",
      area: area ?? "",
      status: "active",
    })
    .select("id, name, phone, vehicle_plate, vehicle_type, status, area, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ driver: data, tempPassword }, { status: 201 });
}
