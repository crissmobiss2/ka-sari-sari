// POST /api/admin/retailers/invite — invite a retailer (records the intent).
// A real invite would send an SMS with a signup link; here we acknowledge it.
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { sendSMS } from "@/lib/sms";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({} as Record<string, unknown>));
  const phone = typeof b.phone === "string" ? b.phone : "";
  if (!/^09\d{9}$/.test(phone)) return NextResponse.json({ error: "Valid mobile number required" }, { status: 400 });

  // Best-effort SMS invite (no-op if Semaphore isn't configured).
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ka-sari-sari.vercel.app";
  await sendSMS(phone, `You're invited to join Ka Sari-Sari! Register your store at ${appUrl}/register`).catch(() => {});

  return NextResponse.json({ ok: true });
}
