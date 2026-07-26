// POST /api/user/notifications/read-all — mark all of the user's notifications read.
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { markAllRead } from "@/lib/db";
import { markAllNotificationsRead } from "@/lib/supabase-db";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    await markAllNotificationsRead(session.userId);
  } else {
    markAllRead(session.userId);
  }
  return NextResponse.json({ success: true });
}
