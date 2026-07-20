"use client";
import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Phone,
  ChevronDown,
  ChevronUp,
  Send,
  Mail,
  CheckCircle2,
  X,
} from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// FAQs — bilingual Filipino / English
// ---------------------------------------------------------------------------
const FAQS = [
  {
    q: "Kailan dadating ang aking order? / When will my order arrive?",
    a: "Ang standard delivery ay 2–3 araw ng trabaho pagkatapos ng confirmation. Matatanggap mo ang updates sa bawat hakbang ng delivery sa pamamagitan ng WhatsApp.\n\nStandard delivery takes 2–3 business days after order confirmation. You will receive real-time updates via WhatsApp at every step.",
  },
  {
    q: "Paano ako mag-apply ng credit terms? / How do I apply for credit?",
    a: "Maaari kang mag-apply para sa credit terms pagkatapos ng iyong unang 3 na matagumpay na order. Pumunta sa Aking Account → Credit Terms at i-submit ang iyong kahilingan.\n\nCredit terms are available after 3 successful orders. Go to My Account → Credit Terms and submit your application. Approval takes 1–2 business days.",
  },
  {
    q: "Ano ang minimum order? / What is the minimum order amount?",
    a: "Ang minimum order value ay ₱500 bawat transaksyon. Ang bawat produkto ay may sariling minimum order quantity (MOQ) na makikita sa product card.\n\nMinimum order value is ₱500 per transaction. Each product also has its own minimum order quantity (MOQ) shown on the product card.",
  },
  {
    q: "Paano ko ma-track ang aking delivery? / How do I track my delivery?",
    a: "Buksan ang Aking Mga Order at piliin ang order na gusto mong i-track. Makikita mo ang live status at estimated time of arrival. Makakatanggap ka rin ng WhatsApp notifications.\n\nOpen My Orders and select the order you want to track. You will see the live status and estimated arrival time. You will also receive WhatsApp notifications at each delivery milestone.",
  },
  {
    q: "Anong payment methods ang tinatanggap? / What payment methods are accepted?",
    a: "Tinatanggap namin ang:\n• GCash\n• Maya\n• Bank transfer (BDO, BPI, UnionBank)\n• Cash on delivery (COD)\n• Credit terms (para sa qualified na mga tindahan)\n\nWe accept GCash, Maya, bank transfer (BDO, BPI, UnionBank), cash on delivery, and credit terms for qualified stores.",
  },
  {
    q: "Paano kung mali ang aking delivery? / What if my delivery is wrong or incomplete?",
    a: "Huwag mag-alala! I-report ang isyu sa loob ng 24 na oras pagkatapos ng delivery sa pamamagitan ng:\n1. Itong support page — i-submit ang ticket na may larawan\n2. WhatsApp: +63 917 XXX XXXX\n3. Email: support@kasarisari.ph\n\nIbabalik namin ang tamang produkto o mag-issue ng credit note. Don't worry! Report within 24 hours via this page, WhatsApp, or email and we will arrange a replacement or credit note.",
  },
];

// ---------------------------------------------------------------------------
// WhatsApp chatbot helpers (unchanged)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// WhatsApp Chatbot component (unchanged)
// ---------------------------------------------------------------------------
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
            <span className="text-xs text-white/80">Online · {getTimeNow()}</span>
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
          className="flex-1 rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-800 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:border-transparent"
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

// ---------------------------------------------------------------------------
// Toast component — shown on ticket submission
// ---------------------------------------------------------------------------
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl bg-success-700 px-5 py-3 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300 min-w-[260px] max-w-[90vw]">
      <CheckCircle2 className="h-5 w-5 text-white shrink-0" />
      <p className="flex-1 text-sm font-medium text-white">{message}</p>
      <button
        onClick={onClose}
        className="ml-1 text-white/70 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const TICKET_CATEGORIES = [
  { value: "", label: "Piliin ang kategorya / Select category" },
  { value: "order", label: "Order Issue / Problema sa order" },
  { value: "payment", label: "Payment / Bayad" },
  { value: "delivery", label: "Delivery / Pagpapadala" },
  { value: "other", label: "Other / Iba pa" },
];

