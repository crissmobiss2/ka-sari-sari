"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Wifi, WifiOff, CheckCircle2, AlertTriangle, RefreshCw, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface NotificationTemplate {
  id: string;
  label: string;
  description: string;
  preview: string;
  defaultOn: boolean;
}

interface OptOutRetailer {
  id: string;
  name: string;
  phone: string;
  optedOutDate: string;
}

// ── Static data ───────────────────────────────────────────────────────────────

const TEMPLATES: NotificationTemplate[] = [
  {
    id: "order_confirmed",
    label: "Order Confirmed",
    description: "Sent when a retailer's order is accepted and being processed.",
    preview:
      "Hi {name}! ✅ Your order {orderId} has been confirmed. We'll start packing your items and deliver in 2-3 days. Track: kasarisari.app/orders/{orderId}",
    defaultOn: true,
  },
  {
    id: "out_for_delivery",
    label: "Out for Delivery",
    description: "Sent when the driver picks up the order and is headed to the store.",
    preview:
      "Hi {name}! 🛵 Your order {orderId} is on the way! Driver {driverName} is headed to your store. ETA: {eta}. Call: {driverPhone}",
    defaultOn: true,
  },
  {
    id: "delivered",
    label: "Delivered",
    description: "Sent after the driver marks the delivery as complete.",
    preview:
      "Hi {name}! 📦 Order {orderId} has been delivered! Please confirm receipt and leave a review. Thank you for ordering from Ka Sari-Sari!",
    defaultOn: true,
  },
  {
    id: "payment_received",
    label: "Payment Received",
    description: "Sent when GCash, Maya, or bank transfer payment is confirmed.",
    preview:
      "Hi {name}! 💳 Payment of ₱{amount} received for order {orderId}. Reference: {ref}",
    defaultOn: false,
  },
  {
    id: "low_stock_alert",
    label: "Low Stock Alert",
    description: "Notifies retailers when their frequently ordered items are running low.",
    preview:
      "Hi {name}! ⚠️ Some items you regularly order are running low. Restock now before they sell out: kasarisari.app/catalog",
    defaultOn: false,
  },
  {
    id: "weekly_deals",
    label: "Weekly Deals",
    description: "Weekly promotional broadcast for deals and discounts.",
    preview:
      "Hi {name}! 🎁 This week's exclusive deals are live! Up to 30% off on selected items. Shop now: kasarisari.app/deals",
    defaultOn: false,
  },
];

const OPT_OUT_RETAILERS: OptOutRetailer[] = [
  { id: "1", name: "Dela Cruz Store",        phone: "+63 917 XXX 1234", optedOutDate: "Jan 14, 2026" },
  { id: "2", name: "Mang Bert's Tindahan",   phone: "+63 918 XXX 5678", optedOutDate: "Jan 19, 2026" },
  { id: "3", name: "Sunshine General Store", phone: "+63 920 XXX 9012", optedOutDate: "Feb 2, 2026"  },
];

const USAGE_STATS = [
  { label: "Messages Sent This Month", value: "1,284",  sub: "July 2026"    },
  { label: "Delivered",                value: "98.7%",  sub: "delivery rate" },
  { label: "Read Rate",                value: "84.2%",  sub: "of delivered"  },
  { label: "Opt-outs",                 value: "3",      sub: "this month"    },
];

// Dummy values for the live preview bubble
const PREVIEW_MESSAGE =
  "Hi Aling Nena! ✅ Your order #KSS-20260705 has been confirmed. We'll start packing your items and deliver in 2-3 days. Track: kasarisari.app/orders/KSS-20260705";

// ── Toggle Switch ──────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`Toggle ${label}`}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
        "transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
        checked ? "bg-brand-500" : "bg-surface-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm",
          "transform transition-transform duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

// ── WhatsApp Logo SVG ──────────────────────────────────────────────────────────

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ── Phone Preview ──────────────────────────────────────────────────────────────

