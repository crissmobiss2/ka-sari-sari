import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({
      transfers: [
        {
          id: "TRF-001",
          fromHub: "Caloocan North",
          toHub: "Quezon City",
          status: "in_transit",
          createdAt: "2026-07-10T08:00:00Z",
          items: [{ productName: "Lucky Me Pancit Canton", qty: 200 }],
        },
        {
          id: "TRF-002",
          fromHub: "Manila Central",
          toHub: "Caloocan North",
          status: "pending",
          createdAt: "2026-07-10T09:30:00Z",
          items: [{ productName: "Fita Crackers", qty: 150 }],
        },
      ],
    });
  }

  // Supabase implementation placeholder
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fromHub, toHub, items, notes } = body;
    void fromHub; void toHub; void items; void notes;

    const transferId = `TRF-${Date.now()}`;

    return NextResponse.json({ success: true, transferId });
  } catch {
    return NextResponse.json({ error: "Failed to create transfer" }, { status: 500 });
  }
}
