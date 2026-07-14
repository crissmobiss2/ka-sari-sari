"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin, CreditCard, CheckCircle2, ChevronDown, ChevronUp,
  AlertCircle, Loader2, AlertTriangle, ArrowRight
} from "lucide-react";
import { RetailerTopBar } from "@/components/layout/retailer-nav";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart";
import { useWalletStore } from "@/store/wallet";
import { formatPHP, cn } from "@/lib/utils";

type PaymentMethod = "gcash" | "maya" | "cod";

const PAYMENT_OPTIONS: {
  id: PaymentMethod;
  label: string;
  description: string;
  badge: string;
  badgeClass: string;
}[] = [
  {
    id: "gcash",
    label: "GCash",
    description: "Pay via GCash e-wallet",
    badge: "GCash",
    badgeClass: "bg-gradient-to-r from-blue-500 to-green-400 text-white",
  },
  {
    id: "maya",
    label: "Maya",
    description: "Pay via Maya e-wallet",
    badge: "Maya",
    badgeClass: "bg-gradient-to-r from-purple-500 to-purple-700 text-white",
  },
  {
    id: "cod",
    label: "Cash on Delivery",
    description: "Pay in cash when your order arrives",
    badge: "COD",
    badgeClass: "bg-gradient-to-r from-amber-500 to-yellow-500 text-white",
  },
];

