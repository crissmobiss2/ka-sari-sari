import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

type Role = "retailer" | "admin" | "warehouse" | "driver";

const PROTECTED: { pattern: RegExp; roles: Role[] | null }[] = [
  { pattern: /^\/dashboard/, roles: ["retailer"] },
  { pattern: /^\/catalog/,   roles: null },
  { pattern: /^\/cart/,      roles: ["retailer"] },
  { pattern: /^\/orders/,    roles: ["retailer"] },
  { pattern: /^\/account/,   roles: null },
  { pattern: /^\/wallet/,    roles: ["retailer"] },
  { pattern: /^\/favorites/, roles: ["retailer"] },
  { pattern: /^\/analytics/, roles: ["retailer"] },
  { pattern: /^\/notifications/, roles: null },
  { pattern: /^\/support/,   roles: null },
  { pattern: /^\/admin/,     roles: ["admin"] },
  { pattern: /^\/warehouse/, roles: ["warehouse"] },
  { pattern: /^\/driver/,    roles: ["driver"] },
];

const ROLE_HOME: Record<Role, string> = {
  retailer:  "/dashboard",
  admin:     "/admin",
  warehouse: "/warehouse",
  driver:    "/driver",
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const rule = PROTECTED.find((r) => r.pattern.test(pathname));
  if (!rule) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  const session = await verifyToken(token);

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    const res = NextResponse.redirect(url);
    res.cookies.delete(COOKIE_NAME);
    return res;
  }

  // Wrong portal for this role → send them home
  if (rule.roles && !rule.roles.includes(session.role)) {
    const url = req.nextUrl.clone();
    url.pathname = ROLE_HOME[session.role] ?? "/";
    return NextResponse.redirect(url);
  }

  // Pass user info to the page via headers
  const res = NextResponse.next();
  res.headers.set("x-user-id",   session.userId);
  res.headers.set("x-user-role", session.role);
  res.headers.set("x-user-name", session.name);
  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/catalog/:path*",
    "/cart/:path*",
    "/orders/:path*",
    "/account/:path*",
    "/wallet/:path*",
    "/favorites/:path*",
    "/analytics/:path*",
    "/notifications/:path*",
    "/support/:path*",
    "/admin/:path*",
    "/warehouse/:path*",
    "/driver/:path*",
  ],
};
