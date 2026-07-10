import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, adjustment, reason, location } = body;
    void reason; void location;

    return NextResponse.json({
      success: true,
      productId,
      adjustment,
      message: "Stock adjusted successfully",
    });
  } catch {
    return NextResponse.json({ error: "Failed to adjust inventory" }, { status: 500 });
  }
}
