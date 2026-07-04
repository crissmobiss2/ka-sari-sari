"use client";
import { useState } from "react";
import { MessageCircle, Phone, ChevronDown, ChevronUp, Send } from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FAQS = [
  { q: "How do I place my first order?", a: "Browse the catalog, add items to your cart, then go to checkout. Make sure your subscription is active before placing an order." },
  { q: "What is the minimum order quantity?", a: "Each product has its own minimum order quantity (MOQ), shown on the product card. MOQ varies by product and unit size." },
  { q: "How long does delivery take?", a: "Standard delivery is 2–3 business days after order confirmation. We'll notify you at every step of the delivery." },
  { q: "Can I cancel or modify an order?", a: "You can request a cancellation within 1 hour of placing an order, before it enters the picking stage. Contact support immediately." },
  { q: "What payment methods are accepted?", a: "We accept GCash, Maya, bank transfer, and cash on delivery. All payments are processed securely." },
  { q: "How does the PHP 1,000 fee work?", a: "It's a one-time annual platform access fee per store. After payment, you can place unlimited orders for 12 months." },
];

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
              Message sent! We'll reply within 24 hours.
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
      </div>

      <RetailerBottomNav />
    </div>
  );
}
