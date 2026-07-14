// POST /api/ai/order-assistant — Claude AI Taglish order parsing + suggestions
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getProducts } from "@/lib/supabase-db";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

type ParsedItem = {
  productName: string;
  quantity: number;
  unit: string;
  confidence: "high" | "medium" | "low";
};

type ParsedOrder = {
  items: ParsedItem[];
  totalEstimate: number;
  clarifications: string[];
  response: string;
};

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || !["retailer"].includes(session.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = getClientIp(req as unknown as Request);
  const rateKey = `ai:${session.userId}:${ip}`;
  const { allowed, retryAfterSecs } = await checkRateLimit(rateKey, 20, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before sending another message." },
      { status: 429, headers: { "Retry-After": String(retryAfterSecs) } }
    );
  }

  const { message, conversationHistory = [] } = await req.json();
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "Message too long (max 2000 characters)" }, { status: 400 });
  }
  // Limit conversation history to last 20 messages to control token usage
  const safeHistory = (conversationHistory as unknown[])
    .filter((m): m is { role: "user" | "assistant"; content: string } =>
      typeof m === "object" && m !== null &&
      ("role" in m) && ("content" in m) &&
      ((m as {role: unknown}).role === "user" || (m as {role: unknown}).role === "assistant") &&
      typeof (m as {content: unknown}).content === "string"
    )
    .slice(-20);

  if (!process.env.ANTHROPIC_API_KEY) {
    // Dev fallback
    return NextResponse.json({
      response: "Order assistant is not configured yet. Please set your ANTHROPIC_API_KEY.",
      parsedOrder: null,
    });
  }

  try {
    // Get product catalog for context
    let catalogContext = "";
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const products = await getProducts();
      const catalog = products
        .slice(0, 100)
        .map((p) => `- ${p.name} (${p.unit}, ₱${p.price}/unit, ID:${p.id})`)
        .join("\n");
      catalogContext = `\nAvailable products:\n${catalog}`;
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const systemPrompt = `Ikaw ay isang order assistant ng Ka Sari-Sari, isang wholesale grocery platform para sa mga sari-sari store sa Pilipinas.

Ang iyong trabaho:
1. Tulungan ang mga retailer na mag-order ng produkto gamit ang natural na Tagalog, Taglish, o English
2. I-parse ang kanilang mensahe at i-identify ang mga produkto at quantities na gusto nilang i-order
3. Mag-suggest ng complementary products o magandang deals
4. Mag-clarify kung hindi malinaw ang order

${catalogContext}

IMPORTANTE: Always respond in Taglish (mix of Tagalog and English). Be friendly and helpful.

When you identify ordered items, include a JSON block in this exact format at the END of your response:
\`\`\`json
{
  "items": [
    {"productName": "string", "quantity": number, "unit": "string", "confidence": "high|medium|low"}
  ],
  "totalEstimate": number,
  "clarifications": ["any unclear items"]
}
\`\`\`

If no order items are detected, return empty items array. Always include the JSON block.`;

    const messages: Anthropic.Messages.MessageParam[] = [
      ...safeHistory,
      { role: "user", content: message },
    ];

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // Extract JSON block
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    let parsedOrder: ParsedOrder | null = null;

    if (jsonMatch) {
      try {
        parsedOrder = JSON.parse(jsonMatch[1]);
      } catch {
        parsedOrder = null;
      }
    }

    // Clean text response (remove the JSON block for display)
    const cleanResponse = text.replace(/```json[\s\S]*?```/, "").trim();

    return NextResponse.json({
      response: cleanResponse,
      parsedOrder,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });
  } catch (err) {
    console.error("AI order assistant error:", err);
    return NextResponse.json({
      response: "Sorry, may problema sa aming AI assistant ngayon. Subukan ulit mamaya.",
      parsedOrder: null,
    });
  }
}
