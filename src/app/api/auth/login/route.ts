import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";
import { findUserByPhone, createUser, findUserById } from "@/lib/db";
import type { DBUser } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json();

    if (!phone || !password) {
      return NextResponse.json({ error: "Phone and password required" }, { status: 400 });
    }

    if (!phone.startsWith("09") || phone.length < 11) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    let user = findUserByPhone(phone);

    if (user) {
      // Existing user — verify password
      const valid = bcrypt.compareSync(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
      }
    } else {
      // New phone — create retailer on the fly (demo behaviour)
      const newUser: DBUser = {
        id: `u-${Date.now()}`,
        phone,
        passwordHash: bcrypt.hashSync(password, 10),
        name: `Store Owner (${phone.slice(-4)})`,
        role: "retailer",
        createdAt: new Date().toISOString(),
      };
      createUser(newUser);
      user = findUserById(newUser.id)!;
    }

    const token = await signToken({
      userId: user.id,
      role:   user.role,
      name:   user.name,
      phone:  user.phone,
    });

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, role: user.role, phone: user.phone },
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   COOKIE_MAX_AGE,
      path:     "/",
    });

    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
