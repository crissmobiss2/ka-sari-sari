"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mic, MicOff, Send, ShoppingCart, X, ChevronRight,
  Volume2, Globe, MessageSquare, Loader2,
} from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { NexoflowFooter } from "@/components/ui/nexoflow-footer";
import { useCartStore } from "@/store/cart";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

// ── Language configs ──────────────────────────────────────────────────────────

const LANGUAGES = [
  { id: "fil",    label: "Filipino",    note: "Tagalog",         apiCode: "fil-PH" },
  { id: "en",     label: "English",     note: "Philippine Eng.", apiCode: "en-PH"  },
  { id: "ceb",    label: "Bisaya",      note: "Cebuano",         apiCode: "fil-PH" },
  { id: "ilo",    label: "Ilocano",     note: "Ilokano",         apiCode: "fil-PH" },
  { id: "hil",    label: "Hiligaynon", note: "Ilonggo",          apiCode: "fil-PH" },
  { id: "war",    label: "Waray",       note: "Waray-Waray",     apiCode: "fil-PH" },
];

// ── Product catalog (used for price look-up when building cart items) ─────────

const CATALOG = [
  { id: "c1",  keywords: ["coke", "coca cola", "coca-cola"],          name: "Coca-Cola Regular 330ml",         price: 22  },
  { id: "c2",  keywords: ["lucky me", "pancit canton", "pancit"],     name: "Lucky Me! Pancit Canton 65g",     price: 9   },
  { id: "c3",  keywords: ["555", "sardines", "sardinas"],             name: "555 Sardines Tomato 155g",        price: 18  },
  { id: "c4",  keywords: ["c2", "green tea"],                         name: "C2 Cool & Clean 500ml",           price: 20  },
  { id: "c5",  keywords: ["bear brand", "bear", "evaporated milk"],   name: "Bear Brand Sterilized Milk 163ml",price: 19  },
  { id: "c6",  keywords: ["milo", "chocolate drink", "milo sachet"],  name: "Milo Active Go 33g",              price: 12  },
  { id: "c7",  keywords: ["sky flakes", "skyflakes", "crackers"],     name: "Sky Flakes Crackers 33g",         price: 8   },
  { id: "c8",  keywords: ["chippy", "corn chips", "chipy"],           name: "Chippy BBQ 110g",                 price: 12  },
  { id: "c9",  keywords: ["nescafe", "nescafe 3in1", "nescafe sachet"],name: "Nescafé 3-in-1 20g",            price: 7   },
  { id: "c10", keywords: ["kopiko", "coffee candy"],                  name: "Kopiko Brown Coffee Mix 30g",     price: 8   },
  { id: "c11", keywords: ["marlboro", "cigar", "yosi"],               name: "Marlboro Red 20s",               price: 105 },
  { id: "c12", keywords: ["rebisco", "rebisco crackers"],             name: "Rebisco Crackers 10s",            price: 15  },
  { id: "c13", keywords: ["sprite", "sprite green"],                  name: "Sprite Regular 330ml",            price: 22  },
  { id: "c14", keywords: ["royal", "royal tru-orange", "orange soda"],name: "Royal Tru-Orange 330ml",          price: 22  },
  { id: "c15", keywords: ["boy bawang", "bawang", "peanuts"],         name: "Boy Bawang Cornick Garlic 100g",  price: 19  },
];

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConvHistoryItem {
  role: "user" | "assistant";
  content: string;
}

interface ParsedOrderItem {
  productName: string;
  quantity: number;
  unit: string;
  confidence: "high" | "medium" | "low";
}

interface AIParsedOrder {
  items: ParsedOrderItem[];
  totalEstimate: number;
  clarifications: string[];
}

interface Message {
  id: string;
  from: "user" | "bot";
  text: string;
  isVoice?: boolean;
  timestamp: string;
}

interface CartItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

// ── Welcome messages ──────────────────────────────────────────────────────────

const WELCOME: Message[] = [
  {
    id: "bot-0",
    from: "bot",
    text: "Magandang araw! 👋 Ako si KSS Assistant ng Ka Sari-Sari.\n\nPwede kayong mag-order sa pamamagitan ng boses o text. Piliin lang ang inyong wika at pindutin ang 🎤 para magsalita.\n\nHalimbawa: \"Sampung Coke at dalawampung Lucky Me\"",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  },
];

