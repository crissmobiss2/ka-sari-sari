"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Truck, Phone, CheckCircle2, Clock, Package, ArrowLeft,
  ChevronRight, MessageCircle, Share2, Radio, MapPin,
} from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { NexoflowFooter } from "@/components/ui/nexoflow-footer";
import { cn } from "@/lib/utils";

// ── Data ──────────────────────────────────────────────────────────────────────

const ORDER = {
  number: "KSS-2026-00219",
  status: "out_for_delivery" as const,
  placedAt: "8:30 AM",
  estimatedDelivery: "11:20 AM – 12:00 PM",
  items: [
    { name: "Coca-Cola Regular 330ml", qty: 24, unit: "pcs" },
    { name: "Lucky Me! Pancit Canton",  qty: 48, unit: "pcs" },
    { name: "555 Sardines Tomato 155g", qty: 24, unit: "pcs" },
  ],
  total: 2850,
  paymentMethod: "COD",
};

const DRIVER = {
  name: "Rodrigo Delos Santos",
  phone: "+63 917 555 0101",
  whatsapp: "639175550101",
  vehicle: "Mitsubishi L300 · XYZ 1234",
  rating: 4.9,
  deliveries: 559,
};

const STOPS = [
  { key: "depot", label: "Warehouse",        address: "NCR Hub, Valenzuela City",                   eta: "9:15 AM",   status: "done"    as const },
  { key: "s1",    label: "Stop 1",           address: "Santos Store, 42 Rizal Ave., Caloocan",       eta: "10:45 AM",  status: "done"    as const },
  { key: "s2",    label: "Stop 2 — Current", address: "Dela Cruz Tindahan, 18 Gov. Drive, Malabon", eta: "10:52 AM",  status: "current" as const },
  { key: "s3",    label: "Your Store ★",      address: "123 Kamuning Road, Quezon City",              eta: "~11:35 AM", status: "yours"   as const },
  { key: "s4",    label: "Stop 4",           address: "Tan Variety, 89 E. Rodriguez, Quezon City",   eta: "~12:05 PM", status: "future"  as const },
];

const INITIAL_UPDATES = [
  { time: "9:15 AM",  text: "Order dispatched from NCR Hub, Valenzuela",    type: "info"      as const },
  { time: "10:20 AM", text: "Driver Rodrigo picked up your order",           type: "info"      as const },
  { time: "10:45 AM", text: "Delivered Stop 1 — Santos Store, Caloocan ✓",  type: "success"   as const },
  { time: "10:52 AM", text: "Now delivering at Stop 2 — Dela Cruz Tindahan",type: "info"      as const },
  { time: "11:02 AM", text: "Your store is next! ETA ~33 minutes",          type: "highlight" as const },
];

type Stage = "confirmed" | "picking" | "packed" | "out_for_delivery" | "delivered";
const STAGE_ORDER: Stage[] = ["confirmed", "picking", "packed", "out_for_delivery", "delivered"];
const STAGES: { key: Stage; label: string; sublabel: string }[] = [
  { key: "confirmed",        label: "Order Confirmed",  sublabel: "Received at 8:30 AM" },
  { key: "picking",          label: "Items Picked",     sublabel: "Completed at 9:00 AM" },
  { key: "packed",           label: "Order Packed",     sublabel: "Completed at 9:10 AM" },
  { key: "out_for_delivery", label: "Out for Delivery", sublabel: "Driver on route" },
  { key: "delivered",        label: "Delivered",        sublabel: "Awaiting delivery" },
];

// ── Live Location Section ─────────────────────────────────────────────────────

interface DriverLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  updatedAt?: string;
}

