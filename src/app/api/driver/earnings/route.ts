import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({
      weeklyTotal: 3850,
      monthlyTotal: 15400,
      ytdTotal: 92400,
      deliveryCount: 22,
      completionRate: 96,
      gcashNumber: "09171234567",
      nextPaymentDate: "Friday",
      weeklyBreakdown: [
        { day: "Mon", amount: 650, deliveries: 4 },
        { day: "Tue", amount: 720, deliveries: 5 },
        { day: "Wed", amount: 580, deliveries: 3 },
        { day: "Thu", amount: 900, deliveries: 6 },
        { day: "Fri", amount: 1000, deliveries: 4 },
      ],
      recentDeliveries: [
        {
          id: "ORD-001",
          date: "Today",
          address: "123 Rizal Ave, Caloocan",
          amount: 250,
          tip: 30,
          status: "delivered",
        },
        {
          id: "ORD-002",
          date: "Today",
          address: "456 Del Monte Ave, QC",
          amount: 180,
          tip: 20,
          status: "delivered",
        },
        {
          id: "ORD-003",
          date: "Yesterday",
          address: "789 España Blvd, Manila",
          amount: 320,
          tip: 50,
          status: "delivered",
        },
      ],
    });
  }

  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "driver") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const { data: deliveries } = await supabaseAdmin
    .from("deliveries")
    .select("id, status, updated_at, cod_amount, order:orders(delivery_address, delivery_fee)")
    .eq("driver_id", session.userId)
    .order("updated_at", { ascending: false });

  const all = (deliveries ?? []) as {
    id: string;
    status: string;
    updated_at: string;
    cod_amount: number;
    order: { delivery_address: string; delivery_fee: number } | null;
  }[];

  const delivered = all.filter((d) => d.status === "delivered");
  const completionRate = all.length > 0 ? Math.round((delivered.length / all.length) * 100) : 0;

  const DRIVER_PAY_PER_DELIVERY = 80;

  const weekly = delivered.filter((d) => new Date(d.updated_at) >= startOfWeek);
  const monthly = delivered.filter((d) => new Date(d.updated_at) >= startOfMonth);
  const ytd = delivered.filter((d) => new Date(d.updated_at) >= startOfYear);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyBreakdown = days.map((day, i) => {
    const dayDeliveries = weekly.filter((d) => new Date(d.updated_at).getDay() === i);
    return { day, amount: dayDeliveries.length * DRIVER_PAY_PER_DELIVERY, deliveries: dayDeliveries.length };
  });

  const { data: driverUser } = await supabaseAdmin
    .from("users")
    .select("phone")
    .eq("id", session.userId)
    .single();

  const daysUntilFriday = (5 - now.getDay() + 7) % 7 || 7;
  const nextFriday = new Date(now);
  nextFriday.setDate(now.getDate() + daysUntilFriday);

  return NextResponse.json({
    weeklyTotal: weekly.length * DRIVER_PAY_PER_DELIVERY,
    monthlyTotal: monthly.length * DRIVER_PAY_PER_DELIVERY,
    ytdTotal: ytd.length * DRIVER_PAY_PER_DELIVERY,
    deliveryCount: delivered.length,
    completionRate,
    gcashNumber: driverUser?.phone ?? "",
    nextPaymentDate: nextFriday.toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
    weeklyBreakdown,
    recentDeliveries: delivered.slice(0, 10).map((d) => ({
      id: d.id,
      date: new Date(d.updated_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
      address: d.order?.delivery_address ?? "",
      amount: DRIVER_PAY_PER_DELIVERY,
      tip: 0,
      status: d.status,
    })),
  });
}
