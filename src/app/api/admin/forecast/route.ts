// GET /api/admin/forecast — Claude AI demand forecasting
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      forecast: getMockForecast(),
      source: "mock",
    });
  }

  try {
    const days = parseInt(new URL(req.url).searchParams.get("days") ?? "30");

    // Gather recent order data for context
    let salesContext = "";
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const { data: recentOrders } = await supabaseAdmin
        .from("order_items")
        .select("product_id, quantity, products(name, category_id)")
        .gte("created_at", cutoff.toISOString())
        .limit(500);

      if (recentOrders && recentOrders.length > 0) {
        // Aggregate by product
        const productSales: Record<string, { name: string; qty: number }> = {};
        for (const item of recentOrders) {
          const pid = item.product_id;
          const pname = (item as unknown as { products?: { name?: string } }).products?.name ?? pid;
          if (!productSales[pid]) productSales[pid] = { name: pname, qty: 0 };
          productSales[pid].qty += item.quantity;
        }

        const topProducts = Object.values(productSales)
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 20);

        salesContext = `Recent ${days}-day sales data:\n${topProducts
          .map((p) => `- ${p.name}: ${p.qty} units sold`)
          .join("\n")}`;
      }
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are a demand forecasting analyst for Ka Sari-Sari, a B2B grocery wholesale platform in the Philippines serving sari-sari stores.

${salesContext || "No sales data available yet."}

Based on this data and your knowledge of Filipino sari-sari store purchasing patterns:
1. Identify the top 10 products likely to need restocking in the next 7 days
2. Flag any seasonal/holiday demand spikes to watch for
3. Suggest optimal reorder quantities

Format your response as JSON with this structure:
{
  "topReorders": [{"productName": string, "urgency": "critical"|"high"|"medium", "suggestedQty": number, "reason": string}],
  "seasonalAlerts": [{"alert": string, "affectedProducts": string[]}],
  "insights": string
}`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const forecast = jsonMatch ? JSON.parse(jsonMatch[0]) : getMockForecast();

    return NextResponse.json({ forecast, source: "claude" });
  } catch (err) {
    console.error("Forecast error:", err);
    return NextResponse.json({ forecast: getMockForecast(), source: "mock" });
  }
}

function getMockForecast() {
  return {
    topReorders: [
      { productName: "Lucky Me Instant Noodles (Chicken)", urgency: "critical", suggestedQty: 200, reason: "Fast-moving SKU, low estimated stock" },
      { productName: "Coca-Cola 1.5L", urgency: "high", suggestedQty: 100, reason: "Weekend demand spike expected" },
      { productName: "Marlboro Red", urgency: "high", suggestedQty: 50, reason: "Consistent daily mover" },
    ],
    seasonalAlerts: [
      { alert: "Payday weekend approaching — expect 2x demand on beverages and snacks", affectedProducts: ["Coca-Cola", "Pepsi", "Piattos", "Nova"] },
    ],
    insights: "Overall demand trending stable. Focus restocking on beverages and noodles for highest turnover.",
  };
}
