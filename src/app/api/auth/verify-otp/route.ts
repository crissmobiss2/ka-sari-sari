// POST /api/auth/verify-otp — validate a code for a phone WITHOUT consuming it.
// Used as the interactive "verify" step in both signup and password reset. The
// code is only consumed by the final action (register / forgot-password PUT).
import { NextRequest, NextResponse } from "next/server";
import { hashOTP } from "@/lib/sms";
import { peekOTP } from "@/lib/supabase-db";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function POST(req: NextRequest) {
  try {
    const { phone, otp } = await req.json();
    if (!phone || !/^09\d{9}$/.test(phone) || !otp || !/^\d{6}$/.test(String(otp))) {
      return NextResponse.json({ error: "Enter the 6-digit code." }, { status: 400 });
    }

    if (!useSupabase) {
      if (process.env.NODE_ENV !== "production") {
        return String(otp) === "123456"
          ? NextResponse.json({ ok: true })
          : NextResponse.json({ error: "Invalid code (use 123456 in dev mode)." }, { status: 400 });
      }
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }

    const codeHash = await hashOTP(String(otp));
    const valid = await peekOTP(phone, codeHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("verify-otp error:", err);
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 });
  }
}
