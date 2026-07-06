"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Mic, MicOff, Send, ShoppingCart, X, ChevronRight,
  Volume2, Globe, MessageSquare,
} from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { NexoflowFooter } from "@/components/ui/nexoflow-footer";
import { cn } from "@/lib/utils";

// ── Language configs ──────────────────────────────────────────────────────────

const LANGUAGES = [
  { id: "fil",    label: "Filipino",    note: "Tagalog",         apiCode: "fil-PH" },
  { id: "en",     label: "English",     note: "Philippine Eng.", apiCode: "en-PH"  },
  { id: "ceb",    label: "Bisaya",      note: "Cebuano",         apiCode: "fil-PH" },
  { id: "ilo",    label: "Ilocano",     note: "Ilokano",         apiCode: "fil-PH" },
  { id: "hil",    label: "Hiligaynon", note: "Ilonggo",          apiCode: "fil-PH" },
  { id: "war",    label: "Waray",       note: "Waray-Waray",     apiCode: "fil-PH" },
];

// ── Product catalog for voice parsing ────────────────────────────────────────

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

// ── Number word → digit (multi-dialect) ──────────────────────────────────────

const NUMBER_MAP: Record<string, number> = {
  // Filipino/Tagalog
  "isa": 1, "isang": 1, "dalawa": 2, "dalawang": 2, "tatlo": 3, "tatlong": 3,
  "apat": 4, "lima": 5, "anim": 6, "pito": 7, "walo": 8, "siyam": 9,
  "sampu": 10, "sampung": 10, "labing-isa": 11, "labindalawa": 12, "labintatlo": 13,
  "labinapat": 14, "labinlima": 15, "labinwalo": 18, "dalawampu": 20, "dalawampung": 20,
  "tatlumpu": 30, "apatnapu": 40, "limampu": 50,
  // Cebuano
  "usa": 1, "duha": 2, "tulo": 3, "upat": 4, "unom": 6, "napulo": 10, "baynte": 20,
  // Ilocano
  "maysa": 1, "dua": 2, "tallo": 3, "uppat": 4, "innem": 6, "sangapulo": 10, "duapulo": 20,
  // Hiligaynon
  "isa_h": 1, "duha_h": 2, "tulo_h": 3, "anum": 6, "napulo_h": 10,
  // English
  "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
  "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
  "eleven": 11, "twelve": 12, "fifteen": 15, "twenty": 20, "thirty": 30,
  "forty": 40, "fifty": 50, "a": 1, "an": 1, "dozen": 12,
};

function extractQty(surroundingWords: string[]): number {
  for (const w of surroundingWords) {
    const num = parseInt(w, 10);
    if (!isNaN(num) && num > 0 && num < 1000) return num;
    if (NUMBER_MAP[w]) return NUMBER_MAP[w];
  }
  return 1;
}

function parseOrder(text: string): { id: string; name: string; qty: number; price: number }[] {
  const lower = text.toLowerCase().replace(/[.,!?]/g, " ");
  const words = lower.split(/\s+/);
  const results: { id: string; name: string; qty: number; price: number }[] = [];

  for (const product of CATALOG) {
    for (const kw of product.keywords) {
      if (lower.includes(kw)) {
        const kwIdx = words.findIndex((_, i) => words.slice(i, i + kw.split(" ").length).join(" ") === kw);
        const window = words.slice(Math.max(0, kwIdx - 4), kwIdx + kw.split(" ").length + 3);
        const qty = extractQty(window);
        if (!results.find((r) => r.id === product.id)) {
          results.push({ id: product.id, name: product.name, qty, price: product.price });
        }
        break;
      }
    }
  }
  return results;
}

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Welcome messages (in Tagalog) ─────────────────────────────────────────────

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
  const [messages, setMessages]         = useState<Message[]>(WELCOME);
  const [input, setInput]               = useState("");
  const [isListening, setIsListening]   = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [cart, setCart]                 = useState<CartItem[]>([]);
  const [showCart, setShowCart]         = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const recognitionRef = useRef<any>(null);
  const chatEndRef     = useRef<HTMLDivElement>(null);

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
  }, [selectedLang]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveTranscript]);

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

  const handleSubmit = useCallback((text: string, isVoice = false) => {
    if (!text.trim()) return;
    setInput("");
    setLiveTranscript("");
    addMsg("user", text.trim(), isVoice);
    processText(text.trim());
  }, []);

  function processText(text: string) {
    const lower = text.toLowerCase();

    // Confirm/checkout intent
    if (/confirm|order na|sige na|i-order|i-checkout|bayad|checkout|yes please|oo|yep/i.test(lower) && cart.length > 0) {
      setOrderConfirmed(true);
      addMsg("bot", `Salamat! Na-record na ang inyong order:\n\n${cart.map(i => `• ${i.qty}× ${i.name}`).join("\n")}\n\nTotal: ₱${cart.reduce((s, i) => s + i.qty * i.price, 0).toLocaleString()}\n\nPumunta na sa cart para i-checkout! ✅`);
      return;
    }

    // Clear/reset
    if (/clear|bago|ulit|new order|reset|cancel/i.test(lower) && cart.length > 0) {
      setCart([]);
      setOrderConfirmed(false);
      addMsg("bot", "Ayos, binura ko na ang listahan. Ano po ang gustong i-order muli?");
      return;
    }

    // Parse for products
    const items = parseOrder(text);

    if (items.length > 0) {
      setCart((prev) => {
        const next = [...prev];
        items.forEach((item) => {
          const existing = next.find((p) => p.id === item.id);
          if (existing) existing.qty += item.qty;
          else next.push({ ...item });
        });
        return next;
      });
      setShowCart(true);

      const listed = items.map((i) => `${i.qty}× ${i.name.split(" ").slice(0, 3).join(" ")}`).join("\n");
      addMsg("bot", `Nakuha ko po:\n${listed}\n\nGusto pa bang magdagdag o i-confirm na ang order?\nSabihin "confirm" para i-order.`);
    } else {
      const helpTexts = [
        "Hindi ko po nakilala ang produkto. Subukan sabihin ang brand name, halimbawa: \"sampung Coke\" o \"24 na Lucky Me\".",
        "Pakiulit po. Sabihin ang produkto at dami — hal. \"dalawampung C2\" o \"30 na sardines\".",
        "Sorry, hindi ko po maintindihan. Pwedeng i-type ang order o subukan muli ng boses.",
      ];
      addMsg("bot", helpTexts[messages.length % helpTexts.length]);
    }
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
            {orderConfirmed ? (
              <div className="p-2">
                <Link
                  href="/cart"
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-colors"
                >
                  <ShoppingCart className="h-4 w-4" /> Go to Cart & Checkout
                </Link>
              </div>
            ) : (
              <div className="p-2">
                <button
                  onClick={() => processText("confirm")}
                  className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-colors"
                >
                  Confirm Order →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)}

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
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(input); } }}
            placeholder={selectedLang.id === "en" ? "Type your order…" : "I-type ang order…"}
            className="flex-1 h-11 rounded-xl border border-input bg-muted px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          {input.trim() ? (
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

      {/* Tip card at top of messages when no orders yet */}
      {cart.length === 0 && messages.length <= 1 && (
        <></>
      )}

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
