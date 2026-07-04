"use client";
import { useState } from "react";
import { Wallet, ArrowUpRight, ArrowDownLeft, Plus, CreditCard, Building2 } from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/store/wallet";
import { formatPHP, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TOP_UP_AMOUNTS = [100, 200, 500, 1000];

const TOP_UP_METHODS = [
  { id: "gcash", label: "GCash", icon: "💚", color: "bg-green-50 border-green-200 text-green-700" },
  { id: "maya", label: "Maya", icon: "💜", color: "bg-purple-50 border-purple-200 text-purple-700" },
  { id: "bank", label: "Bank Transfer", icon: "🏦", color: "bg-blue-50 border-blue-200 text-blue-700" },
];

export default function WalletPage() {
  const { balance, transactions, credit } = useWalletStore();
  const [showTopUp, setShowTopUp] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [selectedMethod, setSelectedMethod] = useState("gcash");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleTopUp() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    credit(selectedAmount, `Top-up via ${selectedMethod.toUpperCase()}`, `TXN-${Date.now()}`);
    setLoading(false);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setShowTopUp(false); }, 2000);
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar title="My Wallet" />

      <div className="px-4 py-5 space-y-5">
        {/* Balance card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-brand">
          <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-4 h-24 w-24 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="h-5 w-5 text-brand-200" />
              <span className="text-sm text-brand-200">Ka Sari-Sari Wallet</span>
            </div>
            <p className="text-xs text-brand-200 uppercase tracking-wide mb-1">Available balance</p>
            <p className="font-display text-4xl font-black">{formatPHP(balance)}</p>
            <p className="text-xs text-brand-200 mt-2">Valid for all purchases · No expiry</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowTopUp(true)}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card shadow-card px-4 py-4 hover:border-brand-300 transition-colors active:scale-95"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
              <Plus className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Top Up</p>
              <p className="text-xs text-muted-foreground">Add funds</p>
            </div>
          </button>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card shadow-card px-4 py-4 opacity-60">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 text-muted-foreground">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Withdraw</p>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </div>
          </div>
        </div>

        {/* Top-up modal inline */}
        {showTopUp && (
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-foreground">Add Money to Wallet</h3>

            {success ? (
              <div className="rounded-xl bg-success-50 border border-success-200 p-4 text-center">
                <p className="text-success-700 font-semibold text-sm">✓ {formatPHP(selectedAmount)} added successfully!</p>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Select amount</p>
                  <div className="grid grid-cols-4 gap-2">
                    {TOP_UP_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setSelectedAmount(amt)}
                        className={cn(
                          "rounded-xl border py-2.5 text-sm font-bold transition-colors",
                          selectedAmount === amt
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-border bg-card text-foreground hover:border-brand-300"
                        )}
                      >
                        ₱{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Pay via</p>
                  <div className="space-y-2">
                    {TOP_UP_METHODS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMethod(m.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                          selectedMethod === m.id ? "border-brand-500 bg-white" : "border-border bg-card hover:border-brand-200"
                        )}
                      >
                        <span className="text-lg">{m.icon}</span>
                        <span className="text-sm font-semibold text-foreground">{m.label}</span>
                        {selectedMethod === m.id && (
                          <span className="ml-auto text-brand-500 text-xs font-bold">Selected</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTopUp(false)}
                    className="flex-1 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <Button size="md" className="flex-1" onClick={handleTopUp} loading={loading}>
                    Add {formatPHP(selectedAmount)}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Transaction history */}
        <div>
          <h3 className="font-display text-base font-semibold text-foreground mb-3">Transaction History</h3>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
          ) : (
            <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden divide-y divide-border">
              {transactions.map((txn) => (
                <div key={txn.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
                    txn.type === "credit" ? "bg-success-50 text-success-600" : "bg-danger-50 text-danger-500"
                  )}>
                    {txn.type === "credit"
                      ? <ArrowDownLeft className="h-5 w-5" />
                      : <ArrowUpRight className="h-5 w-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{txn.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(txn.date)}</p>
                    {txn.reference && (
                      <p className="text-[10px] text-muted-foreground font-mono">{txn.reference}</p>
                    )}
                  </div>
                  <span className={cn(
                    "text-sm font-bold shrink-0",
                    txn.type === "credit" ? "text-success-600" : "text-foreground"
                  )}>
                    {txn.type === "credit" ? "+" : "−"}{formatPHP(txn.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <RetailerBottomNav />
    </div>
  );
}
