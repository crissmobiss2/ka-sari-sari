"use client";
import { useState } from "react";
import {
  Wallet, ArrowUpRight, ArrowDownLeft, Plus, CreditCard,
  Building2, ChevronRight, X, AlertCircle, CheckCircle2
} from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/store/wallet";
import { formatPHP, formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const TOP_UP_AMOUNTS = [200, 500, 1000, 2000];
const WITHDRAW_AMOUNTS = [100, 200, 500, 1000];

const TOP_UP_METHODS = [
  { id: "gcash", label: "GCash", icon: "💚", color: "bg-green-50 border-green-200 text-green-700" },
  { id: "maya", label: "Maya", icon: "💜", color: "bg-purple-50 border-purple-200 text-purple-700" },
  { id: "bank", label: "Bank Transfer", icon: "🏦", color: "bg-blue-50 border-blue-200 text-blue-700" },
];

const WITHDRAW_METHODS = [
  { id: "gcash", label: "GCash", icon: "💚", placeholder: "09XX XXX XXXX", hint: "GCash-registered number" },
  { id: "maya", label: "Maya", icon: "💜", placeholder: "09XX XXX XXXX", hint: "Maya-registered number" },
  { id: "bdo", label: "BDO", icon: "🏦", placeholder: "10-digit account number", hint: "BDO savings or checking" },
  { id: "bpi", label: "BPI", icon: "🏦", placeholder: "10-digit account number", hint: "BPI savings or current" },
  { id: "unionbank", label: "UnionBank", icon: "🏦", placeholder: "12-digit account number", hint: "UnionBank account" },
];

export default function WalletPage() {
  const { balance, transactions, credit, debit } = useWalletStore();

  // Top-up state
  const [showTopUp, setShowTopUp] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [selectedMethod, setSelectedMethod] = useState("gcash");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpSuccess, setTopUpSuccess] = useState(false);
  const [topUpRef, setTopUpRef] = useState("");

  // Withdraw state
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState<"amount" | "account" | "confirm" | "done">("amount");
  const [withdrawAmount, setWithdrawAmount] = useState(500);
  const [withdrawMethod, setWithdrawMethod] = useState("gcash");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawAmountError, setWithdrawAmountError] = useState("");

  async function handleTopUp() {
    setTopUpLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    const ref = "KSS-" + Math.random().toString(36).slice(2, 8).toUpperCase() + "-" + new Date().getFullYear();
    credit(selectedAmount, `Top-up via ${selectedMethod.toUpperCase()}`, ref);
    setTopUpRef(ref);
    setTopUpLoading(false);
    setTopUpSuccess(true);
    setTimeout(() => { setTopUpSuccess(false); setTopUpRef(""); setShowTopUp(false); }, 2000);
  }

  function openWithdraw() {
    setWithdrawStep("amount");
    setWithdrawAmount(500);
    setWithdrawMethod("gcash");
    setAccountNumber("");
    setAccountName("");
    setWithdrawError("");
    setWithdrawAmountError("");
    setShowWithdraw(true);
  }

  function closeWithdraw() {
    setShowWithdraw(false);
    setWithdrawStep("amount");
  }

  async function handleWithdrawConfirm() {
    setWithdrawLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    const ref = "KSS-" + Math.random().toString(36).slice(2, 8).toUpperCase() + "-" + new Date().getFullYear();
    const success = debit(
      withdrawAmount,
      `Withdraw to ${WITHDRAW_METHODS.find(m => m.id === withdrawMethod)?.label} ···${accountNumber.slice(-4)}`,
      ref
    );
    setWithdrawLoading(false);
    if (success) {
      setWithdrawStep("done");
    } else {
      setWithdrawError("Insufficient balance.");
    }
  }

  function validateWithdrawAmount(): boolean {
    if (withdrawAmount < 50) {
      setWithdrawAmountError("Minimum withdrawal is ₱50");
      return false;
    }
    if (withdrawAmount > balance) {
      setWithdrawAmountError("Insufficient balance");
      return false;
    }
    setWithdrawAmountError("");
    return true;
  }

  const selectedWithdrawMethod = WITHDRAW_METHODS.find(m => m.id === withdrawMethod)!;

  function isAccountValid(): boolean {
    const digits = accountNumber.replace(/\D/g, "");
    if (withdrawMethod === "gcash" || withdrawMethod === "maya") {
      return digits.length === 11 && digits.startsWith("09");
    }
    if (withdrawMethod === "bdo" || withdrawMethod === "bpi") {
      return digits.length === 10;
    }
    if (withdrawMethod === "unionbank") {
      return digits.length === 12;
    }
    return accountNumber.length >= 6;
  }

  function accountError(): string {
    if (!accountNumber) return "";
    const digits = accountNumber.replace(/\D/g, "");
    if (withdrawMethod === "gcash" || withdrawMethod === "maya") {
      if (!digits.startsWith("09")) return "Must start with 09";
      if (digits.length !== 11) return "Must be 11 digits";
    }
    if (withdrawMethod === "bdo" || withdrawMethod === "bpi") {
      if (digits.length !== 10) return "Must be 10 digits";
    }
    if (withdrawMethod === "unionbank") {
      if (digits.length !== 12) return "Must be 12 digits";
    }
    return "";
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
          <button
            onClick={openWithdraw}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card shadow-card px-4 py-4 hover:border-brand-300 transition-colors active:scale-95"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-100 text-foreground">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Withdraw</p>
              <p className="text-xs text-muted-foreground">Cash out</p>
            </div>
          </button>
        </div>

        {/* Top-up modal inline */}
        {showTopUp && (
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-foreground">Add Money to Wallet</h3>
              <button onClick={() => setShowTopUp(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {topUpSuccess ? (
              <div className="rounded-xl bg-success-50 border border-success-200 p-4 text-center space-y-1">
                <CheckCircle2 className="h-6 w-6 text-success-600 mx-auto mb-1" />
                <p className="text-success-700 font-semibold text-sm">
                  {formatPHP(selectedAmount)} added via {selectedMethod.toUpperCase()}
                </p>
                <p className="text-success-600 text-xs font-mono">Ref: #{topUpRef.split("-").slice(1, 2).join("")}</p>
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
                  <Button size="md" className="flex-1" onClick={handleTopUp} loading={topUpLoading}>
                    Add {formatPHP(selectedAmount)}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Withdraw flow inline */}
        {showWithdraw && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-foreground">
                {withdrawStep === "done" ? "Withdrawal Sent" : "Cash Out"}
              </h3>
              <button onClick={closeWithdraw} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step: Amount */}
            {withdrawStep === "amount" && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Withdraw to</p>
                  <div className="space-y-2">
                    {WITHDRAW_METHODS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setWithdrawMethod(m.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                          withdrawMethod === m.id ? "border-brand-500 bg-brand-50" : "border-border bg-card hover:border-brand-200"
                        )}
                      >
                        <span className="text-base">{m.icon}</span>
                        <span className="text-sm font-semibold text-foreground">{m.label}</span>
                        {withdrawMethod === m.id && <CheckCircle2 className="ml-auto h-4 w-4 text-brand-500" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Amount</p>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {WITHDRAW_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => { setWithdrawAmount(amt); setWithdrawAmountError(""); }}
                        disabled={balance < amt}
                        className={cn(
                          "rounded-xl border py-2.5 text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                          withdrawAmount === amt
                            ? "border-brand-500 bg-brand-500 text-white"
                            : "border-border bg-card text-foreground hover:border-brand-300"
                        )}
                      >
                        ₱{amt}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Available: <span className="font-semibold text-foreground">{formatPHP(balance)}</span>
                    {" · "}Processing: 1–2 banking days
                  </p>
                </div>

                {withdrawAmountError && (
                  <div className="flex items-center gap-2 rounded-xl bg-danger-50 border border-danger-200 px-3 py-2.5">
                    <AlertCircle className="h-4 w-4 text-danger-500 shrink-0" />
                    <p className="text-xs text-danger-700">{withdrawAmountError}</p>
                  </div>
                )}

                <Button
                  size="md"
                  className="w-full"
                  onClick={() => { if (validateWithdrawAmount()) setWithdrawStep("account"); }}
                >
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            )}

            {/* Step: Account number */}
            {withdrawStep === "account" && (
              <>
                <div className="rounded-xl bg-surface-100 px-4 py-3 flex items-center gap-3">
                  <span className="text-lg">{selectedWithdrawMethod.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{selectedWithdrawMethod.label}</p>
                    <p className="text-xs text-muted-foreground">Withdrawing {formatPHP(withdrawAmount)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Account / Mobile number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder={selectedWithdrawMethod.placeholder}
                      className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    {accountError() ? (
                      <p className="text-[11px] text-danger-500 mt-1">{accountError()}</p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground mt-1">{selectedWithdrawMethod.hint}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">Account holder name</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Full name as registered"
                      className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setWithdrawStep("amount")}
                    className="flex-1 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    Back
                  </button>
                  <Button
                    size="md"
                    className="flex-1"
                    disabled={!isAccountValid() || accountName.length < 2}
                    onClick={() => setWithdrawStep("confirm")}
                  >
                    Review
                  </Button>
                </div>
              </>
            )}

            {/* Step: Confirm */}
            {withdrawStep === "confirm" && (
              <>
                <div className="rounded-xl border border-border divide-y divide-border">
                  {[
                    { label: "Withdraw to", value: selectedWithdrawMethod.label },
                    { label: "Account number", value: accountNumber },
                    { label: "Account name", value: accountName },
                    { label: "Amount", value: formatPHP(withdrawAmount) },
                    { label: "Processing time", value: "1–2 banking days" },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between px-4 py-3">
                      <span className="text-xs text-muted-foreground">{row.label}</span>
                      <span className="text-xs font-semibold text-foreground">{row.value}</span>
                    </div>
                  ))}
                </div>

                {withdrawError && (
                  <div className="flex items-center gap-2 rounded-xl bg-danger-50 border border-danger-200 px-3 py-2.5">
                    <AlertCircle className="h-4 w-4 text-danger-500 shrink-0" />
                    <p className="text-xs text-danger-700">{withdrawError}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setWithdrawStep("account")}
                    className="flex-1 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    Back
                  </button>
                  <Button size="md" className="flex-1" loading={withdrawLoading} onClick={handleWithdrawConfirm}>
                    Confirm Withdrawal
                  </Button>
                </div>
              </>
            )}

            {/* Step: Done */}
            {withdrawStep === "done" && (
              <div className="text-center py-4 space-y-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-100 mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-success-600" />
                </div>
                <div>
                  <p className="font-display text-base font-bold text-foreground">{formatPHP(withdrawAmount)} on its way!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sent to {selectedWithdrawMethod.label} ···{accountNumber.slice(-4)} · Arrives in 1–2 banking days
                  </p>
                </div>
                <Button size="md" className="w-full" onClick={closeWithdraw}>Done</Button>
              </div>
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
