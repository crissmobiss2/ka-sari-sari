"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User, Store, CreditCard, Bell, HelpCircle, LogOut,
  ChevronRight, Shield, ShieldCheck, Check, Clock, Heart, Wallet, Tag,
  BellRing, BellOff, AlertCircle, CheckCircle2, X, Loader2,
  TrendingUp, DollarSign,
} from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { useWalletStore } from "@/store/wallet";
import { useFavoritesStore } from "@/store/favorites";
import { formatPHP, cn } from "@/lib/utils";

// ── Credit score constants ─────────────────────────────────────────────────────

const CREDIT_SCORE = 724;
const CREDIT_SCORE_MAX = 850;
const CREDIT_SCORE_MIN = 300;
const CREDIT_LIMIT = 15000;
const CREDIT_USED = 3200;
const CREDIT_AVAILABLE = CREDIT_LIMIT - CREDIT_USED;
const CREDIT_UTILIZATION = (CREDIT_USED / CREDIT_LIMIT) * 100;

// ── Gauge arc helpers ─────────────────────────────────────────────────────────

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

const scorePct = (CREDIT_SCORE - CREDIT_SCORE_MIN) / (CREDIT_SCORE_MAX - CREDIT_SCORE_MIN);
const needleAngle = 180 - scorePct * 180;

const BG_ARC = describeArc(75, 80, 60, 180, 0);
const SCORE_ARC = describeArc(75, 80, 60, 180, needleAngle);

const DEFAULT_SCORE_FACTORS: { label: string; pct: number; grade: string; color: string }[] = [
  { label: "Payment History", pct: 95, grade: "Excellent", color: "#22c55e" },
  { label: "Order Frequency", pct: 78, grade: "Good", color: "#f47028" },
  { label: "Account Age", pct: 62, grade: "Building", color: "#f59e0b" },
];

// ── Push subscription utilities ───────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

// ── Credit application type ────────────────────────────────────────────────────

interface CreditApplication {
  id: string;
  requested_limit: number;
  requested_terms: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  approved_limit?: number;
  rejection_reason?: string;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const router = useRouter();
  const walletBalance = useWalletStore((s) => s.balance);
  const favCount = useFavoritesStore((s) => s.items.length);

  const [creditData, setCreditData] = useState({
    score: CREDIT_SCORE,
    limit: CREDIT_LIMIT,
    used: CREDIT_USED,
    available: CREDIT_AVAILABLE,
    utilization: CREDIT_UTILIZATION,
  });
  const [subDaysLeft, setSubDaysLeft] = useState<number | null>(null);
  const [subIsActive, setSubIsActive] = useState<boolean | null>(null); // null = not yet loaded

  const [userInfo, setUserInfo] = useState({
    displayName: "Maria Santos",
    phone: "+63 917 123 4567",
    storeName: "Santos Sari-Sari Store · Caloocan City",
    initial: "M",
  });

  // ── Push notification state ───────────────────────────────────────────────

  const [pushSupported, setPushSupported]   = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [isPushEnabled, setIsPushEnabled]   = useState(false);
  const [pushLoading, setPushLoading]       = useState(false);
  const [vapidKey, setVapidKey]             = useState("");
  const [pushError, setPushError]           = useState("");
  const [pushSuccess, setPushSuccess]       = useState("");

  // ── Credit application state ──────────────────────────────────────────────

