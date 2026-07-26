// POST /api/auth/send-otp — send a verification code for NEW-ACCOUNT signup.
// (Password reset uses /api/auth/forgot-password.) Rejects numbers that are
// already registered, and is rate-limited to curb SMS abuse.
import { NextRequest, NextResponse } from "next/server";
import { sendSMS, generateOTP, hashOTP } from "@/lib/sms";
import { saveOTP, findUserByPhone } from "@/lib/supabase-db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, retryAfterSecs } = await checkRateLimit(`send-otp:${ip}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${retryAfterSecs}s.` },
      { status: 429, headers: { "Retry-After": String(retryAfterSecs) } }
    );
  }

  try {
    const { phone } = await req.json();
    if (!phone || !/^09\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "Enter a valid 11-digit mobile number (09XXXXXXXXX)." },
        { status: 400 }
      );
    }

    if (!useSupabase) {
      // No database configured. In dev, surface a fixed code so the flow is
      // testable; in production, refuse rather than pretend to send.
      if (process.env.NODE_ENV !== "production") {
        console.log(`[DEV] Signup OTP for ${phone}: 123456`);
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }

    // Signup only: the number must not already have an account.
    const existing = await findUserByPhone(phone);
    if (existing) {
      return NextResponse.json(
        { error: "This number is already registered. Please sign in instead." },
        { status: 409 }
      );
    }

    const otp = generateOTP();
    const codeHash = await hashOTP(otp);
    await saveOTP(phone, codeHash, new Date(Date.now() + 10 * 60 * 1000));

    const sent = await sendSMS(
      phone,
      `Your Ka Sari-Sari verification code is: ${otp}. Valid for 10 minutes.`
    );
    if (!sent && process.env.NODE_ENV !== "production") {
      console.log(`[DEV] Signup OTP for ${phone}: ${otp}`);
    } else if (!sent) {
      return NextResponse.json(
        { error: "Couldn't send the code right now. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send-otp error:", err);
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
  }
}
