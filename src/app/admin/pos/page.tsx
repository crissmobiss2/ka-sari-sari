"use client";
import { useState, useMemo } from "react";
import {
  Search, Plus, Minus, X, CheckCircle2, Printer,
  RefreshCcw, ShoppingCart, QrCode, Users, Package,
  AlertCircle, Tag, Banknote, Camera
} from "lucide-react";
import { BarcodeScanner } from "@/components/pos/barcode-scanner";
import { cn } from "@/lib/utils";
import { formatPHP } from "@/lib/utils";
import { PRODUCTS, CATEGORIES } from "@/lib/mock-data";
import type { Product } from "@/types";

interface POSCartItem { product: Product; quantity: number; }

const PH_PAYMENT_METHODS = [
  { id: "cash",       label: "Cash",        icon: "💵", group: "cash" },
  { id: "gcash",      label: "GCash",       icon: "💚", group: "ewallet" },
  { id: "maya",       label: "Maya",        icon: "💜", group: "ewallet" },
  { id: "shopeepay",  label: "ShopeePay",   icon: "🛍️", group: "ewallet" },
  { id: "qrph",       label: "QR Ph",       icon: "📱", group: "ewallet" },
  { id: "card",       label: "Card",        icon: "💳", group: "card" },
  { id: "bdo",        label: "BDO",         icon: "🏦", group: "bank" },
  { id: "bpi",        label: "BPI",         icon: "🏦", group: "bank" },
  { id: "metrobank",  label: "Metrobank",   icon: "🏦", group: "bank" },
  { id: "landbank",   label: "LANDBANK",    icon: "🌾", group: "bank" },
  { id: "unionbank",  label: "UnionBank",   icon: "🏦", group: "bank" },
  { id: "instapay",   label: "InstaPay",    icon: "⚡", group: "bank" },
  { id: "palawan",    label: "Palawan",     icon: "🌴", group: "otc" },
  { id: "cebuana",    label: "Cebuana",     icon: "💛", group: "otc" },
  { id: "mlhuillier", label: "M Lhuillier", icon: "🔵", group: "otc" },
  { id: "cod",        label: "COD",         icon: "📦", group: "other" },
  { id: "terms",      label: "Credit Terms",icon: "📋", group: "other" },
  { id: "check",      label: "Check (PDC)", icon: "📝", group: "other" },
];

const BANK_ACCOUNTS: Record<string, { account: string; name: string }> = {
  bdo:       { account: "001-234-567-8901", name: "BDO Savings" },
  bpi:       { account: "0987-6543-21",     name: "BPI Savings" },
  metrobank: { account: "1234-567-890123",  name: "Metrobank Savings" },
  landbank:  { account: "2345-6789-0123",   name: "LANDBANK Savings" },
  unionbank: { account: "1122-3344-5566",   name: "UnionBank Online" },
  instapay:  { account: "09171234567",      name: "InstaPay / Any Bank" },
};

const EWALLET_INFO: Record<string, { number: string; name: string }> = {
  gcash:     { number: "0917-KSS-STORE", name: "Ka Sari-Sari Inc." },
  maya:      { number: "0918-KSS-STOR2", name: "Ka Sari-Sari Inc." },
  shopeepay: { number: "0919-KSS-SHOP",  name: "Ka Sari-Sari Shop" },
};

