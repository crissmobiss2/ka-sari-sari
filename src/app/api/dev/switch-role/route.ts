import { NextRequest, NextResponse } from "next/server";
import { signToken, COOKIE_NAME, COOKIE_MAX_AGE } from "@/lib/auth";

const MOCK_USERS = {
  retailer:  { userId: "u-r1",        role: "retailer"  as const, name: "Maria Santos",   phone: "09181234567" },
  admin:     { userId: "u-admin",     role: "admin"     as const, name: "Admin User",     phone: "09171234567" },
  warehouse: { userId: "u-warehouse", role: "warehouse" as const, name: "Juan dela Cruz", phone: "09172345678" },
  driver:    { userId: "u-driver",    role: "driver"    as const, name: "Ramon Santos",   phone: "09173456789" },
};

const ROLE_HOME: Record<string, string> = {
  retailer:  "/dashboard",
  admin:     "/admin",
  warehouse: "/warehouse",
  driver:    "/driver",
};

export async function GET(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Not available in production mode" }, { status: 403 });
  }

  const role = req.nextUrl.searchParams.get("role") as keyof typeof MOCK_USERS | null;
  if (!role || !MOCK_USERS[role]) {
    return NextResponse.json({ error: "Invalid role. Use: retailer, admin, warehouse, driver" }, { status: 400 });
  }

  const token = await signToken(MOCK_USERS[role]);

  const url = req.nextUrl.clone();
  url.pathname = ROLE_HOME[role];
  url.search = "";

  const res = NextResponse.redirect(url);
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  return res;
}
