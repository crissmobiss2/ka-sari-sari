"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin, CreditCard, CheckCircle2, ChevronDown, ChevronUp,
  Wallet, Banknote, Building2, Smartphone, AlertCircle, Loader2,
  QrCode
} from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartStore } from "@/store/cart";
import { useWalletStore } from "@/store/wallet";
import { formatPHP } from "@/lib/utils";
import { cn } from "@/lib/utils";

const PAYMENT_METHODS = [
  {
    id: "gcash",
    label: "GCash",
    description: "Pay via GCash e-wallet",
    icon: "💚",
    color: "border-green-200 bg-green-50",
    activeColor: "border-green-500 bg-green-50",
    group: "E-Wallets",
  },
  {
    id: "maya",
    label: "Maya",
    description: "Pay via Maya e-wallet",
    icon: "💜",
    color: "border-purple-200 bg-purple-50",
    activeColor: "border-purple-500 bg-purple-50",
    group: "E-Wallets",
  },
  {
    id: "shopeepay",
    label: "ShopeePay",
    description: "Pay via ShopeePay",
    icon: "🛍️",
    color: "border-orange-200 bg-orange-50",
    activeColor: "border-orange-500 bg-orange-50",
    group: "E-Wallets",
  },
  {
    id: "qrph",
    label: "QR Ph",
    description: "Scan with any bank app",
    icon: "📱",
    color: "border-blue-200 bg-blue-50",
    activeColor: "border-blue-500 bg-blue-50",
    group: "E-Wallets",
  },
  {
    id: "wallet",
    label: "Ka Sari-Sari Wallet",
    description: "Use your store credits",
    icon: "👛",
    color: "border-border bg-card",
    activeColor: "border-brand-500 bg-brand-50",
    isWallet: true,
    group: "E-Wallets",
  },
  {
    id: "card",
    label: "Credit / Debit Card",
    description: "Visa, Mastercard, JCB accepted",
    icon: "💳",
    color: "border-border bg-card",
    activeColor: "border-brand-500 bg-brand-50",
    group: "Cards",
  },
  {
    id: "bank",
    label: "Bank Transfer",
    description: "BDO, BPI, Metrobank, UnionBank",
    icon: "🏦",
    color: "border-border bg-card",
    activeColor: "border-brand-500 bg-brand-50",
    group: "Banks",
  },
  {
    id: "instapay",
    label: "InstaPay",
    description: "Real-time transfer, any bank",
    icon: "⚡",
    color: "border-yellow-200 bg-yellow-50",
    activeColor: "border-yellow-500 bg-yellow-50",
    group: "Banks",
  },
  {
    id: "cod",
    label: "Cash on Delivery",
    description: "Pay when your order arrives",
    icon: "💵",
    color: "border-border bg-card",
    activeColor: "border-brand-500 bg-brand-50",
    group: "Cash",
  },
  {
    id: "palawan",
    label: "Palawan Express",
    description: "Pay at any Palawan branch",
    icon: "🌴",
    color: "border-green-200 bg-green-50",
    activeColor: "border-green-500 bg-green-50",
    group: "Over-the-Counter",
  },
  {
    id: "cebuana",
    label: "Cebuana Lhuillier",
    description: "Pay at any Cebuana branch",
    icon: "💛",
    color: "border-yellow-200 bg-yellow-50",
    activeColor: "border-yellow-500 bg-yellow-50",
    group: "Over-the-Counter",
  },
  {
    id: "terms",
    label: "Credit Terms (30 days)",
    description: "For verified retailers only",
    icon: "📋",
    color: "border-slate-200 bg-slate-50",
    activeColor: "border-slate-500 bg-slate-50",
    group: "Other",
  },
];

