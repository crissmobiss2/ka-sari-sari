import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { category, subject, message, phone } = body;
    void category; void subject; void message; void phone;

    const ticketId = `TKT-${Date.now()}`;

    return NextResponse.json({
      success: true,
      ticketId,
      estimatedResponse: "Within 24 hours",
    });
  } catch {
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
