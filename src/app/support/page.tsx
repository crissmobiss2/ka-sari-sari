"use client";
import { useState, useRef, useEffect } from "react";
import { MessageCircle, Phone, ChevronDown, ChevronUp, Send } from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FAQS = [
  { q: "How do I place my first order?", a: "Browse the catalog, add items to your cart, then go to checkout. Make sure your subscription is active before placing an order." },
  { q: "What is the minimum order quantity?", a: "Each product has its own minimum order quantity (MOQ), shown on the product card. MOQ varies by product and unit size." },
  { q: "How long does delivery take?", a: "Standard delivery is 2–3 business days after order confirmation. We'll notify you at every step of the delivery." },
  { q: "Can I cancel or modify an order?", a: "You can request a cancellation within 1 hour of placing an order, before it enters the picking stage. Contact support immediately." },
  { q: "What payment methods are accepted?", a: "We accept GCash, Maya, bank transfer, and cash on delivery. All payments are processed securely." },
  { q: "How does the PHP 1,000 fee work?", a: "It's a one-time annual platform access fee per store. After payment, you can place unlimited orders for 12 months." },
];

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  time: string;
}

function getTimeNow(): string {
  return new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
}

function getBotResponse(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("coke") || lower.includes("cola")) {
    return "✅ Added: Coca-Cola Regular 330ml × 24 = ₱1,176.00. Anything else?";
  }
  if (lower.includes("lucky me") || lower.includes("noodle") || lower.includes("pancit")) {
    return "✅ Added: Lucky Me! Pancit Canton × 48 = ₱1,344.00. Type 'show cart' to view.";
  }
  if (lower.includes("sardine") || lower.includes("555")) {
    return "✅ Added: 555 Sardines Tomato Sauce × 24 = ₱1,680.00. Sulit! Anything else?";
  }
  if (lower.includes("show cart") || lower.includes("cart")) {
    return "🛒 Your cart:\n• Coca-Cola 330ml × 24 — ₱1,176\n• [other items]\n\nTotal: ₱2,520\nType 'checkout' to proceed!";
  }
  if (lower.includes("checkout") || lower.includes("order na")) {
    return "🎉 Order placed! KSS-2025-00150\nTotal: ₱2,520.00 (GCash)\nDelivery: Jan 23–24\nYou'll get updates via WhatsApp!";
  }
  if (lower.includes("deals") || lower.includes("sale") || lower.includes("promo")) {
    return "🔥 Today's deals:\n• Coca-Cola 330ml: -15% = ₱49 each\n• Lucky Me!: -20% = ₱14 each\n\nOrder now with 'order 48 lucky me'!";
  }
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("oi")) {
    return "Hi! 👋 Ready to order? Try 'order 24 coke' or type 'deals' to see today's promos!";
  }
  return "I didn't quite get that 🤔 Try: 'order 24 coke', 'show cart', 'checkout', or 'deals'";
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "bot-0",
    sender: "bot",
    text: "Hi! 👋 I'm your Ka Sari-Sari ordering assistant. You can order using simple commands like:\n• 'order 24 coke' — add to cart\n• 'show cart' — view your cart\n• 'checkout' — proceed to payment\n• 'deals' — see today's promotions\n\nWhat would you like to order today?",
    time: "10:32 AM",
  },
  {
    id: "user-0",
    sender: "user",
    text: "order 24 coke",
    time: "10:33 AM",
  },
  {
    id: "bot-1",
    sender: "bot",
    text: "✅ Added to cart: Coca-Cola Regular 330ml × 24 pcs\nPrice: ₱1,176.00\nType 'show cart' to see everything or continue ordering!",
    time: "10:33 AM",
  },
];

const SUGGESTION_CHIPS = ["order 24 coke", "show cart", "deals", "checkout"];

function WhatsAppChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmed,
      time: getTimeNow(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: getBotResponse(trimmed),
        time: getTimeNow(),
      };
      setIsTyping(false);
      setMessages((prev) => [...prev, botMsg]);
    }, 800);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      sendMessage(input);
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-card">
      {/* WhatsApp header */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: "#075E54" }}>
        <svg
          viewBox="0 0 24 24"
          fill="white"
          className="h-6 w-6 shrink-0"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-tight">Ka Sari-Sari Bot</p>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-400 shrink-0" />
            <span className="text-xs text-white/80">Online</span>
          </div>
        </div>
      </div>

      {/* Chat messages area */}
      <div
        className="flex flex-col gap-2 px-3 py-4 overflow-y-auto"
        style={{ minHeight: 280, maxHeight: 360, backgroundColor: "#ECE5DD" }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex", msg.sender === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "relative max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm",
                msg.sender === "user"
                  ? "rounded-tr-none text-gray-800"
                  : "rounded-tl-none bg-white text-gray-800"
              )}
              style={msg.sender === "user" ? { backgroundColor: "#DCF8C6" } : undefined}
            >
              <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
              <p className="mt-1 text-right text-[10px] text-gray-500">{msg.time}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="rounded-lg rounded-tl-none bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1">
                <span
                  className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-2 w-2 rounded-full bg-gray-400 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion chips */}
      <div className="flex gap-2 overflow-x-auto px-3 py-2 bg-white border-t border-gray-100 scrollbar-hide">
        {SUGGESTION_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => {
              setInput(chip);
              inputRef.current?.focus();
            }}
            className="shrink-0 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors whitespace-nowrap"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-t border-gray-200">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ ["--tw-ring-color" as string]: "#075E54" }}
          disabled={isTyping}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isTyping}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "#075E54" }}
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!message.trim()) return;
    await new Promise((r) => setTimeout(r, 600));
    setSent(true);
    setMessage("");
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar title="Help & Support" />

      <div className="px-4 py-5 space-y-6">
        {/* Contact options */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
              <MessageCircle className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">Live Chat</p>
            <p className="text-xs text-muted-foreground">Mon–Sat, 8AM–6PM</p>
          </div>
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
              <Phone className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">Call us</p>
            <p className="text-xs text-muted-foreground">+63 2 8XXX XXXX</p>
          </div>
        </div>

        {/* Message form */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-5 space-y-3">
          <h3 className="font-display text-sm font-semibold text-foreground">Send a message</h3>
          {sent ? (
            <div className="rounded-xl bg-success-50 border border-success-500/25 px-4 py-3 text-sm text-success-700 text-center">
              Message sent! We&apos;ll reply within 24 hours.
            </div>
          ) : (
            <>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue or question…"
                rows={4}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
              <Button size="md" className="w-full" onClick={handleSend} disabled={!message.trim()}>
                <Send className="h-4 w-4" /> Send message
              </Button>
            </>
          )}
        </div>

        {/* FAQs */}
        <div>
          <h3 className="font-display text-base font-semibold text-foreground mb-3">Frequently asked questions</h3>
          <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden divide-y divide-border">
            {FAQS.map((faq, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted transition-colors"
                >
                  <p className="text-sm font-medium text-foreground pr-4">{faq.q}</p>
                  {openFaq === i
                    ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp Chatbot */}
        <div>
          <h3 className="font-display text-base font-semibold text-foreground mb-1">
            💬 Try WhatsApp Ordering
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            Order via WhatsApp message — type naturally in Filipino or English
          </p>
          <WhatsAppChatbot />
        </div>
      </div>

      <RetailerBottomNav />
    </div>
  );
}
