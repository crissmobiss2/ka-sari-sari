import { NextRequest, NextResponse } from "next/server";
import { sendSMS, generateOTP, hashOTP } from "@/lib/sms";
import { saveOTP, verifyOTP, findUserByPhone, updateUser } from "@/lib/supabase-db";
import bcrypt from "bcryptjs";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

// POST — send OTP
export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 });
    if (!/^09\d{9}$/.test(phone)) return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });

    if (useSupabase) {
      const user = await findUserByPhone(phone);
      if (!user) return NextResponse.json({ ok: true }); // Don't reveal if account exists

      const otp = generateOTP();
      const codeHash = await hashOTP(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await saveOTP(phone, codeHash, expiresAt);
      const sent = await sendSMS(phone, `Your Ka Sari-Sari reset code is: ${otp}. Valid for 10 minutes.`);
      if (!sent && process.env.NODE_ENV !== "production") {
        console.log(`[DEV] OTP for ${phone}: ${otp}`);
      } else if (!sent) {
        console.error(`[forgot-password] SMS delivery failed for phone ending ${phone.slice(-4)}`);
      }
    } else {
      console.log(`[DEV] OTP for ${phone}: 123456`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}

// PUT — verify OTP + reset password
export async function PUT(req: NextRequest) {
  try {
    const { phone, otp, newPassword } = await req.json();
    if (!phone || !otp || !newPassword) {
      return NextResponse.json({ error: "Phone, OTP, and new password required" }, { status: 400 });
    }
    if (!/^09\d{9}$/.test(phone)) return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 });
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (useSupabase) {
      const codeHash = await hashOTP(otp);
      const valid = await verifyOTP(phone, codeHash);
      if (!valid) return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });

      const user = await findUserByPhone(phone);
      if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await updateUser(user.id, { passwordHash });
    } else {
      if (otp !== "123456") {
        return NextResponse.json({ error: "Invalid OTP (use 123456 in dev mode)" }, { status: 400 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
