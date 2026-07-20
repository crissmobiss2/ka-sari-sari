import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({
      deals: [
        {
          id: "deal-1",
          productId: "p-001",
          productName: "Lucky Me Pancit Canton 65g",
          originalPrice: 15,
          discountPercent: 20,
          salePrice: 12,
          stockLeft: 500,
          unit: "pc",
          validUntil: "2026-07-15T00:00:00Z",
          category: "Noodles",
        },
        {
          id: "deal-2",
          productId: "p-002",
          productName: "Coca-Cola 1.5L",
          originalPrice: 65,
          discountPercent: 15,
          salePrice: 55,
          stockLeft: 200,
          unit: "bottle",
          validUntil: "2026-07-12T00:00:00Z",
          category: "Beverages",
        },
        {
          id: "deal-3",
          productId: "p-003",
          productName: "Tide Powder Detergent 1kg",
          originalPrice: 95,
          discountPercent: 10,
          salePrice: 86,
          stockLeft: 300,
          unit: "pack",
          validUntil: "2026-07-20T00:00:00Z",
          category: "Household",
        },
        {
          id: "deal-4",
          productId: "p-004",
          productName: "Nestle Bear Brand 33g",
          originalPrice: 12,
          discountPercent: 25,
          salePrice: 9,
          stockLeft: 800,
          unit: "sachet",
          validUntil: "2026-07-11T00:00:00Z",
          category: "Dairy",
        },
        {
          id: "deal-5",
          productId: "p-005",
          productName: "Palmolive Shampoo 180ml",
          originalPrice: 55,
          discountPercent: 18,
          salePrice: 45,
          stockLeft: 150,
          unit: "bottle",
          validUntil: "2026-07-18T00:00:00Z",
          category: "Personal Care",
        },
        {
          id: "deal-6",
          productId: "p-006",
          productName: "Sky Flakes Crackers 250g",
          originalPrice: 42,
          discountPercent: 12,
          salePrice: 37,
          stockLeft: 400,
          unit: "pack",
          validUntil: "2026-07-25T00:00:00Z",
          category: "Snacks",
        },
      ],
    });
  }

  // Deals/promotions table not yet implemented in production
  return NextResponse.json(
    { error: "Deals/promotions not yet implemented", deals: [] },
    { status: 501 }
  );
}
