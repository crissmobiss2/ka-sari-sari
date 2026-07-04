import { NextRequest, NextResponse } from "next/server";

function generateOrderId() {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `KSS-${y}${m}${d}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, deliveryAddress, deliveryNotes, paymentMethod, subtotal, deliveryFee, total, storeId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Order must have at least one item" }, { status: 400 });
    }

    if (!deliveryAddress) {
      return NextResponse.json({ error: "Delivery address is required" }, { status: 400 });
    }

    const orderId = generateOrderId();
    const now = new Date().toISOString();

    // In production: save to Supabase
    // const order = await supabase.from("orders").insert({
    //   id: orderId, store_id: storeId, items, delivery_address: deliveryAddress,
    //   delivery_notes: deliveryNotes, payment_method: paymentMethod,
    //   subtotal, delivery_fee: deliveryFee, total, status: "pending",
    //   created_at: now
    // }).select().single();

    const order = {
      id: orderId,
      orderNumber: orderId,
      storeId: storeId || "store-001",
      items,
      deliveryAddress,
      deliveryNotes: deliveryNotes || "",
      paymentMethod: paymentMethod || "cod",
      paymentStatus: paymentMethod === "cod" ? "pending" : "processing",
      subtotal,
      deliveryFee,
      total,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("storeId");
  const status = searchParams.get("status");

  // In production: fetch from Supabase
  // const orders = await supabase.from("orders")
  //   .select("*")
  //   .eq("store_id", storeId)
  //   .order("created_at", { ascending: false });

  return NextResponse.json({ orders: [], total: 0 });
}
