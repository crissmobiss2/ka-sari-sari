// Real-time driver GPS — POST to update, GET to retrieve
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { updateDriverLocation, getDriverLocation } from "@/lib/supabase-db";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "driver") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ ok: true }); // silent no-op in dev
  }
  try {
    const { lat, lng, heading, speed } = await req.json();
    if (!lat || !lng) return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
    await updateDriverLocation(session.userId, lat, lng, heading, speed);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Driver location error:", err);
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !["admin", "retailer"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ location: null });
  }
  try {
    const driverId = new URL(req.url).searchParams.get("driverId");
    if (!driverId) return NextResponse.json({ error: "driverId required" }, { status: 400 });
    const location = await getDriverLocation(driverId);
    return NextResponse.json({ location });
  } catch (err) {
    console.error("Get location error:", err);
    return NextResponse.json({ error: "Failed to get location" }, { status: 500 });
  }
}
