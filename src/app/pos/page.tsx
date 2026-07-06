"use client";
import { useState, useMemo, useRef } from "react";
import {
  Search, Plus, Minus, X, CheckCircle2, Printer,
  RefreshCcw, ShoppingCart, Package, Tag, Banknote, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { cn, formatPHP } from "@/lib/utils";
import { PRODUCTS, CATEGORIES } from "@/lib/mock-data";
import type { Product } from "@/types";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SaleItem { product: Product; quantity: number; }

type PayStep = "idle" | "pay" | "done";

const PH_METHODS = [
  { id: "cash",      label: "Cash",     icon: "💵" },
  { id: "gcash",     label: "GCash",    icon: "💚" },
  { id: "maya",      label: "Maya",     icon: "💜" },
  { id: "shopeepay", label: "ShopeePay",icon: "🛍️" },
  { id: "qrph",      label: "QR Ph",    icon: "📱" },
  { id: "card",      label: "Card",     icon: "💳" },
];

// ─── Cart helpers ────────────────────────────────────────────────────────────

function getTotal(items: SaleItem[]) {
  return items.reduce((s, i) => s + i.product.srp! * i.quantity, 0);
}

function getChange(total: number, tendered: number) {
  return Math.max(0, tendered - total);
}

// ─── Numpad for cash tender ──────────────────────────────────────────────────

function Numpad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  function press(key: string) {
    if (key === "⌫") { onChange(value.slice(0, -1) || "0"); return; }
    if (key === "C") { onChange("0"); return; }
    if (value === "0") { onChange(key); return; }
    if (value.length >= 8) return;
    onChange(value + key);
  }
  const keys = ["7","8","9","4","5","6","1","2","3","C","0","⌫"];
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {keys.map((k) => (
        <button
          key={k}
          onClick={() => press(k)}
          className={cn(
            "rounded-xl h-12 text-base font-semibold transition-colors active:scale-95",
            k === "C" ? "bg-danger-100 text-danger-700 hover:bg-danger-200"
            : k === "⌫" ? "bg-surface-200 text-foreground hover:bg-surface-300"
            : "bg-surface-100 text-foreground hover:bg-surface-200"
          )}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function RetailerPOSPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [step, setStep] = useState<PayStep>("idle");
  const [method, setMethod] = useState<string>("cash");
  const [tendered, setTendered] = useState("0");
  const [receiptNo, setReceiptNo] = useState(1001);
  const searchRef = useRef<HTMLInputElement>(null);

  const products = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const matchCat = categoryId === "all" || p.categoryId === categoryId;
      const matchQ   = search === "" || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      return p.isActive && matchCat && matchQ;
    });
  }, [search, categoryId]);

  const total = getTotal(cart);
  const tenderedNum = parseInt(tendered, 10) || 0;
  const change = getChange(total, tenderedNum);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev.map((i) => i.product.id === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function handlePay() {
    if (method === "cash" && tenderedNum < total) return;
    setStep("done");
    setReceiptNo((n) => n + 1);
  }

  function handleNewSale() {
    setCart([]);
    setStep("idle");
    setTendered("0");
    setMethod("cash");
    setTimeout(() => searchRef.current?.focus(), 100);
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <Link href="/dashboard" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500">
          <ShoppingCart className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground leading-tight">Point of Sale</p>
          <p className="text-[10px] text-muted-foreground">Maria&apos;s Sari-Sari Store</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Receipt #</p>
          <p className="text-xs font-bold text-foreground">{receiptNo}</p>
        </div>
      </header>

      {/* Main layout — left: catalog, right: cart */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left: Product catalog ── */}
        <div className="flex flex-col flex-1 overflow-hidden border-r border-border">
          {/* Search */}
          <div className="px-3 pt-3 pb-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product or scan barcode…"
                className="w-full rounded-xl border border-border bg-surface-50 pl-8 pr-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-3 pb-2 shrink-0">
            {[{ id: "all", name: "All" }, ...CATEGORIES].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(cat.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors whitespace-nowrap",
                  categoryId === cat.id
                    ? "bg-brand-500 text-white"
                    : "bg-surface-100 text-muted-foreground hover:text-foreground"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
              {products.map((p) => {
                const inCart = cart.find((i) => i.product.id === p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className={cn(
                      "relative rounded-xl border text-left overflow-hidden transition-all active:scale-95",
                      inCart ? "border-brand-300 bg-brand-50 ring-1 ring-brand-300" : "border-border bg-card hover:border-brand-200 hover:shadow-sm"
                    )}
                  >
                    {inCart && (
                      <span className="absolute top-1.5 right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                        {inCart.quantity}
                      </span>
                    )}
                    <div className="h-20 bg-surface-100 flex items-center justify-center overflow-hidden">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] font-semibold text-foreground line-clamp-2 leading-tight">{p.name}</p>
                      <p className="text-xs font-black text-brand-500 mt-1">{formatPHP(p.srp ?? p.price)}</p>
                    </div>
                  </button>
                );
              })}
              {products.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
                  No products found
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Cart & payment ── */}
        <div className="w-80 shrink-0 flex flex-col bg-card">

          {step === "done" ? (
            /* ── Receipt screen ── */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-100">
                <CheckCircle2 className="h-8 w-8 text-success-600" />
              </div>
              <div>
                <p className="font-display text-xl font-bold text-foreground">Payment received!</p>
                <p className="text-sm text-muted-foreground mt-1">Receipt #{receiptNo - 1}</p>
              </div>
              <div className="w-full rounded-2xl border border-border p-4 text-left space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold">{formatPHP(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-semibold capitalize">{method}</span>
                </div>
                {method === "cash" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tendered</span>
                      <span className="font-semibold">{formatPHP(tenderedNum)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2">
                      <span className="text-foreground font-semibold">Change</span>
                      <span className="font-black text-brand-500">{formatPHP(change)}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={handleNewSale}
                  className="w-full rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold h-11 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  New Sale
                </button>
                <button className="w-full rounded-xl bg-surface-100 hover:bg-surface-200 text-foreground text-sm font-medium h-9 transition-colors flex items-center justify-center gap-2">
                  <Printer className="h-4 w-4" />
                  Print Receipt
                </button>
              </div>
            </div>

          ) : step === "pay" ? (
            /* ── Payment screen ── */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Payment</p>
                  <button onClick={() => setStep("idle")} className="text-xs text-muted-foreground hover:text-foreground">
                    ← Back
                  </button>
                </div>
                <p className="font-display text-2xl font-black text-foreground mt-1">{formatPHP(total)}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Payment method */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Method</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PH_METHODS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMethod(m.id)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-xl border p-2 text-xs font-medium transition-colors",
                          method === m.id
                            ? "border-brand-300 bg-brand-50 text-brand-700"
                            : "border-border bg-surface-50 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span className="text-base">{m.icon}</span>
                        <span className="text-[10px]">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cash numpad */}
                {method === "cash" && (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-surface-100 p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Cash received</p>
                      <p className="font-display text-2xl font-black text-foreground">{formatPHP(parseInt(tendered) || 0)}</p>
                    </div>
                    {/* Quick amounts */}
                    <div className="grid grid-cols-4 gap-1">
                      {[100, 200, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setTendered(String(amt))}
                          className="rounded-lg bg-surface-100 hover:bg-surface-200 text-xs font-semibold py-1.5 transition-colors"
                        >
                          ₱{amt}
                        </button>
                      ))}
                    </div>
                    <Numpad value={tendered} onChange={setTendered} />
                    {tenderedNum > 0 && (
                      <div className={cn("rounded-xl p-2.5 text-center text-sm font-bold", tenderedNum >= total ? "bg-success-100 text-success-700" : "bg-danger-100 text-danger-700")}>
                        {tenderedNum >= total ? `Change: ${formatPHP(change)}` : `Short by ${formatPHP(total - tenderedNum)}`}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border">
                <button
                  onClick={handlePay}
                  disabled={method === "cash" && tenderedNum < total}
                  className="w-full rounded-2xl bg-success-500 hover:bg-success-600 disabled:opacity-40 text-white text-sm font-bold h-12 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Confirm Payment
                </button>
              </div>
            </div>

          ) : (
            /* ── Cart screen ── */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 pt-4 pb-2 border-b border-border shrink-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Current Sale</p>
                  {cart.length > 0 && (
                    <button onClick={() => setCart([])} className="text-xs text-danger-500 hover:text-danger-600">
                      Clear all
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{cart.length} item{cart.length !== 1 ? "s" : ""}</p>
              </div>

              {/* Cart items */}
              <div className="flex-1 overflow-y-auto divide-y divide-border">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
                    <ShoppingCart className="h-10 w-10 text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground">Tap a product to add it to the sale</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-2 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground line-clamp-1">{item.product.name}</p>
                        <p className="text-[11px] text-muted-foreground">{formatPHP(item.product.srp ?? item.product.price)} each</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => updateQty(item.product.id, -1)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface-100 hover:bg-surface-200 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-bold text-foreground w-5 text-center tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.product.id, 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-500 hover:bg-brand-600 text-white transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-right shrink-0 min-w-[52px]">
                        <p className="text-xs font-bold text-foreground">{formatPHP((item.product.srp ?? item.product.price) * item.quantity)}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-muted-foreground/40 hover:text-danger-500 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Total & checkout */}
              <div className="border-t border-border p-4 shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="font-display text-xl font-black text-foreground">{formatPHP(total)}</span>
                </div>
                <button
                  onClick={() => setStep("pay")}
                  disabled={cart.length === 0}
                  className="w-full rounded-2xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-bold h-12 transition-colors flex items-center justify-center gap-2"
                >
                  <Banknote className="h-5 w-5" />
                  Charge {cart.length > 0 ? formatPHP(total) : ""}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