export default function SupportPage() {
  // FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Contact info (fetched from API, falls back to defaults)
  const [whatsappNumber, setWhatsappNumber] = useState("639170000000");
  const [phoneNumber, setPhoneNumber] = useState("+63288881234");

  useEffect(() => {
    fetch("/api/config/contact")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.whatsapp) setWhatsappNumber(data.whatsapp);
        if (data?.phone) setPhoneNumber(data.phone);
      })
      .catch(() => {});
  }, []);

  // Ticket form
  const [ticketCategory, setTicketCategory] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSubmitting, setTicketSubmitting] = useState(false);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  function showToast(msg: string) {
    setToastMessage(msg);
    setToastVisible(true);
  }

  async function handleTicketSubmit() {
    if (!ticketCategory || !ticketMessage.trim()) return;
    setTicketSubmitting(true);
    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: ticketCategory, subject: ticketCategory, message: ticketMessage }),
      });
      const data = await res.json();
      if (res.ok) {
        setTicketCategory("");
        setTicketMessage("");
        showToast(`Natanggap ang iyong ticket! Ref: ${data.ticketId}. Sasagutin namin sa loob ng 24 oras.`);
      } else {
        showToast("Hindi natanggap ang ticket. Subukan muli.");
      }
    } catch {
      showToast("Network error. Please check your connection.");
    } finally {
      setTicketSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar title="Help & Support" />

      <div className="px-4 py-5 space-y-7">

        {/* ---------------------------------------------------------------- */}
        {/* Contact Us section                                               */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <h2 className="font-display text-base font-semibold text-foreground mb-3">
            Makipag-ugnayan / Contact Us
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {/* WhatsApp */}
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center shadow-card hover:bg-muted transition-colors"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "#25D366" }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="white"
                  className="h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-foreground leading-tight">WhatsApp</p>
              <p className="text-[10px] text-muted-foreground">Chat tayo</p>
            </a>

            {/* Email */}
            <a
              href="mailto:support@kasarisari.ph"
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center shadow-card hover:bg-muted transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400">
                <Mail className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-foreground leading-tight">Email</p>
              <p className="text-[10px] text-muted-foreground">24h reply</p>
            </a>

            {/* Call */}
            <a
              href={`tel:${phoneNumber}`}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 text-center shadow-card hover:bg-muted transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400">
                <Phone className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-foreground leading-tight">Tumawag</p>
              <p className="text-[10px] text-muted-foreground">8AM–6PM</p>
            </a>
          </div>

          {/* Hours note */}
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Lunes – Sabado, 8:00 AM – 6:00 PM · Mon–Sat, 8 AM–6 PM
          </p>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Submit a Ticket form                                             */}
        {/* ---------------------------------------------------------------- */}
        <section className="rounded-2xl border border-border bg-card shadow-card p-5 space-y-4">
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">
              Mag-submit ng Ticket / Submit a Ticket
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Sasagutin namin sa loob ng 24 na oras · We respond within 24 hours
            </p>
          </div>

          {/* Category select */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground" htmlFor="ticket-category">
              Kategorya / Category
            </label>
            <select
              id="ticket-category"
              value={ticketCategory}
              onChange={(e) => setTicketCategory(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-700 appearance-none"
            >
              {TICKET_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value} disabled={cat.value === ""}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Message textarea */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground" htmlFor="ticket-message">
              Mensahe / Message
            </label>
            <textarea
              id="ticket-message"
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              placeholder="Ilarawan ang iyong isyu… / Describe your issue…"
              rows={4}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-700 resize-none"
            />
          </div>

          <Button
            size="md"
            className="w-full"
            onClick={handleTicketSubmit}
            disabled={!ticketCategory || !ticketMessage.trim() || ticketSubmitting}
          >
            {ticketSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Nagpapadala…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                I-submit / Submit Ticket
              </span>
            )}
          </Button>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* FAQ accordion                                                    */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <h2 className="font-display text-base font-semibold text-foreground mb-3">
            Mga Madalas na Tanong / Frequently Asked Questions
          </h2>
          <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden divide-y divide-border">
            {FAQS.map((faq, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted transition-colors"
                  aria-expanded={openFaq === i}
                >
                  <p className="text-sm font-medium text-foreground pr-4 leading-snug">{faq.q}</p>
                  {openFaq === i ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* WhatsApp Ordering Chatbot                                        */}
        {/* ---------------------------------------------------------------- */}
        <section>
          <h2 className="font-display text-base font-semibold text-foreground mb-1">
            Mag-order sa WhatsApp / WhatsApp Ordering
          </h2>
          <p className="text-xs text-muted-foreground mb-3">
            I-order gamit ang simpleng mensahe sa Filipino o English ·
            Order via WhatsApp message — type naturally in Filipino or English
          </p>
          <WhatsAppChatbot />
        </section>
      </div>

      {/* Toast notification */}
      {toastVisible && (
        <Toast message={toastMessage} onClose={() => setToastVisible(false)} />
      )}

      <RetailerBottomNav />
    </div>
  );
}
