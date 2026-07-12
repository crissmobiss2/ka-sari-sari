import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const useSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { category, subject, message } = body;

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "subject and message are required" }, { status: 400 });
    }

    const ticketId = `TKT-${Date.now()}`;

    if (useSupabase) {
      const { error } = await supabaseAdmin.from("support_tickets").insert({
        user_id: session.userId,
        category: category ?? "general",
        subject: subject.trim().slice(0, 255),
        message: message.trim().slice(0, 5000),
        status: "open",
      });
      if (error) {
        console.error("[support/ticket] DB write error:", error.code, error.message);
      }
    }

    return NextResponse.json({
      success: true,
      ticketId,
      estimatedResponse: "Within 24 hours",
    });
  } catch {
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
