// POST /api/admin/settings/whatsapp/test — send a test message (stub).
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Real send would call the WhatsApp Business API with the stored key.
  return NextResponse.json({ ok: true, message: "Test message queued." });
}
