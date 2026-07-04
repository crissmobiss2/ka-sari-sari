import { NextRequest, NextResponse } from "next/server";
import { db, findUserByPhone } from "@/lib/db";
import bcrypt from "bcryptjs";

// In-memory OTP store (resets on cold start — production should use Redis/Supabase)
const otpStore = new Map<string, { otp: string; expires: number }>();

export async function POST(req: NextRequest) {
  const { phone } = await req.json();

  if (!phone || typeof phone !== "string") {
    return NextResponse.json({ error: "Phone number required" }, { status: 400 });
  }

  // Always return success (don't reveal if phone exists)
  const user = findUserByPhone(phone);
  if (!user) {
    return NextResponse.json({ success: true });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, { otp, expires: Date.now() + 5 * 60 * 1000 });

  // In production: send via Semaphore SMS. For now, log to console.
  console.log(`[OTP] Phone: ${phone}, Code: ${otp}`);

  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
  const { phone, otp, newPassword } = await req.json();

  if (!phone || !otp || !newPassword) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const record = otpStore.get(phone);
  if (!record || record.otp !== otp || Date.now() > record.expires) {
    return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
  }

  const user = findUserByPhone(phone);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Hash new password and update in DB
  user.passwordHash = bcrypt.hashSync(newPassword, 10);
  db.users.set(user.id, user);
  otpStore.delete(phone);

  return NextResponse.json({ success: true });
}
