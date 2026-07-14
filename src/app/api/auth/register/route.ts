import { NextRequest, NextResponse } from "next/server";
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";
import { findUserByPhone, createUser } from "@/lib/supabase-db";
import { findUserByPhone as legacyFind, createUser as legacyCreate } from "@/lib/db";
import type { DBUser } from "@/lib/db";
import bcrypt from "bcryptjs";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, retryAfterSecs } = await checkRateLimit(`register:${ip}`, 5, 3_600_000);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many registration attempts. Try again in ${Math.ceil(retryAfterSecs / 60)} minutes.` },
      { status: 429, headers: { "Retry-After": String(retryAfterSecs) } }
    );
  }

  try {
    const { phone, password, name, storeName, address, city, province } = await req.json();

    if (!phone || !password || !name) {
      return NextResponse.json({ error: "Phone, password and name are required" }, { status: 400 });
    }
    if (!phone.startsWith("09") || phone.length < 11) {
      return NextResponse.json({ error: "Invalid Philippine mobile number" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    let userId: string, role: import("@/lib/auth").SessionRole, userName: string;

    if (useSupabase) {
      const existing = await findUserByPhone(phone);
      if (existing) {
        return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
      }
      const user = await createUser({ phone, password, name, role: "retailer", storeName, address, city, province });
      userId = user.id;
      role = user.role;
      userName = user.name;
    } else {
      const existing = legacyFind(phone);
      if (existing) {
        return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
      }
      const newUser: DBUser = {
        id: `u-${Date.now()}`,
        phone,
        passwordHash: bcrypt.hashSync(password, 10),
        name,
        role: "retailer",
        storeName: storeName || undefined,
        address: address || undefined,
        createdAt: new Date().toISOString(),
      };
      legacyCreate(newUser);
      userId = newUser.id;
      role = newUser.role;
      userName = newUser.name;
    }

    const token = await signToken({ userId, role, name: userName, phone });
    const res = NextResponse.json({ user: { id: userId, name: userName, role, phone } }, { status: 201 });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
