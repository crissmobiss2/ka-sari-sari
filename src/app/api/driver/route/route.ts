import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getDriverDeliveries } from "@/lib/supabase-db";

export async function GET(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({
      routeId: "ROUTE-001",
      hub: "Caloocan North",
      totalStops: 6,
      stops: [
        {
          id: "stop-1",
          sequence: 1,
          orderId: "KSS-001",
          customerName: "Maria Santos",
          address: "123 Rizal Ave, Brgy. 5, Caloocan City",
          phone: "09171234567",
          items: ["Lucky Me Pancit Canton x6", "Coke 1.5L x2"],
          codAmount: 0,
          paymentMethod: "gcash",
          status: "delivered",
        },
        {
          id: "stop-2",
          sequence: 2,
          orderId: "KSS-002",
          customerName: "Lourdes Reyes",
          address: "456 Samson Rd, Brgy. 12, Caloocan City",
          phone: "09181234567",
          items: ["Tide Powder 1kg x2", "Palmolive Shampoo x3"],
          codAmount: 450,
          paymentMethod: "cod",
          status: "out_for_delivery",
        },
        {
          id: "stop-3",
          sequence: 3,
          orderId: "KSS-003",
          customerName: "Jose Cruz",
          address: "789 A. Mabini St, Novaliches, QC",
          phone: "09191234567",
          items: ["Bear Brand Milk x12", "Nescafe 3in1 x24"],
          codAmount: 780,
          paymentMethod: "cod",
          status: "pending",
        },
        {
          id: "stop-4",
          sequence: 4,
          orderId: "KSS-004",
          customerName: "Ana Dela Cruz",
          address: "321 Quirino Hwy, Brgy. 3, Caloocan City",
          phone: "09201234567",
          items: ["Fita Crackers x5", "Sky Flakes x10"],
          codAmount: 0,
          paymentMethod: "maya",
          status: "pending",
        },
        {
          id: "stop-5",
          sequence: 5,
          orderId: "KSS-005",
          customerName: "Roberto Lim",
          address: "654 8th Ave, Grace Park, Caloocan City",
          phone: "09211234567",
          items: ["Del Monte Tomato Sauce x6", "Century Tuna x12"],
          codAmount: 320,
          paymentMethod: "cod",
          status: "pending",
        },
        {
          id: "stop-6",
          sequence: 6,
          orderId: "KSS-006",
          customerName: "Carla Mendoza",
          address: "987 Victory Ave, Bagong Silang, Caloocan City",
          phone: "09221234567",
          items: ["Mang Tomas Lechon Sauce x8"],
          codAmount: 190,
          paymentMethod: "cod",
          status: "pending",
        },
      ],
    });
  }

  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "driver") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deliveries = await getDriverDeliveries(session.userId);
  const stops = deliveries.map((d) => ({
    id: d.id,
    sequence: d.routePosition,
    orderId: d.orderId,
    orderNumber: d.orderNumber,
    customerName: d.retailerName,
    address: d.deliveryAddress,
    codAmount: d.codAmount,
    codCollected: d.codCollected,
    status: d.status,
  }));

  return NextResponse.json({
    totalStops: stops.length,
    stops,
  });
}
