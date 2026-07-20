// POST /api/user/push-subscription — save subscription
// DELETE /api/user/push-subscription — remove subscription
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { savePushSubscription, deletePushSubscription } from "@/lib/supabase-db";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ ok: true });
  }

  try {
    const subscription = await req.json();
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: "Invalid subscription object" }, { status: 400 });
    }
    await savePushSubscription(session.userId, subscription);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Push subscription save error:", err);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ ok: true });
  }

  try {
    const { endpoint } = await req.json();
    if (!endpoint) return NextResponse.json({ error: "endpoint required" }, { status: 400 });
    await deletePushSubscription(endpoint);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Push subscription delete error:", err);
    return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 });
  }
}

export async function GET() {
  // Return VAPID public key so client can create subscription
  const vapidKey = process.env.VAPID_PUBLIC_KEY ?? "";
  return NextResponse.json({ vapidPublicKey: vapidKey });
}
