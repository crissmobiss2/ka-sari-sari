"use client";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  Search, Plus, Minus, X, CheckCircle2, Printer,
  RefreshCcw, ShoppingCart, Package, Banknote, ArrowLeft, Camera,
} from "lucide-react";
import Link from "next/link";
import { cn, formatPHP } from "@/lib/utils";
import { PRODUCTS, CATEGORIES } from "@/lib/mock-data";
import type { Product } from "@/types";
import { BarcodeScanner } from "@/components/pos/barcode-scanner";

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
            k === "C" ? "bg-danger-100 dark:bg-danger-500/20 text-danger-700 dark:text-foreground hover:bg-danger-200"
            : k === "⌫" ? "bg-surface-200 text-surface-900 hover:bg-surface-300"
            : "bg-surface-100 dark:bg-surface-800 text-surface-900 hover:bg-surface-200"
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
  const [mobileView, setMobileView] = useState<"products" | "cart">("products");
  const [showScanner, setShowScanner] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [txnReceiptNo, setTxnReceiptNo] = useState<string | null>(null);
  const [txnError, setTxnError] = useState<string | null>(null);
  const [txnLoading, setTxnLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>(PRODUCTS);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const fetched: Product[] = data.products ?? data;
        if (Array.isArray(fetched) && fetched.length > 0) setAllProducts(fetched);
      })
      .catch(() => {});
  }, []);

  const products = useMemo(() => {
    return allProducts.filter((p) => {
      const matchCat = categoryId === "all" || p.categoryId === categoryId;
      const matchQ   = search === "" || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      return p.isActive && matchCat && matchQ;
    });
  }, [search, categoryId, allProducts]);

  const total       = cart.reduce((s, i) => s + (i.product.srp ?? i.product.price) * i.quantity, 0);
  const tenderedNum = parseInt(tendered, 10) || 0;
  const change      = Math.max(0, tenderedNum - total);
  const cartCount   = cart.reduce((s, i) => s + i.quantity, 0);

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

  async function handlePay() {
    if (method === "cash" && tenderedNum < total) return;
    setTxnLoading(true);
    setTxnError(null);
    try {
      const res = await fetch("/api/pos/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({
            productId: i.product.id,
            name: i.product.name,
            price: i.product.srp ?? i.product.price,
            qty: i.quantity,
          })),
          total,
          method,
          posType: "retailer",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTxnReceiptNo(data.receiptNumber ?? null);
        setStep("done");
        setReceiptNo((n) => n + 1);
      } else {
        setTxnError("Transaction failed. Please try again.");
      }
    } catch {
      setTxnError("Network error.");
    } finally {
      setTxnLoading(false);
    }
  }

  function handleNewSale() {
    setCart([]);
    setStep("idle");
    setTendered("0");
    setMethod("cash");
    setMobileView("products");
    setTxnReceiptNo(null);
    setTxnError(null);
    setTimeout(() => searchRef.current?.focus(), 100);
  }

  const handleScan = useCallback((code: string) => {
    const product = allProducts.find((p) => p.isActive && p.sku.toLowerCase() === code.toLowerCase());
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    if (product) {
      addToCart(product);
      setScanFeedback({ ok: true, text: `✓ Added: ${product.name}` });
    } else {
      setScanFeedback({ ok: false, text: `Not found: ${code}` });
    }
    feedbackTimerRef.current = setTimeout(() => setScanFeedback(null), 2500);
  }, [allProducts]);

  // ── Receipt screen ──────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/100">
            <ShoppingCart className="h-4 w-4 text-white" />
          </div>
          <p className="text-sm font-bold text-foreground">Point of Sale</p>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-100 dark:bg-success-500/20">
            <CheckCircle2 className="h-8 w-8 text-success-600 dark:text-success-500" />
          </div>
          <div>
            <p className="font-display text-xl font-bold text-foreground">Payment received!</p>
            <p className="text-sm text-muted-foreground mt-1">Receipt {txnReceiptNo ?? `#${receiptNo - 1}`}</p>
          </div>
          <div className="w-full max-w-xs rounded-2xl border border-border p-4 text-left space-y-2 text-sm">
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
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <button
              onClick={handleNewSale}
              className="w-full rounded-xl bg-brand-50 dark:bg-brand-500/100 hover:bg-brand-600 text-white text-sm font-bold h-11 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              New Sale
            </button>
            <button className="w-full rounded-xl bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 text-surface-900 text-sm font-medium h-9 transition-colors flex items-center justify-center gap-2">
              <Printer className="h-4 w-4" />
              Print Receipt
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main POS layout ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">

      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
        <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/100">
          <ShoppingCart className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-foreground leading-tight">Point of Sale</p>
          <p className="text-[10px] text-muted-foreground">Maria&apos;s Sari-Sari Store</p>
        </div>
        <button
          onClick={() => setShowScanner(true)}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-brand-500 hover:border-brand-300 transition-colors"
          title="Scan barcode"
        >
          <Camera className="h-4 w-4" />
        </button>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Receipt #</p>
          <p className="text-xs font-bold text-foreground">{receiptNo}</p>
        </div>
      </header>

      {/* Mobile tab bar — products / cart */}
      <div className="flex md:hidden border-b border-border bg-card shrink-0">
        <button
          onClick={() => setMobileView("products")}
          className={cn(
            "flex-1 py-2 text-xs font-semibold transition-colors",
            mobileView === "products"
              ? "text-brand-500 border-b-2 border-brand-500"
              : "text-muted-foreground"
          )}
        >
          Products
        </button>
        <button
          onClick={() => setMobileView("cart")}
          className={cn(
            "flex-1 py-2 text-xs font-semibold transition-colors",
            mobileView === "cart"
              ? "text-brand-500 border-b-2 border-brand-500"
              : "text-muted-foreground"
          )}
        >
          Cart
          {cartCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-brand-50 dark:bg-brand-500/100 text-white text-[10px] font-bold">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left / Products panel ── */}
        <div className={cn(
          "flex-col overflow-hidden border-r border-border",
          mobileView === "products" ? "flex flex-1" : "hidden",
          "md:flex md:flex-1"
        )}>
          {/* Search row */}
          <div className="px-3 pt-3 pb-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product or scan barcode…"
                className="w-full rounded-xl border border-border bg-surface-50 dark:bg-surface-900 pl-8 pr-10 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                onClick={() => setShowScanner(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground hover:text-brand-500 transition-colors"
                title="Scan barcode"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
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
                    ? "bg-brand-50 dark:bg-brand-500/100 text-white"
                    : "bg-surface-100 dark:bg-surface-800 text-muted-foreground hover:text-foreground"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Scan feedback banner */}
          {scanFeedback && (
            <div className={cn(
              "mx-3 mb-2 rounded-xl px-3 py-2 text-xs font-semibold text-white shrink-0",
              scanFeedback.ok ? "bg-success-50 dark:bg-success-500/100" : "bg-danger-50 dark:bg-danger-500/100"
            )}>
              {scanFeedback.text}
            </div>
          )}

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
                      inCart ? "border-brand-300 bg-brand-50 dark:bg-brand-500/10 ring-1 ring-brand-300" : "border-border bg-card hover:border-brand-200 hover:shadow-sm"
                    )}
                  >
                    {inCart && (
                      <span className="absolute top-1.5 right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/100 text-[10px] font-bold text-white">
                        {inCart.quantity}
                      </span>
                    )}
                    <div className="h-20 bg-surface-100 dark:bg-surface-800 flex items-center justify-center overflow-hidden">
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

        {/* ── Right / Cart & Payment panel ── */}
        <div className={cn(
          "flex-col bg-card",
          mobileView === "cart" ? "flex flex-1" : "hidden",
          "md:flex md:w-80 md:flex-none"
        )}>

          {step === "pay" ? (
            /* Payment screen */
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
                            ? "border-brand-300 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-foreground"
                            : "border-border bg-surface-50 dark:bg-surface-900 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span className="text-base">{m.icon}</span>
                        <span className="text-[10px]">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {method === "cash" && (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-surface-100 dark:bg-surface-800 p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Cash received</p>
                      <p className="font-display text-2xl font-black text-surface-900">{formatPHP(parseInt(tendered) || 0)}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[100, 200, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setTendered(String(amt))}
                          className="rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 text-xs font-semibold py-1.5 transition-colors text-surface-900"
                        >
                          ₱{amt}
                        </button>
                      ))}
                    </div>
                    <Numpad value={tendered} onChange={setTendered} />
                    {tenderedNum > 0 && (
                      <div className={cn("rounded-xl p-2.5 text-center text-sm font-bold", tenderedNum >= total ? "bg-success-100 dark:bg-success-500/20 text-success-700 dark:text-foreground" : "bg-danger-100 text-danger-700 dark:text-foreground")}>
                        {tenderedNum >= total ? `Change: ${formatPHP(change)}` : `Short by ${formatPHP(total - tenderedNum)}`}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border space-y-2">
                {txnError && (
                  <div className="rounded-xl bg-danger-50 dark:bg-danger-500/10 border border-danger-200 px-3 py-2 text-xs text-danger-700 dark:text-foreground">
                    {txnError}
                  </div>
                )}
                <button
                  onClick={handlePay}
                  disabled={(method === "cash" && tenderedNum < total) || txnLoading}
                  className="w-full rounded-2xl bg-success-50 dark:bg-success-500/100 hover:bg-success-600 disabled:opacity-40 text-white text-sm font-bold h-12 transition-colors flex items-center justify-center gap-2"
                >
                  {txnLoading ? (
                    <>
                      <span className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Processing…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      Confirm Payment
                    </>
                  )}
                </button>
              </div>
            </div>

          ) : (
            /* Cart screen */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 pt-4 pb-2 border-b border-border shrink-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Current Sale</p>
                  {cart.length > 0 && (
                    <button onClick={() => setCart([])} className="text-xs text-danger-500 hover:text-danger-600 dark:text-danger-500">
                      Clear all
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{cart.length} item{cart.length !== 1 ? "s" : ""}</p>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-border">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
                    <ShoppingCart className="h-10 w-10 text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground">Tap a product to add it</p>
                    <button
                      onClick={() => { setMobileView("products"); setShowScanner(true); }}
                      className="mt-3 flex items-center gap-1.5 text-xs text-brand-500 font-semibold md:hidden"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      Or scan a barcode
                    </button>
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
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 text-surface-900 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-bold text-foreground w-5 text-center tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.product.id, 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/100 hover:bg-brand-600 text-white transition-colors"
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

              <div className="border-t border-border p-4 shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="font-display text-xl font-black text-foreground">{formatPHP(total)}</span>
                </div>
                <button
                  onClick={() => setStep("pay")}
                  disabled={cart.length === 0}
                  className="w-full rounded-2xl bg-brand-50 dark:bg-brand-500/100 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-bold h-12 transition-colors flex items-center justify-center gap-2"
                >
                  <Banknote className="h-5 w-5" />
                  Charge {cart.length > 0 ? formatPHP(total) : ""}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barcode scanner modal */}
      {showScanner && (
        <BarcodeScanner
          onScan={(code) => {
            handleScan(code);
            setMobileView("products");
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
}