  const [scoreFactors, setScoreFactors] = useState(DEFAULT_SCORE_FACTORS);
  const [creditApplications, setCreditApplications] = useState<CreditApplication[]>([]);
  const [showCreditForm, setShowCreditForm]         = useState(false);
  const [creditLoading, setCreditLoading]           = useState(false);
  const [creditSubmitted, setCreditSubmitted]       = useState(false);
  const [creditError, setCreditError]               = useState("");
  const [creditForm, setCreditForm] = useState({
    requestedLimit: "",
    monthlyRevenue: "",
    yearsInBusiness: "",
  });

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => { if (!res.ok) return null; return res.json(); })
      .then((data) => {
        if (!data) return;
        setUserInfo({
          displayName: data.displayName ?? data.name ?? userInfo.displayName,
          phone: data.phone ?? userInfo.phone,
          storeName: data.storeName ?? userInfo.storeName,
          initial: (data.displayName ?? data.name ?? userInfo.displayName).charAt(0).toUpperCase(),
        });
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch subscription info
  useEffect(() => {
    fetch("/api/user/subscription")
      .then((r) => { if (!r.ok) return null; return r.json(); })
      .then((data) => {
        const sub = data?.subscription;
        setSubIsActive(sub?.status === "active");
        if (sub?.daysLeft !== undefined) setSubDaysLeft(sub.daysLeft);
      })
      .catch(() => { setSubIsActive(false); });
  }, []);

  // Check push support and fetch VAPID key
  useEffect(() => {
    const supported = "Notification" in window && "serviceWorker" in navigator;
    setPushSupported(supported);
    if (!supported) return;

    setPushPermission(Notification.permission);

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription()
    ).then((sub) => {
      setIsPushEnabled(!!sub);
    }).catch(() => {});

    // Fetch VAPID public key
    fetch("/api/user/push-subscription")
      .then((r) => r.json())
      .then((data) => { if (data.vapidPublicKey) setVapidKey(data.vapidPublicKey); })
      .catch(() => {});
  }, []);

  // Fetch existing credit applications and live credit standing
  useEffect(() => {
    fetch("/api/user/credit")
      .then((r) => { if (!r.ok) return null; return r.json(); })
      .then((data) => {
        if (data?.applications) setCreditApplications(data.applications);
        if (Array.isArray(data?.scoreFactors) && data.scoreFactors.length > 0) {
          setScoreFactors(data.scoreFactors);
        }
        // Update credit score widget with real values if provided
        if (data?.score !== undefined) {
          const score = data.score ?? CREDIT_SCORE;
          const limit = data.limit ?? CREDIT_LIMIT;
          const used = data.used ?? CREDIT_USED;
          const available = limit - used;
          setCreditData({
            score,
            limit,
            used,
            available,
            utilization: limit > 0 ? (used / limit) * 100 : 0,
          });
        }
      })
      .catch(() => {});
  }, [creditSubmitted]); // re-fetch after submission

  // ── Push notification handlers ────────────────────────────────────────────

  async function handleEnablePush() {
    if (!pushSupported || !vapidKey) {
      setPushError("Push notifications are not available right now.");
      return;
    }
    setPushLoading(true);
    setPushError("");
    setPushSuccess("");
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission !== "granted") {
        setPushError("Permission denied. Please enable notifications in your browser settings.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const res = await fetch("/api/user/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
      if (!res.ok) throw new Error("Failed to save subscription");
      setIsPushEnabled(true);
      setPushSuccess("Push notifications enabled!");
      setTimeout(() => setPushSuccess(""), 3000);
    } catch (err) {
      setPushError(err instanceof Error ? err.message : "Failed to enable notifications.");
    } finally {
      setPushLoading(false);
    }
  }

  async function handleDisablePush() {
    setPushLoading(true);
    setPushError("");
    setPushSuccess("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/user/push-subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setIsPushEnabled(false);
      setPushSuccess("Push notifications disabled.");
      setTimeout(() => setPushSuccess(""), 3000);
    } catch {
      setPushError("Failed to disable notifications.");
    } finally {
      setPushLoading(false);
    }
  }

  // ── Credit application handler ────────────────────────────────────────────

  async function handleCreditSubmit(e: React.FormEvent) {
    e.preventDefault();
    const requestedLimit = parseInt(creditForm.requestedLimit.replace(/[^0-9]/g, ""), 10);
    if (!requestedLimit || requestedLimit < 500) {
      setCreditError("Minimum credit request is ₱500");
      return;
    }
    setCreditLoading(true);
    setCreditError("");
    try {
      const res = await fetch("/api/user/credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedLimit,
          requestedTerms: 7,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreditError(data.error ?? "Failed to submit application.");
        return;
      }
      setCreditSubmitted(true);
      setShowCreditForm(false);
      setCreditForm({ requestedLimit: "", monthlyRevenue: "", yearsInBusiness: "" });
    } catch {
      setCreditError("Network error. Please try again.");
    } finally {
      setCreditLoading(false);
    }
  }

  // ── Status badge helper ───────────────────────────────────────────────────

  function statusBadge(status: CreditApplication["status"]) {
    const styles = {
      pending: "bg-warning-50 dark:bg-warning-500/10 border-warning-200 text-warning-700 dark:text-foreground",
      approved: "bg-success-50 dark:bg-success-500/10 border-success-200 text-success-700 dark:text-foreground",
      rejected: "bg-danger-50 dark:bg-danger-500/10 border-danger-200 text-danger-700 dark:text-foreground",
    };
    return (
      <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-bold capitalize", styles[status])}>
        {status}
      </span>
    );
  }

  // ── Menu items ────────────────────────────────────────────────────────────

  const menuItems = [
    { label: "Store Profile", description: "Manage your store details", href: "/account/store", icon: Store },
    { label: "Subscription", description: "Active · Renews Jul 6, 2027", href: "/account/subscription", icon: CreditCard },
    { label: "My Wallet", description: `Balance: ${formatPHP(walletBalance)}`, href: "/wallet", icon: Wallet },
    { label: "Saved Items", description: `${favCount} saved ${favCount === 1 ? "product" : "products"}`, href: "/favorites", icon: Heart },
    { label: "Today's Deals", description: "Exclusive discounts for you", href: "/deals", icon: Tag },
    { label: "Notifications", description: "Manage alerts and updates", href: "/notifications", icon: Bell },
    { label: "Help & Support", description: "FAQs, contact, and tickets", href: "/support", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar title="Account" />

      <div className="px-4 py-5 space-y-5">
        {/* Profile card */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-foreground text-2xl font-black shrink-0">
              {userInfo.initial}
            </div>
            <div>
              <p className="font-display text-base font-bold text-foreground">{userInfo.displayName}</p>
              <p className="text-sm text-muted-foreground">{userInfo.phone}</p>
              <p className="text-sm text-muted-foreground">{userInfo.storeName}</p>
            </div>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/wallet" className="rounded-2xl border border-border bg-card shadow-card p-4 hover:border-brand-200 active:scale-95 transition-all">
            <p className="text-xs text-muted-foreground mb-1">Wallet Balance</p>
            <p className="text-xl font-black text-brand-500">{formatPHP(walletBalance)}</p>
          </Link>
          <Link href="/favorites" className="rounded-2xl border border-border bg-card shadow-card p-4 hover:border-brand-200 active:scale-95 transition-all">
            <p className="text-xs text-muted-foreground mb-1">Saved Items</p>
            <p className="text-xl font-black text-foreground">{favCount}</p>
          </Link>
        </div>

        {/* Credit Score card */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
                <ShieldCheck className="h-4 w-4 text-brand-700 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Credit Standing</p>
                <p className="text-xs text-muted-foreground">Ka Sari-Sari Credit Score</p>
              </div>
            </div>
            <span className="rounded-full bg-success-50 dark:bg-success-500/10 border border-success-200 px-2.5 py-0.5 text-xs font-bold text-success-700 dark:text-foreground">
              Good Standing
            </span>
          </div>

          {/* Score gauge */}
          <div className="flex flex-col items-center mb-4">
            <svg viewBox="0 0 150 90" width={150} height={90} aria-label={`Credit score ${creditData.score} out of ${CREDIT_SCORE_MAX}`}>
              <path d={BG_ARC} fill="none" stroke="#e5e7eb" strokeWidth={12} strokeLinecap="round" />
              <path d={SCORE_ARC} fill="none" stroke="#22c55e" strokeWidth={12} strokeLinecap="round" />
              <text x="75" y="70" textAnchor="middle" fontSize="22" fontWeight="800" fill="currentColor" className="fill-foreground">
                {creditData.score}
              </text>
              <text x="75" y="83" textAnchor="middle" fontSize="9" fill="#6b7280">
                / {CREDIT_SCORE_MAX}
              </text>
            </svg>
            <p className="text-xs font-black tracking-widest text-success-600 dark:text-success-500 -mt-1">GOOD</p>
          </div>

          {/* Score breakdown */}
          <div className="space-y-2.5 mb-4">
            {scoreFactors.map(({ label, pct, grade, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xs font-bold" style={{ color }}>{grade}</p>
                </div>
                <div className="h-1.5 rounded-full bg-surface-200 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Credit limit row */}
          <div className="rounded-xl bg-surface-50 dark:bg-surface-900 border border-border px-4 py-3 flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground">Credit Limit</p>
              <p className="text-lg font-black text-surface-900">₱{creditData.limit.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Used</p>
              <p className="text-base font-bold text-brand-500">₱{creditData.used.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Available</p>
              <p className="text-base font-bold text-success-600 dark:text-success-500">₱{creditData.available.toLocaleString()}</p>
            </div>
          </div>

          {/* Credit utilization bar */}
          <div className="mt-2.5">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[11px] text-muted-foreground">Credit utilization</p>
              <p className="text-[11px] font-semibold text-muted-foreground">{creditData.utilization.toFixed(1)}% used</p>
            </div>
            <div className="h-1.5 rounded-full bg-success-100 dark:bg-success-500/20 overflow-hidden">
              <div className="h-full rounded-full bg-brand-50 dark:bg-brand-500/100 transition-all" style={{ width: `${creditData.utilization}%` }} />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground mt-3">
            Your credit score improves with consistent payments and regular ordering. Score updates monthly.
          </p>
        </div>

        {/* ── Credit Application Section ─────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
              <TrendingUp className="h-4 w-4 text-brand-700 dark:text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Credit Line</p>
              <p className="text-xs text-muted-foreground">Apply for additional credit</p>
            </div>
          </div>

          {/* Existing applications */}
          {creditApplications.length > 0 && (
            <div className="space-y-2">
              {creditApplications.map((app) => (
                <div key={app.id} className="rounded-xl border border-border bg-surface-50 dark:bg-surface-900 px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-surface-900">
                      ₱{app.requested_limit.toLocaleString()} requested
                    </p>
                    {statusBadge(app.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Submitted {new Date(app.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  {app.status === "approved" && app.approved_limit && (
                    <p className="text-xs text-success-600 dark:text-success-500 font-medium mt-0.5">
                      Approved: ₱{app.approved_limit.toLocaleString()} · {app.requested_terms ?? 7}-day terms
                    </p>
                  )}
                  {app.status === "rejected" && app.rejection_reason && (
                    <p className="text-xs text-danger-600 dark:text-danger-500 mt-0.5">{app.rejection_reason}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Success after submission */}
          {creditSubmitted && (
            <div className="flex items-start gap-3 rounded-xl bg-success-50 dark:bg-success-500/10 border border-success-200 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-success-600 dark:text-success-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-success-700 dark:text-foreground">Application submitted!</p>
                <p className="text-xs text-success-600 dark:text-success-500 mt-0.5">We'll review within 24 hours and notify you of the decision.</p>
              </div>
            </div>
          )}

          {/* Apply button or form */}
          {!showCreditForm && !creditSubmitted && (
            <button
              onClick={() => { setShowCreditForm(true); setCreditError(""); }}
              className="w-full rounded-xl border border-brand-200 bg-brand-50 dark:bg-brand-500/10 py-3 text-sm font-semibold text-brand-600 dark:text-foreground hover:bg-brand-100 transition-colors flex items-center justify-center gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Apply for Credit Line
            </button>
          )}

          {/* Credit application form */}
          {showCreditForm && (
            <form onSubmit={handleCreditSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Credit Application</p>
                <button
                  type="button"
                  onClick={() => { setShowCreditForm(false); setCreditError(""); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Requested Credit Limit (₱) <span className="text-danger-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₱</span>
                    <input
                      type="number"
                      required
                      min={500}
                      value={creditForm.requestedLimit}
                      onChange={(e) => { setCreditForm(f => ({ ...f, requestedLimit: e.target.value })); setCreditError(""); }}
                      placeholder="e.g. 10000"
                      className="h-11 w-full rounded-xl border border-input bg-background pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Minimum ₱500 · 7-day payment terms</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Monthly Revenue (₱)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">₱</span>
                    <input
                      type="number"
                      min={0}
                      value={creditForm.monthlyRevenue}
                      onChange={(e) => setCreditForm(f => ({ ...f, monthlyRevenue: e.target.value }))}
                      placeholder="e.g. 50000"
                      className="h-11 w-full rounded-xl border border-input bg-background pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Years in Business
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={creditForm.yearsInBusiness}
                    onChange={(e) => setCreditForm(f => ({ ...f, yearsInBusiness: e.target.value }))}
                    placeholder="e.g. 3"
                    className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {creditError && (
                <div className="flex items-center gap-2 rounded-xl bg-danger-50 dark:bg-danger-500/10 border border-danger-200 px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 text-danger-500 shrink-0" />
                  <p className="text-xs text-danger-700 dark:text-foreground">{creditError}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowCreditForm(false); setCreditError(""); }}
                  className="flex-1 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creditLoading || !creditForm.requestedLimit}
                  className="flex-1 rounded-xl bg-brand-50 dark:bg-brand-500/100 py-3 text-sm font-bold text-white hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creditLoading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                  ) : (
                    "Submit Application"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Subscription status */}
        {subIsActive ? (
          <div className="rounded-2xl border border-success-500/25 bg-success-50 dark:bg-success-500/10 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success-100 dark:bg-success-500/20 text-success-600 dark:text-success-500">
                <Shield className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-success-700 dark:text-foreground">Active Subscription</p>
                <p className="text-xs text-success-600 dark:text-foreground mt-0.5">Platform access · Free Trial · Year 1</p>
                <div className="flex items-center gap-2 mt-2">
                  <Check className="h-3.5 w-3.5 text-success-500" />
                  <span className="text-xs text-success-600 dark:text-foreground">Unlimited orders</span>
                  <span className="text-success-300">·</span>
                  <Clock className="h-3 w-3 text-success-500" />
                  <span className="text-xs text-success-600 dark:text-foreground">{subDaysLeft !== null ? subDaysLeft : '—'} days left</span>
                </div>
              </div>
            </div>
          </div>
        ) : subIsActive === false ? (
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800">
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">No Subscription</p>
                <p className="text-xs text-muted-foreground mt-0.5">Ka Sari-Sari Platform Access</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── Push Notifications Section ──────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10">
              <BellRing className="h-4 w-4 text-brand-700 dark:text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Push Notifications</p>
              <p className="text-xs text-muted-foreground">Get real-time order and delivery alerts</p>
            </div>
          </div>

          {!pushSupported ? (
            <div className="flex items-start gap-2 rounded-xl bg-surface-100 dark:bg-surface-800 border border-border px-3 py-3">
              <BellOff className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Push notifications are not supported in your browser. Use Chrome on Android or iOS for the best experience.
              </p>
            </div>
          ) : (
            <>
              {/* Permission status */}
              <div className="flex items-center justify-between rounded-xl bg-surface-50 dark:bg-surface-900 border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-surface-900">
                    {isPushEnabled ? "Notifications enabled" : "Notifications disabled"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Browser permission: <span className={cn("font-semibold capitalize",
                      pushPermission === "granted" ? "text-success-600 dark:text-success-500" :
                      pushPermission === "denied" ? "text-danger-500" : "text-muted-foreground"
                    )}>{pushPermission}</span>
                  </p>
                </div>
                {/* Toggle */}
                <button
                  onClick={isPushEnabled ? handleDisablePush : handleEnablePush}
                  disabled={pushLoading || pushPermission === "denied"}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
                    isPushEnabled ? "bg-brand-50 dark:bg-brand-500/100" : "bg-surface-300"
                  )}
                  aria-label={isPushEnabled ? "Disable push notifications" : "Enable push notifications"}
                >
                  {pushLoading ? (
                    <Loader2 className="absolute left-1/2 -translate-x-1/2 h-3.5 w-3.5 animate-spin text-white" />
                  ) : (
                    <span className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                      isPushEnabled ? "translate-x-6" : "translate-x-1"
                    )} />
                  )}
                </button>
              </div>

              {pushPermission === "denied" && (
                <p className="text-xs text-muted-foreground">
                  Notifications are blocked. Go to your browser settings to allow them.
                </p>
              )}

              {pushError && (
                <div className="flex items-center gap-2 rounded-xl bg-danger-50 dark:bg-danger-500/10 border border-danger-200 px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 text-danger-500 shrink-0" />
                  <p className="text-xs text-danger-700 dark:text-foreground">{pushError}</p>
                </div>
              )}

              {pushSuccess && (
                <div className="flex items-center gap-2 rounded-xl bg-success-50 dark:bg-success-500/10 border border-success-200 px-3 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-success-600 dark:text-success-500 shrink-0" />
                  <p className="text-xs text-success-700 dark:text-foreground">{pushSuccess}</p>
                </div>
              )}

              <div className="space-y-1.5">
                {[
                  "Order confirmed and dispatched",
                  "Driver is 1 stop away",
                  "Delivery completed",
                  "Credit application updates",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", isPushEnabled ? "bg-success-50 dark:bg-success-500/100" : "bg-surface-300")} />
                    <span className="text-xs text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Menu */}
        <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden divide-y divide-border">
          {menuItems.map(({ label, description, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-4 px-5 py-4 hover:bg-muted transition-colors active:bg-muted"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-100 dark:bg-surface-800 text-muted-foreground">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground truncate">{description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={async () => {
            try {
              await fetch("/api/auth/logout", { method: "POST" });
            } catch {
              // proceed to login regardless
            }
            router.push("/login");
          }}
          className="flex w-full items-center gap-3 rounded-2xl border border-danger-500/20 bg-danger-50 dark:bg-danger-500/10 px-5 py-4 text-danger-600 dark:text-foreground hover:bg-danger-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-semibold">Sign out</span>
        </button>

        <p className="text-center text-xs text-muted-foreground pb-2">Ka Sari-Sari v1.0.0 · Made with love in the Philippines</p>
      </div>

      <RetailerBottomNav />
    </div>
  );
}
