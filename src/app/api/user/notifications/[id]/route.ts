// PATCH /api/user/notifications/[id] — mark a single notification read.
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { markNotificationRead } from "@/lib/supabase-db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { isRead } = await req.json().catch(() => ({ isRead: true }));

  // Persist the read direction (Supabase only). The "unread" toggle is a UI
  // nicety and the page updates optimistically regardless.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && isRead !== false) {
    await markNotificationRead(session.userId, id);
  }
  return NextResponse.json({ success: true });
}
