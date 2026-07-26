import { NextResponse } from "next/server";

// GET /api/config/contact — public support contact details.
// Set SUPPORT_WHATSAPP_NUMBER and SUPPORT_PHONE_NUMBER in the environment
// to your real, monitored channels. The fallbacks below are placeholders
// and MUST be overridden before launch.
export async function GET() {
  const whatsapp = process.env.SUPPORT_WHATSAPP_NUMBER ?? "";
  const phone = process.env.SUPPORT_PHONE_NUMBER ?? "";

  return NextResponse.json(
    { whatsapp, phone },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } }
  );
}