const DELIVERY_FEE = 80;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const { balance: walletBalance, debit: walletDebit } = useWalletStore();
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const total = subtotal + DELIVERY_FEE;

  const [paymentMethod, setPaymentMethod] = useState("gcash");
  const [address, setAddress] = useState("123 Rizal St., Barangay 5, Caloocan City");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showItems, setShowItems] = useState(false);

  if (items.length === 0) {
    router.push("/catalog");
    return null;
  }

  const walletInsufficient = paymentMethod === "wallet" && walletBalance < total;

  async function handlePlaceOrder() {
    setError(null);
    setLoading(true);

    try {
      // Step 1: Create the order
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.product.id,
            name: i.product.name,
            price: i.product.price,
            quantity: i.quantity,
          })),
          deliveryAddress: address,
          deliveryNotes: notes,
          paymentMethod,
          subtotal,
          deliveryFee: DELIVERY_FEE,
          total,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to create order");
      const orderId = orderData.order.id;

      // Step 2: Handle payment by method
      if (paymentMethod === "cod") {
        clearCart();
        router.push(`/checkout/success?orderId=${orderId}&method=cod`);
        return;
      }

      if (paymentMethod === "wallet") {
        if (walletBalance < total) throw new Error("Insufficient wallet balance");
        walletDebit(total, `Order payment - ${orderId}`, orderId);
        clearCart();
        router.push(`/checkout/success?orderId=${orderId}&method=wallet`);
        return;
      }

      if (paymentMethod === "bank") {
        clearCart();
        router.push(`/checkout/processing?orderId=${orderId}`);
        return;
      }

      if (paymentMethod === "gcash" || paymentMethod === "maya") {
        const endpoint = `/api/payments/${paymentMethod}`;
        const payRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: total, orderId, description: `Ka Sari-Sari Order ${orderId}` }),
        });

        const payData = await payRes.json();

        if (!payRes.ok) {
          // PayMongo not configured (no API key) - demo mode
          if (payRes.status === 503) {
            clearCart();
            router.push(`/checkout/success?orderId=${orderId}&method=${paymentMethod}`);
            return;
          }
          throw new Error(payData.error || "Payment initiation failed");
        }

        if (payData.checkoutUrl) {
          clearCart();
          window.location.href = payData.checkoutUrl;
        } else {
          clearCart();
          router.push(`/checkout/success?orderId=${orderId}&method=${paymentMethod}`);
        }
        return;
      }

      if (paymentMethod === "card" || paymentMethod === "shopeepay") {
        clearCart();
        router.push(`/checkout/success?orderId=${orderId}&method=${paymentMethod}`);
        return;
      }

      if (["qrph", "instapay", "palawan", "cebuana", "terms"].includes(paymentMethod)) {
        clearCart();
        router.push(`/checkout/processing?orderId=${orderId}`);
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
        {/* Delivery address */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-brand-500" />
            <h3 className="font-display text-sm font-semibold text-foreground">Delivery Address</h3>
          </div>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full delivery address" />
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery notes (optional)" />
        </div>

        {/* Order items summary - collapsible */}
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          <button
            onClick={() => setShowItems(!showItems)}
            className="flex w-full items-center justify-between px-5 py-3.5 hover:bg-muted transition-colors"
          >
            <h3 className="font-display text-sm font-semibold text-foreground">
              Order Items ({items.reduce((s, i) => s + i.quantity, 0)})
            </h3>
            {showItems ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
          {showItems && (
            <div className="border-t border-border divide-y divide-border">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {quantity} × {formatPHP(product.price)}</p>
                  </div>
                  <p className="font-semibold text-foreground ml-4">{formatPHP(product.price * quantity)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment method */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-brand-500" />
            <h3 className="font-display text-sm font-semibold text-foreground">Payment Method</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(
              PAYMENT_METHODS.reduce((acc, pm) => {
                const g = pm.group || "Other";
                if (!acc[g]) acc[g] = [];
                acc[g].push(pm);
                return acc;
              }, {} as Record<string, typeof PAYMENT_METHODS>)
            ).map(([groupName, methods]) => (
              <div key={groupName}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{groupName}</p>
                <div className="space-y-1.5">
                  {methods.map((pm) => (
                    <label
                      key={pm.id}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all",
                        paymentMethod === pm.id ? pm.activeColor : pm.color,
                        "hover:shadow-sm"
                      )}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={pm.id}
                        checked={paymentMethod === pm.id}
                        onChange={() => setPaymentMethod(pm.id)}
                        className="accent-brand-500 shrink-0"
                      />
                      <span className="text-lg shrink-0">{pm.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{pm.label}</p>
                        <p className="text-xs text-muted-foreground">{pm.description}</p>
                        {"isWallet" in pm && pm.isWallet && (
                          <p className="text-xs font-bold text-brand-500 mt-0.5">Balance: {formatPHP(walletBalance)}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {walletInsufficient && (
            <div className="flex items-center gap-2 rounded-xl bg-warning-50 border border-warning-200 px-3 py-2.5 text-xs text-warning-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Insufficient wallet balance. Top up or choose another method.
            </div>
          )}
        </div>

        {/* Bank transfer instructions */}
        {paymentMethod === "bank" && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-2">
            <p className="text-sm font-semibold text-blue-800 flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Bank Transfer Details
            </p>
            <div className="space-y-1 text-xs text-blue-700">
              <p><span className="font-medium">BDO:</span> 001-234-567-8901 · Ka Sari-Sari Inc.</p>
              <p><span className="font-medium">BPI:</span> 0987-6543-21 · Ka Sari-Sari Inc.</p>
              <p><span className="font-medium">Metrobank:</span> 1234-567-890123 · Ka Sari-Sari Inc.</p>
              <p><span className="font-medium">LANDBANK:</span> 2345-6789-0123 · Ka Sari-Sari Inc.</p>
              <p><span className="font-medium">UnionBank:</span> 1122-3344-5566 · Ka Sari-Sari Inc.</p>
              <p className="mt-2 font-medium">Use your order number as reference. Upload your receipt to expedite processing.</p>
            </div>
          </div>
        )}

        {/* InstaPay instructions */}
        {paymentMethod === "instapay" && (
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 space-y-2">
            <p className="text-sm font-semibold text-yellow-800 flex items-center gap-2">
              <Smartphone className="h-4 w-4" /> InstaPay Details
            </p>
            <div className="space-y-1 text-xs text-yellow-700">
              <p><span className="font-medium">Account:</span> 09171234567</p>
              <p><span className="font-medium">Account Name:</span> Ka Sari-Sari Inc.</p>
              <p className="mt-2">Transfer via any bank app that supports InstaPay. Use your order number as the reference/remarks. Funds settle in seconds.</p>
            </div>
          </div>
        )}

        {/* QR Ph instructions */}
        {paymentMethod === "qrph" && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
            <div className="h-16 w-16 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
              <QrCode className="h-10 w-10 text-white" strokeWidth={1.2} />
            </div>
            <div className="text-xs text-blue-700 space-y-1">
              <p className="text-sm font-semibold text-blue-800">Scan QR Ph Code</p>
              <p>Open any Philippine bank app (BDO, BPI, UnionBank, Maya, GCash) and scan the QR code.</p>
              <p>Amount: <span className="font-bold">{formatPHP(total)}</span></p>
              <p className="text-blue-500">QR code will be shown after order confirmation.</p>
            </div>
          </div>
        )}

        {/* ShopeePay instructions */}
        {paymentMethod === "shopeepay" && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 space-y-1.5 text-xs text-orange-700">
            <p className="text-sm font-semibold text-orange-800">Pay via ShopeePay</p>
            <p>Open your Shopee app and scan the QR code, or send to our ShopeePay account.</p>
            <p><span className="font-medium">ShopeePay:</span> Ka Sari-Sari Official Store</p>
          </div>
        )}

        {/* OTC instructions */}
        {(paymentMethod === "palawan" || paymentMethod === "cebuana") && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 space-y-1.5 text-xs text-green-700">
            <p className="text-sm font-semibold text-green-800">
              {paymentMethod === "palawan" ? "Palawan Express" : "Cebuana Lhuillier"} Payment
            </p>
            <p>After placing your order, you will receive a reference code to use at any {paymentMethod === "palawan" ? "Palawan Express" : "Cebuana Lhuillier"} branch nationwide.</p>
            <p>Amount: <span className="font-bold">{formatPHP(total)}</span></p>
            <p className="text-green-500">Payment must be made within 24 hours to reserve your order.</p>
          </div>
        )}

        {/* Credit Terms instructions */}
        {paymentMethod === "terms" && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1.5 text-xs text-slate-600">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Credit Terms (30 Days)
            </p>
            <p>Available to retailers with an approved credit line. Payment is due 30 days after delivery.</p>
            <p className="font-medium text-slate-700">Late payments incur a 2% monthly interest charge.</p>
            <p className="text-slate-500">Need to apply? Contact us at support@kasarisari.ph</p>
          </div>
        )}

        {/* Order total */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-5 space-y-2.5">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPHP(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Delivery fee</span>
            <span>{formatPHP(DELIVERY_FEE)}</span>
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

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/95 backdrop-blur-md px-4 py-4 safe-area-pb">
        <Button
          size="lg"
          className="w-full"
          onClick={handlePlaceOrder}
          loading={loading}
          disabled={loading || walletInsufficient || !address.trim()}
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
          ) : (
            <><CheckCircle2 className="h-4 w-4" /> Place Order - {formatPHP(total)}</>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Secure payment · All transactions encrypted
        </p>
      </div>
    </div>
  );
}
