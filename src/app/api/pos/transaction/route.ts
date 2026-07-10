import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, total, method, paymentRef, posType } = body;
    void items; void total; void method; void paymentRef; void posType;

    const transactionId = `TXN-${Date.now()}`;
    const receiptNumber = `OR-${new Date().getFullYear()}-${Math.floor(Math.random() * 99999)
      .toString()
      .padStart(5, "0")}`;

    return NextResponse.json({ success: true, transactionId, receiptNumber });
  } catch {
    return NextResponse.json({ error: "Failed to process transaction" }, { status: 500 });
  }
}
