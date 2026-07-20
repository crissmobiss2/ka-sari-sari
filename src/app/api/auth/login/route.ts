import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";
import { findUserByPhone } from "@/lib/supabase-db";
import { findUserByPhone as findUserByPhoneLegacy } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, retryAfterSecs } = await checkRateLimit(`login:${ip}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many login attempts. Try again in ${retryAfterSecs}s.` },
      { status: 429, headers: { "Retry-After": String(retryAfterSecs) } }
    );
  }

  try {
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json({ error: "Phone and password required" }, { status: 400 });
    }
    if (!phone.startsWith("09") || phone.length < 11) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    let userId: string, role: import("@/lib/auth").SessionRole, name: string, passwordHash: string;

    if (useSupabase) {
      const user = await findUserByPhone(phone);
      if (!user) {
        return NextResponse.json({ error: "No account found for this number" }, { status: 401 });
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
      }
      userId = user.id;
      role = user.role;
      name = user.name;
      passwordHash = user.passwordHash;
    } else {
      // Fallback to in-memory (local dev without Supabase)
      const user = findUserByPhoneLegacy(phone);
      if (!user) {
        return NextResponse.json({ error: "No account found for this number" }, { status: 401 });
      }
      const valid = bcrypt.compareSync(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
      }
      userId = user.id;
      role = user.role;
      name = user.name;
      passwordHash = user.passwordHash;
    }

    const token = await signToken({ userId, role, name, phone });
    const res = NextResponse.json({ user: { id: userId, name, role, phone } });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    void passwordHash; // used above
    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
