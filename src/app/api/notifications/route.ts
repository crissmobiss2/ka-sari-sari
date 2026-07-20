import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getNotificationsForUser, markAllRead } from "@/lib/db";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/supabase-db";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const notifications = await getNotifications(session.userId);
    const unread = notifications.filter((n) => !n.isRead).length;
    return NextResponse.json({ notifications, unread });
  }

  const notifications = getNotificationsForUser(session.userId);
  const unread = notifications.filter((n) => !n.isRead).length;
  return NextResponse.json({ notifications, unread });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, notificationId } = await req.json().catch(() => ({ action: "markAllRead", notificationId: undefined }));

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (action === "markAllRead") {
      await markAllNotificationsRead(session.userId);
    } else if (action === "markRead" && notificationId) {
      await markNotificationRead(session.userId, notificationId);
    }
    return NextResponse.json({ success: true });
  }

  if (action === "markAllRead") {
    markAllRead(session.userId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
