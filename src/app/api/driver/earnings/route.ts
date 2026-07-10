import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
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

  // Supabase implementation placeholder
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