const CAT_DISPLAY: Record<string, { gradient: string; emoji: string }> = {
  "cat-01": { gradient: "from-amber-500 to-yellow-600",   emoji: "☕" },
  "cat-02": { gradient: "from-yellow-400 to-orange-500",  emoji: "🍜" },
  "cat-03": { gradient: "from-orange-400 to-red-500",     emoji: "🍿" },
  "cat-04": { gradient: "from-pink-400 to-rose-500",      emoji: "🍫" },
  "cat-05": { gradient: "from-red-400 to-orange-500",     emoji: "🥫" },
  "cat-06": { gradient: "from-blue-400 to-cyan-500",      emoji: "🥤" },
  "cat-07": { gradient: "from-green-400 to-teal-500",     emoji: "🧃" },
  "cat-08": { gradient: "from-sky-300 to-blue-400",       emoji: "🥛" },
  "cat-09": { gradient: "from-amber-400 to-orange-500",   emoji: "🧂" },
  "cat-10": { gradient: "from-yellow-300 to-amber-400",   emoji: "🍳" },
  "cat-11": { gradient: "from-yellow-400 to-amber-500",   emoji: "🧈" },
  "cat-12": { gradient: "from-amber-300 to-orange-400",   emoji: "🍞" },
  "cat-13": { gradient: "from-yellow-200 to-amber-300",   emoji: "🥚" },
  "cat-14": { gradient: "from-lime-300 to-green-400",     emoji: "🍚" },
  "cat-15": { gradient: "from-cyan-400 to-blue-500",      emoji: "🧊" },
  "cat-16": { gradient: "from-purple-400 to-violet-500",  emoji: "🧴" },
  "cat-17": { gradient: "from-pink-300 to-rose-400",      emoji: "🌸" },
  "cat-18": { gradient: "from-teal-400 to-green-500",     emoji: "🧺" },
  "cat-19": { gradient: "from-emerald-400 to-green-600",  emoji: "🧹" },
  "cat-20": { gradient: "from-red-500 to-rose-600",       emoji: "🦟" },
  "cat-21": { gradient: "from-pink-300 to-pink-500",      emoji: "👶" },
  "cat-22": { gradient: "from-indigo-400 to-blue-500",    emoji: "📚" },
  "cat-23": { gradient: "from-red-300 to-rose-400",       emoji: "💊" },
  "cat-24": { gradient: "from-gray-400 to-slate-500",     emoji: "🔋" },
  "cat-25": { gradient: "from-blue-300 to-cyan-400",      emoji: "💧" },
  "cat-26": { gradient: "from-violet-400 to-purple-500",  emoji: "📱" },
};

