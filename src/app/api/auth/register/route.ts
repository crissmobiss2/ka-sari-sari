import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";
import { findUserByPhone, createUser } from "@/lib/db";
import type { DBUser } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { phone, password, name, storeName, address } = await req.json();

    if (!phone || !password || !name) {
      return NextResponse.json({ error: "Phone, password and name are required" }, { status: 400 });
    }

    if (!phone.startsWith("09") || phone.length < 11) {
      return NextResponse.json({ error: "Invalid Philippine mobile number" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const existing = findUserByPhone(phone);
    if (existing) {
      return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
    }

    const newUser: DBUser = {
      id:           `u-${Date.now()}`,
      phone,
      passwordHash: bcrypt.hashSync(password, 10),
      name,
      role:         "retailer",
      storeName:    storeName || undefined,
      address:      address   || undefined,
      createdAt:    new Date().toISOString(),
    };
    createUser(newUser);

    const token = await signToken({
      userId: newUser.id,
      role:   newUser.role,
      name:   newUser.name,
      phone:  newUser.phone,
    });

    const res = NextResponse.json(
      { user: { id: newUser.id, name: newUser.name, role: newUser.role, phone: newUser.phone } },
      { status: 201 }
    );

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   COOKIE_MAX_AGE,
      path:     "/",
    });

    return res;
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
