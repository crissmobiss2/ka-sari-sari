// GET /api/user/notifications — the retailer/notifications UI contract.
// (Mirrors /api/notifications; the frontend was built against this path.)
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getNotificationsForUser } from "@/lib/db";
import { getNotifications } from "@/lib/supabase-db";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? await getNotifications(session.userId)
    : getNotificationsForUser(session.userId);
  const unread = notifications.filter((n) => !n.isRead).length;
  return NextResponse.json({ notifications, unread });
}
