import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const now = new Date();
    const renewal = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    const daysLeft = Math.ceil((renewal.getTime() - now.getTime()) / 86_400_000);
    return NextResponse.json({
      subscription: {
        status: "active",
        plan: "free_trial",
        amount: 0,
        renewalDate: renewal.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }),
        daysLeft,
        paymentHistory: [],
      },
    });
  }

  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ subscription: null });
  }

  const renewalDate = new Date(data.renewal_date);
  const daysLeft = Math.max(0, Math.ceil((renewalDate.getTime() - Date.now()) / 86_400_000));

  const { data: history } = await supabaseAdmin
    .from("subscription_payments")
    .select("created_at, payment_method, amount")
    .eq("user_id", session.userId)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    subscription: {
      status: data.status,
      plan: data.plan,
      amount: data.amount,
      renewalDate: renewalDate.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }),
      daysLeft,
      paymentHistory: (history ?? []).map((h) => ({
        date: new Date(h.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }),
        method: h.payment_method,
        amount: h.amount,
      })),
    },
  });
}