function LiveLocationSection({ location }: { location: DriverLocation | null }) {
  if (!location) return null;

  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div className="mx-4 rounded-2xl border border-border bg-card shadow-card overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-brand-500" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Driver GPS</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
          </span>
          <span className="text-[11px] text-success-600 font-semibold">Live</span>
        </div>
      </div>

      {mapsKey ? (
        <iframe
          title="Driver live location"
          width="100%"
          height="220"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${location.lat},${location.lng}&zoom=15`}
          style={{ border: 0, display: "block" }}
          allowFullScreen
        />
      ) : (
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3 rounded-xl bg-surface-50 border border-border px-4 py-3">
            <MapPin className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground">Current GPS Coordinates</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {location.lat.toFixed(6)}°N, {location.lng.toFixed(6)}°E
              </p>
              {location.heading != null && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Heading: {Math.round(location.heading)}° · Speed: {location.speed != null ? `${Math.round(location.speed)} km/h` : "—"}
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Driver is approximately nearby · Real-time tracking active
          </p>
        </div>
      )}

      <div className="px-4 py-2.5 border-t border-border">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Driver is approximately nearby</span>
          {location.updatedAt
            ? ` · Updated ${new Date(location.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : " · Updated just now"
          }
        </p>
      </div>
    </div>
  );
}

// ── Route Map SVG ─────────────────────────────────────────────────────────────

function RouteMap() {
  return (
    <div className="mx-4 rounded-2xl overflow-hidden border border-border bg-card shadow-card">
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Live Route</p>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
          </span>
          <span className="text-[11px] text-success-600 font-semibold">Tracking Active</span>
        </div>
      </div>

      <div className="p-3 bg-gradient-to-b from-sky-50 to-card dark:from-sky-950/20 dark:to-card">
        <svg viewBox="0 0 340 108" style={{ width: "100%", height: "auto" }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="trackSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
          </defs>
          <rect width="340" height="108" fill="url(#trackSky)" rx="8" />

          {/* Buildings (decorative) */}
          <rect x="4"   y="26" width="14" height="46" rx="2" fill="#e2e8f0" opacity="0.65" />
          <rect x="21"  y="36" width="10" height="36" rx="2" fill="#e2e8f0" opacity="0.55" />
          <rect x="60"  y="20" width="18" height="52" rx="2" fill="#e2e8f0" opacity="0.65" />
          <rect x="81"  y="30" width="10" height="42" rx="2" fill="#e2e8f0" opacity="0.50" />
          <rect x="114" y="28" width="16" height="44" rx="2" fill="#e2e8f0" opacity="0.60" />
          <rect x="195" y="22" width="20" height="50" rx="2" fill="#e2e8f0" opacity="0.65" />
          <rect x="219" y="32" width="12" height="40" rx="2" fill="#e2e8f0" opacity="0.50" />
          <rect x="264" y="26" width="14" height="46" rx="2" fill="#e2e8f0" opacity="0.60" />
          <rect x="301" y="24" width="18" height="48" rx="2" fill="#e2e8f0" opacity="0.65" />

          {/* Ground & road */}
          <rect x="0" y="78" width="340" height="30" fill="#dde1e7" />
          <rect x="0" y="80" width="340" height="20" fill="#cbd5e1" />
          <line x1="0" y1="80"  x2="340" y2="80"  stroke="#b0bac8" strokeWidth="0.8" />
          <line x1="0" y1="100" x2="340" y2="100" stroke="#b0bac8" strokeWidth="0.8" />
          <line x1="0" y1="90"  x2="340" y2="90"  stroke="white" strokeWidth="1.5" strokeDasharray="14 10" />

          {/* Completed route (orange tint) */}
          <rect x="0" y="82" width="168" height="16" fill="#f47028" opacity="0.45" rx="1" />

          {/* Driveways */}
          <rect x="68"  y="64" width="5" height="18" fill="#b8c0cc" opacity="0.9" />
          <rect x="152" y="60" width="5" height="22" fill="#f47028" opacity="0.5" />
          <rect x="246" y="54" width="5" height="28" fill="#f47028" opacity="0.35" />
          <rect x="318" y="64" width="5" height="18" fill="#b8c0cc" opacity="0.9" />

          {/* Warehouse origin */}
          <circle cx="22" cy="90" r="5" fill="#94a3b8" />
          <rect x="6" y="53" width="32" height="12" rx="3" fill="#64748b" />
          <text x="22" y="62" textAnchor="middle" fontSize="6.5" fill="white" fontWeight="bold">DEPOT</text>

          {/* Stop 1 — done */}
          <circle cx="70" cy="90" r="8" fill="#22c55e" />
          <text x="70" y="93.5" textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">✓</text>
          <rect x="52" y="49" width="36" height="13" rx="4" fill="#16a34a" />
          <text x="70" y="58.5" textAnchor="middle" fontSize="7.5" fill="white" fontWeight="bold">Stop 1</text>
          <text x="70" y="71" textAnchor="middle" fontSize="6.5" fill="#64748b">Done</text>

          {/* Stop 2 — current (pulse ring) */}
          <circle cx="154" cy="90" fill="none" stroke="#f47028" strokeWidth="2.5">
            <animate attributeName="r" values="10;19;10" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="154" cy="90" r="9" fill="#f47028" />
          <text x="154" y="93.5" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">NOW</text>
          <rect x="126" y="45" width="56" height="14" rx="4" fill="#ea580c" />
          <text x="154" y="55" textAnchor="middle" fontSize="7.5" fill="white" fontWeight="bold">Delivering</text>

          {/* Stop 3 — YOUR STORE */}
          <circle cx="248" cy="90" r="11" fill="white" stroke="#f47028" strokeWidth="2.5" />
          <text x="248" y="94.5" textAnchor="middle" fontSize="11" fill="#f47028">★</text>
          <rect x="212" y="38" width="72" height="15" rx="5" fill="#f47028" />
          <text x="248" y="48.5" textAnchor="middle" fontSize="7.5" fill="white" fontWeight="bold">Your Store</text>
          <text x="248" y="68" textAnchor="middle" fontSize="7" fill="#f47028" fontWeight="bold">↑ NEXT</text>

          {/* Stop 4 — future */}
          <circle cx="320" cy="90" r="6" fill="#cbd5e1" />
          <text x="320" y="105" textAnchor="middle" fontSize="6.5" fill="#94a3b8">Stop 4</text>

          {/* Animated Truck at Stop 2 */}
          <g>
            <animateTransform attributeName="transform" type="translate" values="0,0; 3,0; 0,0" dur="3s" repeatCount="indefinite" />
            <rect x="148" y="74" width="18" height="12" rx="1.5" fill="#f47028" />
            <text x="157" y="82.5" textAnchor="middle" fontSize="5" fill="white" fontWeight="bold">KSS</text>
            <rect x="134" y="77" width="14" height="9" rx="1.5" fill="#ea580c" />
            <rect x="135" y="78" width="10" height="5.5" rx="1" fill="#bae6fd" opacity="0.9" />
            <circle cx="138" cy="87" r="2.5" fill="#1e293b" /><circle cx="138" cy="87" r="1" fill="#64748b" />
            <circle cx="160" cy="87" r="2.5" fill="#1e293b" /><circle cx="160" cy="87" r="1" fill="#64748b" />
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="px-4 pb-3 flex items-center gap-4 flex-wrap">
        {[
          { dot: "bg-success-500", label: "Done" },
          { dot: "bg-brand-500 animate-pulse", label: "Current" },
          { dot: "bg-white border-2 border-brand-500", label: "Your Store" },
          { dot: "bg-surface-300", label: "Upcoming" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", l.dot)} />
            <span className="text-[10px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ETA Card ──────────────────────────────────────────────────────────────────

function EtaCard({ estimatedDelivery = ORDER.estimatedDelivery }: { estimatedDelivery?: string }) {
  const [mins, setMins] = useState(33);
  useEffect(() => {
    const t = setInterval(() => setMins((m) => Math.max(0, m - 1)), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mx-4 rounded-2xl bg-brand-500 text-white p-5 shadow-brand">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="h-4 w-4 opacity-80" />
            <p className="text-sm font-semibold opacity-90">Driver heading to you</p>
          </div>
          <div className="flex items-end gap-2">
            <p className="font-display text-5xl font-black leading-none">{mins}</p>
            <p className="text-xl font-medium opacity-80 mb-1">min</p>
          </div>
          <p className="text-sm text-brand-100 mt-1">{estimatedDelivery}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="rounded-xl bg-white/15 px-3 py-2.5 text-center min-w-[56px]">
            <p className="font-display text-2xl font-black">1</p>
            <p className="text-[11px] opacity-80 leading-tight">stop<br />away</p>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] opacity-70">Route progress</span>
          <span className="text-[11px] opacity-70">~65% complete</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full" style={{ width: "65%" }} />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] opacity-60">
          <span>Warehouse</span>
          <span>Your Store</span>
        </div>
      </div>
    </div>
  );
}

// ── Driver Card ───────────────────────────────────────────────────────────────

function DriverCard({ driver = DRIVER }: { driver?: typeof DRIVER }) {
  const [called, setCalled] = useState(false);
  const waLink = `https://wa.me/${driver.whatsapp}?text=Hi%20po%2C%20waiting%20po%20sa%20delivery.`;

  return (
    <div className="mx-4 rounded-2xl border border-border bg-card shadow-card">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your Driver</p>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-bold text-lg">
            {driver.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">{driver.name}</p>
            <p className="text-xs text-muted-foreground">{driver.vehicle}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-warning-500 font-medium">★ {driver.rating}</span>
              <span className="text-[11px] text-muted-foreground">{driver.deliveries} deliveries</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <a
            href={`tel:${driver.phone}`}
            onClick={() => setCalled(true)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border py-3 transition-colors",
              called
                ? "border-success-200 bg-success-50 text-success-600"
                : "border-brand-200 bg-brand-50 text-brand-600 hover:bg-brand-100"
            )}
          >
            <Phone className="h-4 w-4" />
            <span className="text-[11px] font-semibold">Call</span>
          </a>
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-1.5 rounded-xl border border-success-200 bg-success-50 py-3 text-success-600 hover:bg-success-100 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-[11px] font-semibold">WhatsApp</span>
          </a>
          <button
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.share) {
                navigator.share({ title: "Track my KSS delivery", url: window.location.href });
              } else if (typeof navigator !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-muted py-3 text-muted-foreground hover:bg-surface-200 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            <span className="text-[11px] font-semibold">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Route Stops Breakdown ─────────────────────────────────────────────────────

function StopsBreakdown() {
  return (
    <div className="mx-4 rounded-2xl border border-border bg-card overflow-hidden shadow-card">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <MapPin className="h-3.5 w-3.5 text-brand-500" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Route Breakdown</p>
      </div>
      <div className="divide-y divide-border">
        {STOPS.map((stop, i) => (
          <div
            key={stop.key}
            className={cn("flex items-start gap-3 px-4 py-3",
              stop.status === "yours"   && "bg-brand-50/60",
              stop.status === "current" && "bg-warning-50/40"
            )}
          >
            <div className="flex flex-col items-center gap-0.5 mt-0.5">
              <div className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                stop.status === "done"    ? "bg-success-500 text-white" :
                stop.status === "current" ? "bg-brand-500 text-white" :
                stop.status === "yours"   ? "border-2 border-brand-500 bg-white text-brand-500" :
                "bg-surface-200 text-muted-foreground"
              )}>
                {stop.status === "done" ? "✓" : stop.status === "current" ? "●" : stop.status === "yours" ? "★" : "○"}
              </div>
              {i < STOPS.length - 1 && (
                <div className={cn("w-0.5 h-5", stop.status === "done" ? "bg-success-300" : "bg-border")} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={cn("text-sm font-semibold leading-tight",
                  stop.status === "current" || stop.status === "yours" ? "text-brand-600" :
                  stop.status === "future"  ? "text-muted-foreground" : "text-foreground"
                )}>
                  {stop.label}
                </p>
                <span className={cn("text-[11px] shrink-0 tabular-nums font-medium",
                  stop.status === "done"    ? "text-success-600" :
                  stop.status === "current" ? "text-brand-500" : "text-muted-foreground"
                )}>
                  {stop.eta}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{stop.address}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Live Updates ──────────────────────────────────────────────────────────────

function LiveUpdates({ extraUpdates = [] }: { extraUpdates?: typeof INITIAL_UPDATES }) {
  const [updates, setUpdates] = useState(INITIAL_UPDATES);
  const absorbedLen = useRef(0);

  useEffect(() => {
    if (extraUpdates.length > absorbedLen.current) {
      const newOnes = extraUpdates.slice(absorbedLen.current);
      absorbedLen.current = extraUpdates.length;
      setUpdates((prev) => [...prev, ...newOnes]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extraUpdates.length]);

  // Real status updates come from the Supabase Realtime channel subscription below

  return (
    <div className="mx-4 rounded-2xl border border-border bg-card overflow-hidden shadow-card">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-3.5 w-3.5 text-brand-500" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Live Updates</p>
        </div>
        <span className="text-[10px] text-muted-foreground">{updates.length} updates</span>
      </div>
      <div className="divide-y divide-border max-h-52 overflow-y-auto">
        {[...updates].reverse().map((u, i) => (
          <div
            key={i}
            className={cn("px-4 py-2.5 flex items-start gap-3",
              u.type === "highlight" && "bg-brand-50/50",
              u.type === "success"   && "bg-success-50/40"
            )}
          >
            <span className="text-[11px] text-muted-foreground shrink-0 w-16 tabular-nums pt-0.5">{u.time}</span>
            <p className={cn("text-[11px] flex-1 leading-relaxed",
              u.type === "highlight" ? "text-brand-600 font-semibold" :
              u.type === "success"   ? "text-success-600 font-medium" :
              "text-foreground"
            )}>
              {u.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Status Tracker ────────────────────────────────────────────────────────────

function StatusTracker({ liveStatus }: { liveStatus?: string }) {
  const currentIdx = STAGE_ORDER.indexOf((liveStatus as Stage) ?? ORDER.status);
  return (
    <div className="mx-4 bg-card border border-border rounded-2xl p-5 shadow-card">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Order Progress</p>
      {STAGES.map((stage, i) => {
        const stageIdx  = STAGE_ORDER.indexOf(stage.key);
        const isDone    = stageIdx < currentIdx;
        const isCurrent = stageIdx === currentIdx;
        const isPending = stageIdx > currentIdx;
        return (
          <div key={stage.key} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 z-10",
                isDone    ? "bg-success-500 border-success-500" :
                isCurrent ? "bg-brand-500 border-brand-500" :
                             "bg-card border-border"
              )}>
                {isDone    ? <CheckCircle2 className="h-4 w-4 text-white" /> :
                 isCurrent ? <Truck className="h-4 w-4 text-white" /> :
                              <div className="h-2.5 w-2.5 rounded-full bg-border" />}
              </div>
              {i < STAGES.length - 1 && (
                <div className={cn("w-0.5 flex-1 my-0.5 min-h-[18px]", isDone ? "bg-success-400" : "bg-border")} />
              )}
            </div>
            <div className={cn("pb-5 flex-1", i === STAGES.length - 1 && "pb-0")}>
              <p className={cn("text-sm font-semibold leading-none",
                isCurrent ? "text-brand-600" : isPending ? "text-muted-foreground" : "text-foreground"
              )}>
                {stage.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{stage.sublabel}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TrackingPage() {
  const [driverId, setDriverId]             = useState<string | null>(null);
  const [orderId, setOrderId]               = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [liveStatus, setLiveStatus]         = useState<string | undefined>(undefined);
  const [liveOrderNum, setLiveOrderNum]     = useState<string | null>(null);
  const [realtimeUpdates, setRealtimeUpdates] = useState<typeof INITIAL_UPDATES>([]);
  const [orderData, setOrderData] = useState<{
    number: string; estimatedDelivery: string;
    items: typeof ORDER.items; total: number; paymentMethod: string;
  } | null>(null);

  // Resolve URL params: ?orderId=...&driverId=...
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const did = params.get("driverId");
      const oid = params.get("orderId");
      if (did) setDriverId(did);
      if (oid) setOrderId(oid);
    }
  }, []);

  // Fetch order data when orderId is known
  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.order) {
          setLiveStatus(d.order.status);
          setLiveOrderNum(d.order.orderNumber ?? d.order.order_number ?? null);
          const rawItems = d.order.items as Array<{ productName?: string; name?: string; quantity?: number; qty?: number; unit?: string }> | undefined;
          setOrderData({
            number: d.order.orderNumber ?? d.order.order_number ?? ORDER.number,
            estimatedDelivery: ORDER.estimatedDelivery,
            items: rawItems?.length
              ? rawItems.map((i) => ({ name: i.productName ?? i.name ?? "", qty: i.quantity ?? i.qty ?? 1, unit: i.unit ?? "pcs" }))
              : ORDER.items,
            total: Number(d.order.total) || ORDER.total,
            paymentMethod: d.order.paymentMethod ?? d.order.payment_method ?? ORDER.paymentMethod,
          });
        }
      })
      .catch(() => {});
  }, [orderId]);

  // Supabase Realtime subscription — live order status
  useEffect(() => {
    if (!orderId) return;
    const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnon) return;

    let channel: { unsubscribe: () => void } | null = null;

    import("@supabase/supabase-js")
      .then(({ createClient }) => {
        const client = createClient(supabaseUrl, supabaseAnon);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ch = (client.channel(`order-status-${orderId}`) as any)
          .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` },
            (payload: { new: { status?: string } }) => {
              const newStatus = payload.new?.status;
              if (newStatus) {
                setLiveStatus(newStatus);
                const now = new Date().toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });
                const statusLabels: Record<string, string> = {
                  picking:          "Warehouse is picking your items",
                  packed:           "Order packed — ready for dispatch",
                  dispatched:       "Driver assigned — order dispatched",
                  out_for_delivery: "Order is out for delivery!",
                  delivered:        "Order delivered successfully ✓",
                  cancelled:        "Order was cancelled",
                };
                const text = statusLabels[newStatus] ?? `Order status updated: ${newStatus}`;
                setRealtimeUpdates((prev) => [
                  ...prev,
                  { time: now, text, type: (newStatus === "delivered" ? "success" : "highlight") as "success" | "highlight" },
                ]);
              }
            }
          )
          .subscribe();
        channel = ch;
      })
      .catch(() => {});

    return () => { channel?.unsubscribe(); };
  }, [orderId]);

  // Poll driver location every 10 seconds
  useEffect(() => {
    if (!driverId) return;

    async function fetchLocation() {
      try {
        const res = await fetch(`/api/driver/location?driverId=${encodeURIComponent(driverId!)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.location) {
          setDriverLocation(data.location);
        }
      } catch {
        // Silently ignore network errors — keep showing last known location
      }
    }

    fetchLocation();
    const interval = setInterval(fetchLocation, 10_000);
    return () => clearInterval(interval);
  }, [driverId]);

  // If no orderId was provided via URL, show an empty/redirect state instead of fake data
  if (typeof window !== "undefined" && !orderId && !new URLSearchParams(window.location.search).get("orderId")) {
    // This block intentionally left — the useEffect below sets orderId from URL
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <RetailerTopBar title="Live Tracking" />

      {/* When no orderId is present, show a prompt to navigate to an order */}
      {!orderId ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center gap-4">
          <Truck className="h-12 w-12 text-muted-foreground/40" />
          <h2 className="font-display text-lg font-bold text-foreground">No order selected</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Open a specific order to track its live delivery status.
          </p>
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            View My Orders
          </Link>
        </div>
      ) : (
      <div className="py-4 space-y-4">
        <div className="px-4">
          <Link href="/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> {liveOrderNum ?? ORDER.number}
          </Link>
        </div>

        {/* Live GPS section — only shown when real coordinates are available */}
        <LiveLocationSection location={driverLocation} />

        <RouteMap />
        <EtaCard estimatedDelivery={(orderData ?? ORDER).estimatedDelivery} />
        <DriverCard />
        <StopsBreakdown />
        <LiveUpdates extraUpdates={realtimeUpdates} />
        <StatusTracker liveStatus={liveStatus} />

        {/* Order summary */}
        <div className="mx-4 rounded-2xl border border-border bg-card overflow-hidden shadow-card">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Package className="h-4 w-4 text-brand-500" />
            <p className="text-sm font-semibold text-foreground">Order Summary</p>
          </div>
          <div className="divide-y divide-border">
            {(orderData ?? ORDER).items.map((item) => (
              <div key={item.name} className="px-4 py-3 flex items-center justify-between">
                <p className="text-sm text-foreground">{item.name}</p>
                <span className="text-xs font-semibold text-muted-foreground">{item.qty} {item.unit}</span>
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-border flex justify-between items-center bg-surface-50">
            <span className="text-sm text-muted-foreground">Total · {(orderData ?? ORDER).paymentMethod}</span>
            <span className="text-sm font-bold text-foreground">₱{(orderData ?? ORDER).total.toLocaleString()}</span>
          </div>
        </div>

        {/* COD notice */}
        {(orderData ?? ORDER).paymentMethod === "COD" && (
          <div className="mx-4 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 flex items-start gap-3">
            <Clock className="h-4 w-4 text-warning-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-warning-700 mb-0.5">Prepare Cash on Delivery</p>
              <p className="text-xs text-warning-600 leading-relaxed">
                Have <strong>₱{(orderData ?? ORDER).total.toLocaleString()} cash</strong> ready when the driver arrives.
                Payment is collected on delivery.
              </p>
            </div>
          </div>
        )}

        {/* Support */}
        <Link
          href="/support"
          className="mx-4 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:bg-muted transition-colors"
        >
          <p className="text-sm text-foreground font-medium">Issue with this order?</p>
          <span className="text-xs text-brand-500 font-semibold flex items-center gap-1">
            Get help <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>
      )}

      <NexoflowFooter className="mx-4 my-2" />
      <RetailerBottomNav />
    </div>
  );
}