const DELIVERY_FEE = 80;
const FREE_DELIVERY_THRESHOLD = 1500;
const DEFAULT_ADDRESS = "123 Rosal Street, Brgy. 5, Caloocan City, Metro Manila";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, _hasHydrated } = useCartStore();
  const { balance: walletBalance, debit: walletDebit } = useWalletStore();

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("cod");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showItems, setShowItems] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [address, setAddress] = useState(DEFAULT_ADDRESS);
  const [draftAddress, setDraftAddress] = useState(DEFAULT_ADDRESS);

  useEffect(() => {
    if (_hasHydrated && items.length === 0 && !loading) router.push("/catalog");
  }, [_hasHydrated, items.length, loading, router]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.address) {
          setAddress(d.user.address);
          setDraftAddress(d.user.address);
        }
      })
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  function getButtonLabel() {
    if (loading) return null;
    switch (selectedPayment) {
      case "cod":
        return "Place Order — Cash on Delivery";
      case "gcash":
        return "Continue to GCash";
      case "maya":
        return "Continue to Maya";
    }
  }

  async function handlePlaceOrder() {
    setError(null);
    setLoading(true);

    try {
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.product.id,
            name: i.product.name,
            unitPrice: i.product.price,
            quantity: i.quantity,
          })),
          deliveryAddress: address,
          deliveryNotes: "",
          paymentMethod: selectedPayment,
          subtotal,
          deliveryFee,
          total,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to create order");
      const orderId = orderData.order.id;

      if (selectedPayment === "cod") {
        clearCart();
        router.push(`/checkout/success?orderId=${orderId}&method=cod&total=${total}`);
        return;
      }

      if (selectedPayment === "gcash" || selectedPayment === "maya") {
        const payRes = await fetch(`/api/payments/${selectedPayment}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: total,
            orderId,
            description: `Ka Sari-Sari Order ${orderId}`,
          }),
        });

        const payData = await payRes.json();

        if (!payRes.ok) {
          throw new Error(payData.error || "Payment initiation failed");
        }

        if (payData.checkoutUrl) {
          // Do NOT clearCart() here — cart is only cleared on the success page
          // after payment is confirmed. If the user closes the browser before
          // completing payment, the cart must still be intact for a retry.
          window.location.href = payData.checkoutUrl;
        } else {
          clearCart();
          router.push(`/checkout/success?orderId=${orderId}&method=${selectedPayment}&total=${total}`);
        }
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-36">
      <RetailerTopBar title="Checkout" />

      <div className="px-4 py-5 space-y-4">

        {/* ── Section A: Delivery Address ── */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-500" />
              <h3 className="font-display text-sm font-semibold text-foreground">Delivery Address</h3>
            </div>
            {!editingAddress && (
              <button
                onClick={() => {
                  setDraftAddress(address);
                  setEditingAddress(true);
                }}
                className="text-xs text-brand-500 font-medium hover:text-brand-600 transition-colors"
              >
                Change
              </button>
            )}
          </div>
          {editingAddress ? (
            <div className="space-y-2.5">
              <textarea
                value={draftAddress}
                onChange={(e) => setDraftAddress(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    setAddress(draftAddress.trim() || address);
                    setEditingAddress(false);
                  }}
                  className="flex-1"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingAddress(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground leading-relaxed">{address}</p>
          )}
        </div>

        {/* ── Section B: Order Items (collapsible) ── */}
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <button
            onClick={() => setShowItems(!showItems)}
            className="flex w-full items-center justify-between px-5 py-3.5 hover:bg-muted transition-colors"
          >
            <h3 className="font-display text-sm font-semibold text-foreground">
              Order Items ({items.reduce((s, i) => s + i.quantity, 0)})
            </h3>
            {showItems
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />
            }
          </button>
          {showItems && (
            <div className="border-t border-border divide-y divide-border">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty: {quantity} × {formatPHP(product.price)}
                    </p>
                  </div>
                  <p className="font-semibold text-foreground ml-4">
                    {formatPHP(product.price * quantity)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Section C: Payment Method ── */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-brand-500" />
            <h3 className="font-display text-sm font-semibold text-foreground">Payment Method</h3>
          </div>

          <div className="space-y-2">
            {PAYMENT_OPTIONS.map((option) => {
              const isSelected = selectedPayment === option.id;
              return (
                <label
                  key={option.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 p-4 cursor-pointer transition-all",
                    isSelected
                      ? "border-brand-500 bg-brand-50/30"
                      : "border-border bg-card hover:border-brand-200"
                  )}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={option.id}
                    checked={isSelected}
                    onChange={() => setSelectedPayment(option.id)}
                    className="accent-brand-500 shrink-0 h-4 w-4"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-3 py-0.5 text-xs font-bold tracking-wide",
                      option.badgeClass
                    )}
                  >
                    {option.badge}
                  </span>
                </label>
              );
            })}
          </div>

          {/* COD info box */}
          {selectedPayment === "cod" && (
            <div className="flex items-start gap-2.5 rounded-xl bg-warning-50 border border-warning-300 p-3">
              <AlertTriangle className="h-4 w-4 text-warning-600 shrink-0 mt-0.5" />
              <p className="text-xs text-warning-700 leading-relaxed">
                Please prepare exact change. Our driver will collect payment upon delivery.
              </p>
            </div>
          )}
        </div>

        {/* ── Section D: Order Summary ── */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-5 space-y-2.5">
          <h3 className="font-display text-sm font-semibold text-foreground">Order Summary</h3>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
            <span>{formatPHP(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground items-center">
            <span>Delivery fee</span>
            {deliveryFee === 0 ? (
              <span className="flex items-center gap-1.5">
                <span className="line-through">₱80</span>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  FREE
                </span>
              </span>
            ) : (
              <span>{formatPHP(deliveryFee)}</span>
            )}
          </div>
          <div className="border-t border-border pt-2.5 flex justify-between text-base font-bold text-foreground">
            <span>Total</span>
            <span className="text-brand-500">{formatPHP(total)}</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-danger-50 border border-danger-200 px-4 py-3 text-sm text-danger-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* ── Section E: Fixed Place Order CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-md px-4 py-4 safe-area-pb">
        <Button
          size="lg"
          className="w-full"
          onClick={handlePlaceOrder}
          loading={loading}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {getButtonLabel()}
              {(selectedPayment === "gcash" || selectedPayment === "maya") && (
                <ArrowRight className="h-4 w-4 ml-1" />
              )}
            </>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Secure payment · All transactions encrypted
        </p>
      </div>
    </div>
  );
}