function WhatsAppPreview() {
  return (
    <div className="flex flex-col items-center">
      {/* Phone shell */}
      <div className="w-72 rounded-[2rem] border-4 border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <span className="text-[10px] font-semibold text-white/70">9:41</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-white/70">●●●</span>
          </div>
        </div>

        {/* WhatsApp chat header */}
        <div className="flex items-center gap-2.5 bg-[#075E54] px-3 py-2.5">
          {/* Avatar */}
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500">
            <WhatsAppIcon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight">Ka Sari-Sari</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="rounded bg-[#00a884]/30 px-1.5 py-px text-[9px] font-bold text-[#00a884] uppercase tracking-wide">
                Business
              </span>
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="bg-[#e5ddd5] px-3 py-4 min-h-[200px]">
          {/* Date chip */}
          <div className="flex justify-center mb-3">
            <span className="rounded-full bg-white/80 px-3 py-0.5 text-[10px] text-zinc-500 shadow-sm">
              Today
            </span>
          </div>

          {/* Message bubble */}
          <div className="flex justify-start">
            <div className="relative max-w-[85%]">
              <div className="rounded-2xl rounded-tl-none bg-white px-3.5 py-2.5 shadow-sm">
                <p className="text-[12px] text-zinc-800 leading-relaxed break-words">
                  {PREVIEW_MESSAGE}
                </p>
                <p className="mt-1.5 text-right text-[10px] text-zinc-400">
                  9:41 AM ✓✓
                </p>
              </div>
              {/* Tail */}
              <div
                className="absolute -left-1.5 top-0 h-3 w-2 bg-white"
                style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
              />
            </div>
          </div>
        </div>

        {/* Input bar placeholder */}
        <div className="flex items-center gap-2 bg-[#f0f0f0] px-3 py-2">
          <div className="flex-1 rounded-full bg-white px-4 py-1.5">
            <p className="text-[11px] text-zinc-400">Message</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#075E54]">
            <WhatsAppIcon className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground text-center max-w-xs">
        Live preview — showing Order Confirmed template with sample data
      </p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function WhatsAppSettingsPage() {
  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected">("disconnected");
  const isConnected = connectionStatus === "connected";
  const [showApiKey, setShowApiKey] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("+63 2 8XXX XXXX");
  const [apiKey, setApiKey] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [connectMessage, setConnectMessage] = useState("");

  // Template toggles — initialised from defaultOn
  const [templateEnabled, setTemplateEnabled] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(TEMPLATES.map((t) => [t.id, t.defaultOn]))
  );

  // Opt-out re-enabled set
  const [reEnabled, setReEnabled] = useState<Set<string>>(new Set());

  // Load saved phone number (non-secret) from server on mount
  useEffect(() => {
    fetch("/api/admin/settings/whatsapp")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.phoneNumber) setPhoneNumber(data.phoneNumber);
        if (data?.connectionStatus) setConnectionStatus(data.connectionStatus);
      })
      .catch(() => {});
    // Note: API key is never loaded back to the client after saving — treat it as write-only.
  }, []);

  async function handleSaveChanges() {
    if (!phoneNumber.trim() || !apiKey.trim()) {
      setSaveMessage("Please fill in the phone number and API key before saving.");
      setTimeout(() => setSaveMessage(""), 3000);
      return;
    }
    setIsSaving(true);
    setSaveMessage("");
    try {
      const res = await fetch("/api/admin/settings/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // API key is sent over HTTPS to the server; never stored in localStorage.
        body: JSON.stringify({ phoneNumber, apiKey }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaveMessage("Settings saved");
      setApiKey(""); // clear the field after saving — treat as write-once
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      setSaveMessage(err instanceof Error ? err.message : "Failed to save settings");
      setTimeout(() => setSaveMessage(""), 5000);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConnect() {
    setIsConnecting(true);
    setConnectMessage("");
    try {
      const res = await fetch("/api/admin/settings/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setConnectionStatus("connected");
      setConnectMessage("Connected successfully");
      setTimeout(() => setConnectMessage(""), 3000);
    } catch (err) {
      setConnectMessage(err instanceof Error ? err.message : "Connection failed");
      setTimeout(() => setConnectMessage(""), 5000);
    } finally {
      setIsConnecting(false);
    }
  }

  async function handleTestConnection() {
    setIsTesting(true);
    setTestMessage("");
    try {
      const res = await fetch("/api/admin/settings/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTestMessage("Connection test passed");
      setTimeout(() => setTestMessage(""), 3000);
    } catch (err) {
      setTestMessage(err instanceof Error ? err.message : "Test failed");
      setTimeout(() => setTestMessage(""), 5000);
    } finally {
      setIsTesting(false);
    }
  }

  function toggleTemplate(id: string, val: boolean) {
    setTemplateEnabled((prev) => ({ ...prev, [id]: val }));
  }

  function handleReEnable(id: string) {
    setReEnabled((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">WhatsApp Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Configure your WhatsApp Business API and notification templates</p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span className={cn(
              "text-sm font-medium",
              saveMessage === "Settings saved" ? "text-success-600" : "text-amber-600"
            )}>
              {saveMessage}
            </span>
          )}
          <Button size="sm" onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* ── Connection Status Card ────────────────────────────────────────────── */}
      <Card className="rounded-2xl border border-border bg-card shadow-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-xl",
                isConnected ? "bg-success-50" : "bg-amber-50"
              )}>
                {isConnected
                  ? <Wifi className="h-4 w-4 text-success-600" />
                  : <WifiOff className="h-4 w-4 text-amber-600" />
                }
              </div>
              <div>
                <CardTitle className="text-base">WhatsApp Business API</CardTitle>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isConnected ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-success-600" />
                      <span className="text-xs font-medium text-success-600">Connected</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-3 w-3 text-amber-600" />
                      <span className="text-xs font-medium text-amber-600">Not Connected</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {!isConnected && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700">
                  WhatsApp notifications are <span className="font-semibold">disabled</span> until the API is connected.
                </p>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="wa-phone">
                Business Phone Number
              </label>
              <Input
                id="wa-phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+63 2 8XXX XXXX"
              />
              <p className="text-xs text-muted-foreground">Philippine format: +63 2 8XXX XXXX</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="wa-api-key">
                API Key
              </label>
              <Input
                id="wa-api-key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your WhatsApp Business API key"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowApiKey((v) => !v)}
                    className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showApiKey ? "Hide API key" : "Show API key"}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <p className="text-xs text-muted-foreground">Get this from your Meta Business Manager</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={isTesting}>
              {isTesting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Testing…
                </>
              ) : (
                "Test Connection"
              )}
            </Button>
            {testMessage && (
              <span className="text-sm font-medium text-success-600">{testMessage}</span>
            )}
            {!isConnected && (
              <Button size="sm" onClick={handleConnect} disabled={isConnecting}>
                {isConnecting ? "Connecting..." : "Connect WhatsApp Business API"}
              </Button>
            )}
            {connectMessage && (
              <span className="text-sm font-medium text-success-600">{connectMessage}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Two-column layout: Templates + Preview ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Notification Templates — takes 3 of 5 columns */}
        <div className="lg:col-span-3 space-y-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Notification Templates</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Enable or disable each notification type sent to retailers.</p>
          </div>

          {TEMPLATES.map((tpl) => {
            const enabled = templateEnabled[tpl.id] ?? false;
            return (
              <Card
                key={tpl.id}
                className={cn(
                  "rounded-2xl border border-border bg-card shadow-card transition-opacity",
                  !enabled && "opacity-60"
                )}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{tpl.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tpl.description}</p>
                    </div>
                    <ToggleSwitch
                      checked={enabled}
                      onChange={(val) => toggleTemplate(tpl.id, val)}
                      label={tpl.label}
                    />
                  </div>

                  {/* Preview box */}
                  <div className="rounded-xl bg-surface-50 border border-border/60 px-3.5 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Message Preview
                    </p>
                    <p className="text-xs text-foreground/80 leading-relaxed font-mono">{tpl.preview}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Live Preview — takes 2 of 5 columns */}
        <div className="lg:col-span-2">
          <div className="sticky top-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Live Preview</h2>
              <p className="text-sm text-muted-foreground mt-0.5 mb-4">How messages appear on WhatsApp.</p>
            </div>
            <WhatsAppPreview />
          </div>
        </div>
      </div>

      {/* ── Usage Stats Row ───────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Usage This Month</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {USAGE_STATS.map((stat) => (
            <Card key={stat.label} className="rounded-2xl border border-border bg-card shadow-card">
              <CardContent className="p-5">
                <p className="font-display text-2xl font-bold text-foreground leading-none">{stat.value}</p>
                <p className="text-xs font-medium text-foreground mt-2">{stat.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Opt-out Management ────────────────────────────────────────────────── */}
      <Card className="rounded-2xl border border-border bg-card shadow-card">
        <CardHeader className="pb-3">
          <div>
            <CardTitle className="text-base">Opt-out Management</CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Retailers who unsubscribed from WhatsApp notifications. Re-enabling requires their consent.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-0">
          {OPT_OUT_RETAILERS.map((retailer, i) => {
            const isReEnabled = reEnabled.has(retailer.id);
            return (
              <div
                key={retailer.id}
                className={cn(
                  "flex items-center justify-between gap-4 py-3.5",
                  i < OPT_OUT_RETAILERS.length - 1 && "border-b border-border"
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{retailer.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">{retailer.phone}</span>
                    <span className="text-muted-foreground/40 text-xs">·</span>
                    <span className="text-xs text-muted-foreground">Opted out {retailer.optedOutDate}</span>
                  </div>
                </div>

                {isReEnabled ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success-50 border border-success-500/20 px-2.5 py-0.5 text-xs font-medium text-success-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Re-enabled
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleReEnable(retailer.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-50 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-100 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Re-enable
                  </button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

    </div>
  );
}