// ── Chat Bubble ───────────────────────────────────────────────────────────────

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.from === "user";
  return (
    <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white text-[10px] font-bold mt-1">
          KSS
        </div>
      )}
      <div className={cn("max-w-[82%] space-y-1")}>
        <div className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-br-sm bg-brand-500 text-white"
            : "rounded-bl-sm bg-muted text-foreground border border-border"
        )}>
          {message.isVoice && (
            <div className="flex items-center gap-1 mb-1 opacity-70">
              <Mic className="h-3 w-3" />
              <span className="text-[10px]">Boses</span>
            </div>
          )}
          <p className="whitespace-pre-line">{message.text}</p>
        </div>
        <p className={cn("text-[10px] text-muted-foreground px-1", isUser ? "text-right" : "text-left")}>
          {message.timestamp}
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const router = useRouter();
  const { addItem: addCartItem } = useCartStore();

  const [messages, setMessages]         = useState<Message[]>(WELCOME);
  const [input, setInput]               = useState("");
  const [isListening, setIsListening]   = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [cart, setCart]                 = useState<CartItem[]>([]);
  const [showCart, setShowCart]         = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  // AI conversation state
  const [conversationHistory, setConversationHistory] = useState<ConvHistoryItem[]>([]);
  const [isAiLoading, setIsAiLoading]   = useState(false);
  const [aiParsedOrder, setAiParsedOrder] = useState<AIParsedOrder | null>(null);

  const recognitionRef          = useRef<any>(null);
  const chatEndRef              = useRef<HTMLDivElement>(null);
  const conversationHistoryRef  = useRef<ConvHistoryItem[]>([]);

  // Keep ref in sync with state so useCallback can access latest history
  useEffect(() => {
    conversationHistoryRef.current = conversationHistory;
  }, [conversationHistory]);

  // Init/reinit speech recognition when language changes
  useEffect(() => {
    const SpeechRec =
      (typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
    if (!SpeechRec) { setSpeechSupported(false); return; }

    const rec = new SpeechRec();
    rec.lang = selectedLang.apiCode;
    rec.continuous = false;
    rec.interimResults = true;

    rec.onstart  = () => setIsListening(true);
    rec.onend    = () => { setIsListening(false); setLiveTranscript(""); };
    rec.onerror  = () => { setIsListening(false); setLiveTranscript(""); };

    rec.onresult = (event: any) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += t + " ";
        else interim += t;
      }
      setLiveTranscript(interim || finalText.trim());
      if (finalText.trim()) handleSubmit(finalText.trim(), true);
    };

    recognitionRef.current = rec;
    return () => { try { rec.abort(); } catch {} };
  }, [selectedLang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll on new messages, loading state, or parsed order
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveTranscript, isAiLoading, aiParsedOrder]);

  function addMsg(from: "user" | "bot", text: string, isVoice = false): void {
    const msg: Message = {
      id: `${Date.now()}-${Math.random()}`,
      from,
      text,
      isVoice,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, msg]);
  }

  // ── AI-powered text processing ──────────────────────────────────────────────

  const processTextWithAI = useCallback(async (text: string) => {
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/order-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationHistory: conversationHistoryRef.current,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.response) {
        addMsg("bot", "Sorry, may problema. Subukan ulit mamaya.");
        return;
      }

      addMsg("bot", data.response);

      // Append to conversation history
      setConversationHistory((prev) => [
        ...prev,
        { role: "user" as const, content: text },
        { role: "assistant" as const, content: data.response },
      ]);

      // Handle parsed order from AI
      if (data.parsedOrder?.items?.length > 0) {
        setAiParsedOrder(data.parsedOrder);

        // Mirror detected items into the local sticky-cart state
        // Items not found in CATALOG are skipped to avoid ₱0 pricing
        const aiItems: CartItem[] = (data.parsedOrder.items as ParsedOrderItem[])
          .map((item) => {
            const cat = CATALOG.find((c) =>
              c.keywords.some((k) => item.productName.toLowerCase().includes(k))
            );
            if (!cat) return null;
            return {
              id: cat.id,
              name: item.productName,
              qty: item.quantity,
              price: cat.price,
            };
          })
          .filter((item): item is CartItem => item !== null);
        setCart((prev) => {
          const next = [...prev];
          aiItems.forEach((item) => {
            const ex = next.find((p) => p.id === item.id);
            if (ex) ex.qty += item.qty;
            else next.push({ ...item });
          });
          return next;
        });
        setShowCart(true);
      }
    } catch {
      addMsg("bot", "Sorry, may problema. Subukan ulit mamaya.");
    } finally {
      setIsAiLoading(false);
    }
  }, []); // stable — uses ref for history, stable setters for the rest

  const handleSubmit = useCallback((text: string, isVoice = false) => {
    if (!text.trim() || isAiLoading) return;
    setInput("");
    setLiveTranscript("");
    addMsg("user", text.trim(), isVoice);
    processTextWithAI(text.trim());
  }, [processTextWithAI, isAiLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Place order via cart store ──────────────────────────────────────────────

  function placeOrder() {
    if (!aiParsedOrder) return;
    aiParsedOrder.items.forEach((item) => {
      const cat = CATALOG.find((c) =>
        c.keywords.some((k) => item.productName.toLowerCase().includes(k))
      );
      if (!cat) return; // skip unknown products — no price available
      const product: Product = {
        id: cat.id,
        categoryId: "ai-detected",
        name: item.productName,
        slug: item.productName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        unit: item.unit || "piece",
        price: cat.price,
        sku: `AI-${item.productName.slice(0, 8).toUpperCase().replace(/\s/g, "")}`,
        minOrderQty: 1,
        isActive: true,
        isFeatured: false,
        stock: 999,
        lowStockThreshold: 0,
        createdAt: new Date().toISOString(),
      };
      addCartItem(product, item.quantity);
    });
    router.push("/cart");
  }

  function toggleMic() {
    if (!speechSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try { recognitionRef.current.start(); } catch {}
    }
  }

  const cartTotal = cart.reduce((s, i) => s + i.qty * i.price, 0);

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <RetailerTopBar title="Voice Order" />

      {/* Sticky sub-header: lang selector + cart pill */}
      <div className="sticky top-14 z-20 bg-card border-b border-border">
        {/* Language chips */}
        <div className="flex gap-1.5 px-4 pt-2.5 pb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setSelectedLang(lang)}
              className={cn(
                "flex-shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap",
                selectedLang.id === lang.id
                  ? "bg-brand-500 text-white border-brand-500"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-brand-300"
              )}
            >
              {lang.label}
              {selectedLang.id !== lang.id && (
                <span className="ml-1 opacity-50 text-[10px]">{lang.note}</span>
              )}
            </button>
          ))}
        </div>

        {/* Running cart pill */}
        {cart.length > 0 && (
          <div
            onClick={() => setShowCart(!showCart)}
            className="mx-4 mb-2.5 flex items-center justify-between rounded-xl border border-success-200 bg-success-50 px-3 py-2 cursor-pointer hover:bg-success-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-3.5 w-3.5 text-success-600" />
              <span className="text-xs font-semibold text-success-700">
                {cart.length} item{cart.length !== 1 ? "s" : ""} · ₱{cartTotal.toLocaleString()}
              </span>
            </div>
            <span className="text-xs text-success-600 font-semibold">{showCart ? "Isara ▲" : "Tingnan ▼"}</span>
          </div>
        )}

        {/* Cart expansion */}
        {showCart && cart.length > 0 && (
          <div className="mx-4 mb-2.5 rounded-xl border border-border bg-card overflow-hidden shadow-card-md">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-3 py-2 border-b border-border last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground">₱{item.price} × {item.qty}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-sm font-bold tabular-nums">₱{(item.price * item.qty).toLocaleString()}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCart((prev) => prev.filter((p) => p.id !== item.id)); }}
                    className="text-muted-foreground hover:text-danger-500 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <div className="px-3 py-2 border-t border-border flex justify-between bg-surface-50">
              <span className="text-sm font-bold">Total</span>
              <span className="text-sm font-bold text-brand-500">₱{cartTotal.toLocaleString()}</span>
            </div>
            <div className="p-2">
              <Link
                href="/cart"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-colors"
              >
                <ShoppingCart className="h-4 w-4" /> Go to Cart & Checkout
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)}

        {/* AI typing / loading indicator */}
        {isAiLoading && (
          <div className="flex gap-2 justify-start">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white text-[10px] font-bold mt-1">
              KSS
            </div>
            <div className="rounded-2xl rounded-bl-sm bg-muted border border-border px-4 py-3 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Nag-iisip...</span>
            </div>
          </div>
        )}

        {/* AI Order Summary card — appears below the last AI response */}
        {aiParsedOrder && aiParsedOrder.items.length > 0 && !isAiLoading && (
          <div className="rounded-2xl border border-success-200 bg-success-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-success-700">Order Summary</h3>
              <button
                onClick={() => setAiParsedOrder(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-1.5">
              {aiParsedOrder.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-foreground font-medium">
                    {item.quantity}× {item.productName}
                  </span>
                  <span className={cn(
                    "text-[10px] rounded-full px-1.5 py-0.5 font-semibold",
                    item.confidence === "high"
                      ? "bg-success-100 text-success-700"
                      : item.confidence === "medium"
                        ? "bg-warning-100 text-warning-700"
                        : "bg-surface-200 dark:bg-surface-800 text-muted-foreground"
                  )}>
                    {item.confidence}
                  </span>
                </div>
              ))}
            </div>

            {aiParsedOrder.totalEstimate > 0 && (
              <div className="flex justify-between border-t border-success-200 pt-2">
                <span className="text-sm font-semibold text-foreground">Estimated Total</span>
                <span className="text-sm font-bold text-brand-500">
                  ₱{aiParsedOrder.totalEstimate.toLocaleString()}
                </span>
              </div>
            )}

            {aiParsedOrder.clarifications.length > 0 && (
              <div className="rounded-lg bg-warning-50 border border-warning-200 px-3 py-2 space-y-0.5">
                <p className="text-xs font-medium text-warning-700">Needs clarification:</p>
                {aiParsedOrder.clarifications.map((c, i) => (
                  <p key={i} className="text-xs text-warning-600">• {c}</p>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setAiParsedOrder(null)}
                className="flex-1 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={placeOrder}
                className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-colors flex items-center justify-center gap-1.5"
              >
                <ShoppingCart className="h-3.5 w-3.5" /> Place This Order
              </button>
            </div>
          </div>
        )}

        {/* Live voice transcript bubble */}
        {isListening && (
          <div className="flex justify-end">
            <div className="max-w-[82%] rounded-2xl rounded-br-sm bg-brand-500 px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex gap-0.5 items-end">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-white"
                      style={{
                        height: `${8 + i * 3}px`,
                        animation: `bounce 0.8s ease-in-out ${i * 0.12}s infinite alternate`,
                      }}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-white/70 font-medium">Nakikinig...</span>
              </div>
              {liveTranscript && (
                <p className="text-sm text-white leading-relaxed">{liveTranscript}</p>
              )}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <div className="fixed bottom-16 left-0 right-0 border-t border-border bg-card px-4 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !isAiLoading) {
                e.preventDefault();
                handleSubmit(input);
              }
            }}
            placeholder={selectedLang.id === "en" ? "Type your order…" : "I-type ang order…"}
            disabled={isAiLoading}
            className="flex-1 h-11 rounded-xl border border-input bg-muted px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed"
          />

          {isAiLoading ? (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : input.trim() ? (
            <button
              onClick={() => handleSubmit(input)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={toggleMic}
              disabled={!speechSupported}
              title={speechSupported ? "Hold to speak your order" : "Voice not supported in this browser"}
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all",
                isListening
                  ? "bg-danger-500 text-white scale-110 shadow-lg shadow-danger-500/30"
                  : speechSupported
                    ? "bg-brand-500 text-white hover:bg-brand-600 active:scale-95"
                    : "bg-surface-200 text-muted-foreground cursor-not-allowed opacity-50"
              )}
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}
        </div>

        {isListening && (
          <p className="text-xs text-brand-500 text-center font-medium animate-pulse">
            🎤 Nakikinig... Magsalita na po
          </p>
        )}
        {!speechSupported && (
          <p className="text-[11px] text-muted-foreground text-center">
            Voice not supported. Use Chrome for best experience.
          </p>
        )}
      </div>

      <RetailerBottomNav />

      <style>{`
        @keyframes bounce {
          from { transform: scaleY(0.6); }
          to   { transform: scaleY(1.2); }
        }
      `}</style>
    </div>
  );
}