function generateRef() {
  return `POS-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export default function POSPage() {
  const [otcCode] = useState(() => `KSS-${Math.random().toString(36).toUpperCase().slice(2, 8)}`);
  const [mobileTab, setMobileTab] = useState<"products" | "cart" | "pay">("products");
  const [showScanner, setShowScanner] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [customer, setCustomer] = useState("Walk-in Customer");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [payMethod, setPayMethod] = useState("cash");
  const [cashTendered, setCashTendered] = useState("");
  const [reference, setReference] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [orderRef, setOrderRef] = useState("");
  const [receiptMode, setReceiptMode] = useState<"print" | "sms" | "email" | null>(null);

  // Admin/warehouse POS sells at wholesale price (product.price), not SRP
  const subtotal = cart.reduce((s, i) => s + (i.product.price ?? 0) * i.quantity, 0);
  const total = Math.max(0, subtotal - discount);
  const cash = parseFloat(cashTendered) || 0;
  const change = payMethod === "cash" && cash > total ? cash - total : 0;
  const canCharge = cart.length > 0 && (payMethod !== "cash" || cash >= total);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const products = useMemo(() => PRODUCTS.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchCat = category === "all" || p.categoryId === category;
    return matchSearch && matchCat && p.isActive;
  }), [search, category]);

  function addItem(product: Product) {
    if (product.stock === 0) return;
    setCart(prev => {
      const ex = prev.find(i => i.product.id === product.id);
      if (ex) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  }

  function qty(productId: string, delta: number) {
    // Clamp at 1 — use the X button to remove an item entirely
    setCart(prev => prev.map(i =>
      i.product.id !== productId ? i : { ...i, quantity: Math.max(1, i.quantity + delta) }
    ));
  }

  function handleScan(code: string) {
    const product = PRODUCTS.find((p) => p.isActive && p.sku.toLowerCase() === code.toLowerCase());
    if (product) {
      addItem(product);
      setScanFeedback({ ok: true, text: `Added: ${product.name}` });
    } else {
      setScanFeedback({ ok: false, text: `Not found: ${code}` });
    }
    setTimeout(() => setScanFeedback(null), 2500);
  }

  function applyPromo() {
    if (promoInput.toUpperCase() === "FLASH20") { setDiscount(subtotal * 0.2); setPromoApplied(true); }
    else if (promoInput.toUpperCase() === "SAVE100") { setDiscount(100); setPromoApplied(true); }
    else alert("Invalid promo code");
  }

  async function charge() {
    setLoading(true);
    try {
      const res = await fetch("/api/pos/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          total,
          method: payMethod,
          posType: "admin",
        }),
      });
      const data = res.ok ? await res.json() : null;
      setOrderRef(data?.receiptNumber ?? generateRef());
      setDone(true);
    } catch {
      setLoading(false);
      alert("Transaction failed. Please try again.");
      return;
    }
    setLoading(false);
  }

  function reset() {
    setCart([]); setCustomer("Walk-in Customer"); setPayMethod("cash");
    setCashTendered(""); setReference(""); setDiscount(0); setPromoInput("");
    setPromoApplied(false); setDone(false); setOrderRef(""); setMobileTab("products");
    setReceiptMode(null);
  }

  const pm = PH_PAYMENT_METHODS.find(p => p.id === payMethod);

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-success-50 dark:bg-success-500/10 p-6">
        <div className="bg-card rounded-3xl shadow-card-md p-8 w-full max-w-md space-y-6">
          <div className="text-center space-y-3">
            <div className="h-20 w-20 rounded-full bg-success-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-success-500" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">Payment Received</h2>
            <p className="text-muted-foreground text-sm font-mono">{orderRef}</p>
          </div>

          <div className="rounded-2xl border border-border bg-surface-50 dark:bg-surface-900 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Customer</span>
              <span className="font-medium text-surface-900 truncate ml-4 text-right">{customer}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items</span>
              <span className="font-medium text-foreground">{cartCount} units ({cart.length} products)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment</span>
              <span className="font-medium text-foreground">{pm?.icon} {pm?.label}</span>
            </div>
            {reference && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ref #</span>
                <span className="font-mono text-xs text-foreground">{reference}</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between text-base font-bold">
              <span>Total</span>
              <span className="text-brand-500">{formatPHP(total)}</span>
            </div>
            {payMethod === "cash" && change > 0 && (
              <div className="flex justify-between text-sm font-semibold text-success-600">
                <span>Change</span>
                <span>{formatPHP(change)}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Send Receipt</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { mode: "print" as const, label: "Print", icon: <Printer className="h-4 w-4" /> },
                { mode: "sms" as const, label: "SMS", icon: <span className="text-base">💬</span> },
                { mode: "email" as const, label: "Email", icon: <span className="text-base">✉️</span> },
              ].map(({ mode, label, icon }) => (
                <button
                  key={mode}
                  onClick={() => {
                    setReceiptMode(mode);
                    if (mode === "print") {
                      window.print();
                    } else {
                      alert(`${label} receipt sent for ${orderRef}`);
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl border py-3 text-xs font-medium transition-colors",
                    receiptMode === mode ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-foreground" : "border-border bg-card text-muted-foreground hover:bg-muted"
                  )}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={reset}
            className="w-full h-12 rounded-2xl bg-brand-50 dark:bg-brand-500/100 text-white font-bold text-base hover:bg-brand-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" /> New Transaction
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background" style={{ height: "calc(100vh - 0px)" }}>
      <style>{".print-hide { } @media print { .print-hide { display: none !important; } .print-show { display: block !important; } }"}</style>
      {/* POS Header */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shrink-0">
        <div>
          <h1 className="font-display text-sm font-bold text-foreground">Ka Sari-Sari POS</h1>
          <p className="text-[10px] text-muted-foreground">Warehouse Counter · Walk-in Sales</p>
        </div>
        <div className="flex md:hidden items-center border border-border rounded-xl overflow-hidden text-[11px]">
          {(["products", "cart", "pay"] as const).map(t => (
            <button
              key={t}
              onClick={() => setMobileTab(t)}
              className={cn("relative px-3 py-2 font-medium capitalize transition-colors", mobileTab === t ? "bg-brand-50 dark:bg-brand-500/100 text-white" : "text-muted-foreground")}
            >
              {t === "cart" && cartCount > 0 && <span className="absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-danger-50 dark:bg-danger-500/100 text-white text-[8px] flex items-center justify-center">{cartCount > 9 ? "9+" : cartCount}</span>}
              {t === "cart" ? `Cart${cartCount > 0 ? ` (${cartCount})` : ""}` : t === "pay" ? "Pay" : "Items"}
            </button>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground">
          <span>{new Date().toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
          {cartCount > 0 && <span className="font-semibold text-brand-500">{cartCount} items · {formatPHP(total)}</span>}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* ─── Product panel ─── */}
        <div className={cn("flex flex-col flex-1 min-w-0 overflow-hidden print-hide", mobileTab !== "products" && "hidden md:flex")}>
          <div className="px-3 pt-3 pb-2 border-b border-border space-y-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="search" placeholder="Search product, SKU, brand…" value={search} onChange={e => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
              <button
                onClick={() => setShowScanner(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800 text-muted-foreground hover:text-brand-500 hover:bg-brand-50 dark:bg-brand-500/10 transition-colors"
                title="Scan barcode"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
              <button onClick={() => setCategory("all")} className={cn("shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold border transition-colors", category === "all" ? "bg-brand-50 dark:bg-brand-500/100 text-white border-brand-500" : "bg-card border-border text-muted-foreground")}>All</button>
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCategory(c.id)} className={cn("shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold border transition-colors", category === c.id ? "bg-brand-50 dark:bg-brand-500/100 text-white border-brand-500" : "bg-card border-border text-muted-foreground")}>{c.name}</button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {products.map(product => {
                const d = CAT_DISPLAY[product.categoryId] || { gradient: "from-gray-400 to-slate-400", emoji: "📦" };
                const inCart = cart.find(i => i.product.id === product.id);
                const outOfStock = product.stock === 0;
                return (
                  <button key={product.id} onClick={() => addItem(product)} disabled={outOfStock}
                    className={cn("text-left rounded-2xl border overflow-hidden transition-all active:scale-[0.96]",
                      outOfStock ? "opacity-50 cursor-not-allowed border-border bg-card" :
                      inCart ? "border-brand-400 ring-1 ring-brand-300 bg-card shadow-sm" :
                      "border-border bg-card hover:border-brand-200 hover:shadow-sm"
                    )}>
                    <div className={cn("h-20 flex items-center justify-center relative bg-gradient-to-br", d.gradient)}>
                      <span className="text-4xl">{d.emoji}</span>
                      {inCart && <span className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-brand-50 dark:bg-brand-500/100 text-white text-[11px] font-bold flex items-center justify-center shadow">{inCart.quantity}</span>}
                      {outOfStock && <div className="absolute inset-0 bg-white/70 flex items-center justify-center"><span className="text-[10px] font-black text-danger-600 tracking-wide">OUT</span></div>}
                    </div>
                    <div className="p-2.5">
                      <p className="text-[11px] font-semibold text-foreground line-clamp-2 leading-tight min-h-[28px]">{product.name}</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <p className="text-xs font-black text-brand-500">{formatPHP(product.price)}</p>
                        {product.srp && product.srp > product.price && (
                          <p className="text-[10px] text-muted-foreground">SRP {formatPHP(product.srp)}</p>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">Min {product.minOrderQty} {product.unit}</p>
                    </div>
                  </button>
                );
              })}
              {products.length === 0 && (
                <div className="col-span-full py-16 text-center">
                  <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" strokeWidth={1} />
                  <p className="text-sm text-muted-foreground">No products found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Cart + Payment panel ─── */}
        <div className={cn("flex flex-col w-full md:w-80 lg:w-96 shrink-0 border-l border-border bg-card overflow-hidden", mobileTab === "products" && "hidden md:flex")}>
          {/* Customer */}
          <div className="px-4 py-2.5 border-b border-border shrink-0 flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <input type="text" placeholder="Customer / Store name..." value={customer} onChange={e => setCustomer(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground min-w-0" />
          </div>

          {/* Cart items */}
          <div className={cn("overflow-y-auto shrink-0", mobileTab !== "pay" ? "flex-1" : "max-h-40")}>
            {cart.length === 0 ? (
              <div className="py-10 text-center px-4">
                <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" strokeWidth={1} />
                <p className="text-sm text-muted-foreground">Cart is empty</p>
                <p className="text-xs text-muted-foreground mt-0.5">Tap products on the left to add</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} className="flex items-center gap-2 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground line-clamp-1">{product.name}</p>
                      <p className="text-[10px] text-muted-foreground">{formatPHP(product.price)} / {product.unit}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => qty(product.id, -1)} className="h-6 w-6 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted active:scale-90 transition-all">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-bold text-foreground w-7 text-center">{quantity}</span>
                      <button onClick={() => qty(product.id, 1)} className="h-6 w-6 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted active:scale-90 transition-all">
                        <Plus className="h-3 w-3" />
                      </button>
                      <button onClick={() => setCart(c => c.filter(i => i.product.id !== product.id))} className="h-6 w-6 rounded-lg flex items-center justify-center text-danger-400 hover:bg-danger-50 dark:bg-danger-500/10 ml-0.5 active:scale-90 transition-all">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-xs font-bold text-foreground w-14 text-right shrink-0">{formatPHP(product.price * quantity)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Promo + Totals */}
          {cart.length > 0 && (
            <div className="border-t border-border px-4 py-3 space-y-2 shrink-0">
              {!promoApplied ? (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input type="text" placeholder="Promo code" value={promoInput} onChange={e => setPromoInput(e.target.value.toUpperCase())}
                      className="h-8 w-full rounded-xl border border-input bg-background pl-7 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <button onClick={applyPromo} className="h-8 px-3 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 text-brand-600 text-xs font-semibold hover:bg-brand-100 active:scale-95 transition-all">Apply</button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-success-600 font-medium">✓ Promo applied: {promoInput}</span>
                  <button onClick={() => { setPromoApplied(false); setPromoInput(""); setDiscount(0); }} className="text-muted-foreground hover:text-foreground">Remove</button>
                </div>
              )}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtotal ({cartCount})</span><span>{formatPHP(subtotal)}</span>
                </div>
                {discount > 0 && <div className="flex justify-between text-xs text-success-600"><span>Discount</span><span>-{formatPHP(discount)}</span></div>}
                <div className="flex justify-between text-sm font-bold text-foreground border-t border-border pt-1.5">
                  <span>Total</span><span className="text-brand-500 text-base">{formatPHP(total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment methods + charge */}
          <div className={cn("border-t border-border overflow-y-auto shrink-0", mobileTab === "pay" && "flex-1")}>
            <div className="p-3 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Payment Method</p>

              {/* Payment groups */}
              {[
                { label: "E-Wallets", methods: PH_PAYMENT_METHODS.filter(p => p.group === "ewallet") },
                { label: "Cash", methods: PH_PAYMENT_METHODS.filter(p => p.group === "cash") },
                { label: "Banks & InstaPay", methods: PH_PAYMENT_METHODS.filter(p => p.group === "bank") },
                { label: "Cards", methods: PH_PAYMENT_METHODS.filter(p => p.group === "card") },
                { label: "Over-the-Counter", methods: PH_PAYMENT_METHODS.filter(p => p.group === "otc") },
                { label: "Other", methods: PH_PAYMENT_METHODS.filter(p => p.group === "other") },
              ].map(({ label, methods }) => (
                <div key={label}>
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">{label}</p>
                  <div className="grid grid-cols-3 gap-1">
                    {methods.map(pm => (
                      <button key={pm.id} onClick={() => setPayMethod(pm.id)}
                        className={cn("rounded-xl border py-2 px-1 text-center transition-all active:scale-95",
                          payMethod === pm.id ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 shadow-sm" : "border-border bg-surface-50 dark:bg-surface-900 hover:bg-muted"
                        )}>
                        <div className="text-sm">{pm.icon}</div>
                        <p className="text-[9px] font-semibold text-surface-900 mt-0.5 leading-tight">{pm.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Payment-specific UI */}
              {payMethod === "cash" && (
                <div className="space-y-2 pt-1">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₱</span>
                    <input type="number" min={0} step={1} placeholder="0.00" value={cashTendered} onChange={e => setCashTendered(e.target.value)}
                      className="h-12 w-full rounded-xl border border-input bg-background pl-7 pr-4 text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[100, 200, 500, 1000].map(a => (
                      <button key={a} onClick={() => setCashTendered(String(a))}
                        className="rounded-xl border border-border bg-surface-50 dark:bg-surface-900 py-2 text-xs font-bold text-surface-900 hover:bg-muted active:scale-95 transition-all">
                        ₱{a >= 1000 ? "1k" : a}
                      </button>
                    ))}
                  </div>
                  {cash >= total && total > 0 && (
                    <div className="flex justify-between rounded-xl bg-success-50 dark:bg-success-500/10 border border-success-200 px-3 py-2">
                      <span className="text-sm text-success-700 font-medium">Change</span>
                      <span className="text-sm font-bold text-success-700">{formatPHP(change)}</span>
                    </div>
                  )}
                  {cashTendered && cash < total && (
                    <div className="flex items-center gap-2 rounded-xl bg-danger-50 dark:bg-danger-500/10 border border-danger-200 px-3 py-2">
                      <AlertCircle className="h-4 w-4 text-danger-500 shrink-0" />
                      <span className="text-xs text-danger-600 font-medium">Short by {formatPHP(total - cash)}</span>
                    </div>
                  )}
                </div>
              )}

              {["gcash", "maya", "shopeepay", "qrph"].includes(payMethod) && (
                <div className="space-y-2 pt-1">
                  <div className="rounded-xl bg-surface-50 dark:bg-surface-900 border border-border p-3 text-center">
                    <div className="h-24 w-24 mx-auto bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl flex items-center justify-center mb-2 shadow">
                      <QrCode className="h-14 w-14 text-white" strokeWidth={1.2} />
                    </div>
                    {EWALLET_INFO[payMethod] ? (
                      <><p className="text-xs font-semibold text-foreground">Send {formatPHP(total)} to</p>
                        <p className="text-xs text-muted-foreground">{EWALLET_INFO[payMethod].number}</p>
                        <p className="text-xs text-muted-foreground">{EWALLET_INFO[payMethod].name}</p></>
                    ) : (
                      <p className="text-xs text-muted-foreground">Scan QR with any bank app (QR Ph)</p>
                    )}
                  </div>
                  <input type="text" placeholder="Reference / confirmation number" value={reference} onChange={e => setReference(e.target.value)}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              )}

              {Object.keys(BANK_ACCOUNTS).includes(payMethod) && (
                <div className="space-y-2 pt-1">
                  <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs space-y-1.5">
                    <p className="font-bold text-blue-800">Transfer {formatPHP(total)} to:</p>
                    <p className="text-blue-700 font-semibold">{BANK_ACCOUNTS[payMethod].name}</p>
                    <p className="font-mono text-blue-900 font-bold text-sm">{BANK_ACCOUNTS[payMethod].account}</p>
                    <p className="text-blue-600">Account Name: Ka Sari-Sari Inc.</p>
                    <p className="text-blue-500 text-[10px] mt-1">Use order reference as remarks/notes</p>
                  </div>
                  <input type="text" placeholder="Bank reference / confirmation code" value={reference} onChange={e => setReference(e.target.value)}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              )}

              {["palawan", "cebuana", "mlhuillier"].includes(payMethod) && (
                <div className="rounded-xl bg-yellow-50 border border-yellow-200 p-3 text-xs space-y-1 pt-1">
                  <p className="font-bold text-yellow-800">OTC Payment Code</p>
                  <p className="font-mono font-black text-yellow-900 text-lg tracking-widest">{otcCode}</p>
                  <p className="text-yellow-700">Show this code at {payMethod === "palawan" ? "Palawan Express" : payMethod === "cebuana" ? "Cebuana Lhuillier" : "M Lhuillier"}</p>
                  <p className="text-yellow-600">Amount: {formatPHP(total)}</p>
                </div>
              )}

              {payMethod === "card" && (
                <div className="rounded-xl bg-surface-50 dark:bg-surface-900 border border-border p-4 text-center">
                  <p className="text-2xl mb-2">💳</p>
                  <p className="text-sm font-semibold text-surface-900">Swipe or Tap Card</p>
                  <p className="text-xs text-muted-foreground mt-1">Visa · Mastercard · JCB · UnionPay</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Amount: {formatPHP(total)}</p>
                </div>
              )}

              {payMethod === "terms" && (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1 pt-1">
                  <p className="font-bold text-slate-700">Credit Terms</p>
                  <p className="text-slate-600">Charge to store account: <span className="font-semibold">{customer}</span></p>
                  <p className="text-slate-600">Due: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
              )}

              {payMethod === "check" && (
                <div className="space-y-1.5 pt-1">
                  <input type="text" placeholder="Check number" value={reference} onChange={e => setReference(e.target.value)}
                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  <input type="date" className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              )}

              {payMethod === "cod" && (
                <div className="rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 p-3 text-xs space-y-1 pt-1">
                  <p className="font-bold text-brand-700">Cash on Delivery</p>
                  <p className="text-brand-600">Driver will collect {formatPHP(total)} upon delivery.</p>
                </div>
              )}

              {/* Charge button */}
              <button
                onClick={charge}
                disabled={!canCharge || loading}
                className={cn(
                  "w-full h-14 rounded-2xl font-black text-lg tracking-wide transition-all",
                  canCharge && !loading
                    ? "bg-brand-50 dark:bg-brand-500/100 text-white hover:bg-brand-600 active:scale-[0.98] shadow-lg"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </span>
                ) : cart.length === 0 ? "Add items to charge" : `CHARGE ${formatPHP(total)}`}
              </button>

              <p className="text-center text-[10px] text-muted-foreground">
                {pm?.icon} {pm?.label} · Secure transaction
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scan feedback toast */}
      {scanFeedback && (
        <div className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg pointer-events-none",
          scanFeedback.ok ? "bg-success-50 dark:bg-success-500/100" : "bg-danger-50 dark:bg-danger-500/100"
        )}>
          {scanFeedback.text}
        </div>
      )}

      {/* Barcode scanner modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={(code) => handleScan(code)}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
