"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatPHP } from "@/lib/utils";
import { ROUTES } from "@/lib/mock-data";

const route = ROUTES[0]; // Caloocan North

// 6 mock stops using real order data + supplementary entries
const STOPS = [
  {
    stopNumber: 1,
    customer: "Maria Santos",
    area: "Brgy. 5, Caloocan",
    orderNumber: "KSS-2025-00142",
    total: 1500,
    paymentMethod: "gcash",
    status: "done" as const,
    address: "123 Rizal St., Barangay 5, Caloocan City",
  },
  {
    stopNumber: 2,
    customer: "Roberto Cruz",
    area: "Brgy. 8, Caloocan",
    orderNumber: "KSS-2025-00141",
    total: 2320,
    paymentMethod: "cod",
    status: "done" as const,
    address: "45 Mabini Ave., Barangay 8, Caloocan City",
  },
  {
    stopNumber: 3,
    customer: "Lina Reyes",
    area: "Brgy. 5, Caloocan",
    orderNumber: "KSS-2025-00138",
    total: 1970,
    paymentMethod: "gcash",
    status: "done" as const,
    address: "78 Del Pilar Ext., Barangay 5, Caloocan City",
  },
  {
    stopNumber: 4,
    customer: "Fernando Delos Reyes",
    area: "Brgy. Bagong Barrio, Caloocan",
    orderNumber: "KSS-2025-00139",
    total: 940,
    paymentMethod: "maya",
    status: "done" as const,
    address: "88 Sampaguita St., Brgy. Bagong Barrio, Caloocan",
  },
  {
    stopNumber: 5,
    customer: "Alejandra Bautista",
    area: "Brgy. 10, Caloocan",
    orderNumber: "KSS-2025-00137",
    total: 1840,
    paymentMethod: "gcash",
    status: "done" as const,
    address: "32 Luna St., Barangay 10, Caloocan City",
  },
  {
    stopNumber: 6,
    customer: "Danilo Torres",
    area: "Brgy. 12, Caloocan",
    orderNumber: "KSS-2025-00140",
    total: 2160,
    paymentMethod: "cod",
    status: "pending" as const,
    address: "15 Malaya Road, Barangay 12, Caloocan City",
  },
  {
    stopNumber: 7,
    customer: "Cristina Villanueva",
    area: "Brgy. 14, Caloocan",
    orderNumber: "KSS-2025-00143",
    total: 1060,
    paymentMethod: "gcash",
    status: "pending" as const,
    address: "67 Bonifacio St., Barangay 14, Caloocan City",
  },
  {
    stopNumber: 8,
    customer: "Eduardo Mendoza",
    area: "Brgy. 18, Caloocan",
    orderNumber: "KSS-2025-00144",
    total: 3280,
    paymentMethod: "cod",
    status: "pending" as const,
    address: "100 Katipunan Ave., Barangay 18, Caloocan City",
  },
];

// SVG coordinates for each stop (index-matched to STOPS)
const STOP_COORDS: [number, number][] = [
  [60, 220],   // Stop 1
  [120, 180],  // Stop 2
  [90, 130],   // Stop 3
  [160, 100],  // Stop 4
  [230, 140],  // Stop 5
  [300, 110],  // Stop 6 (next)
  [340, 160],  // Stop 7
  [310, 220],  // Stop 8
];

const TOTAL_STOPS = STOPS.length;
const DONE_STOPS = STOPS.filter(s => s.status === "done").length;
const PROGRESS_PCT = Math.round((DONE_STOPS / TOTAL_STOPS) * 100);

// Next pending stop
const nextStop = STOPS.find(s => s.status === "pending");

// Estimated finish time — assume 25 min per remaining stop
const remainingStops = TOTAL_STOPS - DONE_STOPS;
const finishMs = Date.now() + remainingStops * 25 * 60 * 1000;
const finishTime = new Intl.DateTimeFormat("en-PH", { hour: "2-digit", minute: "2-digit" }).format(new Date(finishMs));

type StopData = typeof STOPS[number];

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function NavIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}

// ── Route Map ────────────────────────────────────────────────────────────────

interface RouteMapProps {
  onStopClick: (stop: StopData) => void;
}

function RouteMap({ onStopClick }: RouteMapProps) {
  return (
    <div className="relative">
      {/* Pulse animation styles */}
      <style>{`
        @keyframes pulse-ring {
          0%   { r: 13; opacity: 0.9; }
          50%  { r: 17; opacity: 0.4; }
          100% { r: 13; opacity: 0.9; }
        }
        .map-pulse { animation: pulse-ring 1.6s ease-in-out infinite; }
      `}</style>

      <svg
        viewBox="0 0 400 280"
        width="100%"
        style={{ background: "#f8fafc", display: "block", borderRadius: "12px" }}
        role="img"
        aria-label="Visual delivery route map"
      >
        {/* ── Background street grid ── */}
        {/* Horizontal streets */}
        <line x1="0" y1="100" x2="400" y2="100" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
        <line x1="0" y1="160" x2="400" y2="160" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
        <line x1="0" y1="220" x2="400" y2="220" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
        {/* Vertical streets */}
        <line x1="80"  y1="0" x2="80"  y2="280" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
        <line x1="160" y1="0" x2="160" y2="280" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
        <line x1="240" y1="0" x2="240" y2="280" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
        <line x1="320" y1="0" x2="320" y2="280" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
        {/* Diagonal connector road */}
        <line x1="80" y1="220" x2="320" y2="100" stroke="#e2e8f0" strokeWidth="4" strokeLinecap="round" />

        {/* ── Route path lines ── */}
        {STOPS.slice(0, -1).map((stop, i) => {
          const [x1, y1] = STOP_COORDS[i];
          const [x2, y2] = STOP_COORDS[i + 1];
          const isDone = stop.status === "done" && STOPS[i + 1].status === "done";
          const isActive = stop.status === "done" && STOPS[i + 1].status === "pending";
          return (
            <line
              key={`route-${i}`}
              x1={x1} y1={y1}
              x2={x2} y2={y2}
              stroke={isDone || isActive ? "#f47028" : "#cbd5e1"}
              strokeWidth={isDone || isActive ? 3 : 2.5}
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
          );
        })}

        {/* ── Stop markers ── */}
        {STOPS.map((stop, i) => {
          const [cx, cy] = STOP_COORDS[i];
          const isDone = stop.status === "done";
          const isNext = stop.stopNumber === nextStop?.stopNumber;
          const isPending = stop.status === "pending" && !isNext;

          return (
            <g
              key={`stop-${stop.stopNumber}`}
              style={isPending || isNext ? { cursor: "pointer" } : { cursor: "default" }}
              onClick={() => {
                if (stop.status === "pending") onStopClick(stop);
              }}
              role={stop.status === "pending" ? "button" : undefined}
              aria-label={stop.status === "pending" ? `View stop ${stop.stopNumber}: ${stop.customer}` : undefined}
            >
              {/* Pulse ring for next stop */}
              {isNext && (
                <circle
                  className="map-pulse"
                  cx={cx}
                  cy={cy}
                  r={13}
                  fill="none"
                  stroke="#f47028"
                  strokeWidth={2.5}
                  opacity={0.5}
                />
              )}

              {/* Main circle */}
              <circle
                cx={cx}
                cy={cy}
                r={10}
                fill={isDone ? "#dcfce7" : isNext ? "#f47028" : "#f1f5f9"}
                stroke={isDone ? "#22c55e" : isNext ? "#c95c1c" : "#94a3b8"}
                strokeWidth={isDone ? 2 : isNext ? 0 : 1.5}
              />

              {/* Checkmark for done stops */}
              {isDone && (
                <path
                  d={`M ${cx - 4} ${cy} l 3 3 l 5 -5`}
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Stop number for pending/next */}
              {!isDone && (
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fontSize={8}
                  fontWeight="bold"
                  fill={isNext ? "#ffffff" : "#64748b"}
                  style={{ fontFamily: "system-ui, sans-serif", userSelect: "none" }}
                >
                  {stop.stopNumber}
                </text>
              )}

              {/* Barangay label below each stop */}
              <text
                x={cx}
                y={cy + 22}
                textAnchor="middle"
                fontSize={7}
                fill={isDone ? "#94a3b8" : isNext ? "#f47028" : "#64748b"}
                style={{ fontFamily: "system-ui, sans-serif", userSelect: "none" }}
              >
                {stop.area.length > 14 ? stop.area.slice(0, 13) + "…" : stop.area}
              </text>
            </g>
          );
        })}

        {/* ── Compass Rose (top-right) ── */}
        <g transform="translate(372, 22)">
          {/* Outer ring */}
          <circle cx={0} cy={0} r={14} fill="white" stroke="#cbd5e1" strokeWidth={1} />
          {/* N arrow (pointing up) */}
          <polygon points="0,-10 -3,-2 0,-5 3,-2" fill="#f47028" />
          {/* S arrow (pointing down, gray) */}
          <polygon points="0,10 -3,2 0,5 3,2" fill="#94a3b8" />
          {/* E dot */}
          <text x={7} y={3} fontSize={5} fill="#64748b" textAnchor="middle" style={{ fontFamily: "system-ui, sans-serif" }}>E</text>
          {/* W dot */}
          <text x={-7} y={3} fontSize={5} fill="#64748b" textAnchor="middle" style={{ fontFamily: "system-ui, sans-serif" }}>W</text>
          {/* N label */}
          <text x={0} y={-13} fontSize={6} fontWeight="bold" fill="#f47028" textAnchor="middle" style={{ fontFamily: "system-ui, sans-serif" }}>N</text>
        </g>
      </svg>
    </div>
  );
}

// ── Stop Popup ───────────────────────────────────────────────────────────────

interface StopPopupProps {
  stop: StopData;
  onClose: () => void;
}

function StopPopup({ stop, onClose }: StopPopupProps) {
  const gmapsUrl = `https://maps.google.com/?q=${encodeURIComponent(stop.address)}`;
  const isNext = stop.stopNumber === nextStop?.stopNumber;

  return (
    <div className="mx-0 mb-3 rounded-2xl border border-brand-200 bg-brand-50/60 p-3.5 relative">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-full bg-surface-100 text-muted-foreground hover:bg-surface-200 transition-colors"
        aria-label="Close stop info"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-brand-500 text-white text-xs font-bold flex-shrink-0">
          {stop.stopNumber}
        </span>
        <p className="font-semibold text-sm text-foreground leading-tight pr-6">{stop.customer}</p>
        {isNext && (
          <Badge variant="default" className="text-2xs px-1.5 py-0 flex-shrink-0">Next</Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-1">{stop.address}</p>
      <p className="text-xs text-muted-foreground mb-3">{stop.area} · {formatPHP(stop.total)}</p>

      <a href={gmapsUrl} target="_blank" rel="noopener noreferrer">
        <Button size="sm" className="w-full h-8 text-xs font-semibold rounded-xl gap-1.5">
          <NavIcon />
          Navigate →
        </Button>
      </a>
    </div>
  );
}

// ── Map Legend ───────────────────────────────────────────────────────────────

function MapLegend() {
  return (
    <div className="flex items-center justify-center gap-4 mt-2 px-1">
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-green-100 border-2 border-green-500 flex-shrink-0" />
        <span className="text-2xs text-muted-foreground">Delivered</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-brand-500 flex-shrink-0" />
        <span className="text-2xs text-muted-foreground">Next Stop</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full bg-slate-100 border-2 border-slate-300 flex-shrink-0" />
        <span className="text-2xs text-muted-foreground">Pending</span>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RoutePage() {
  const [selectedStop, setSelectedStop] = useState<StopData | null>(null);

  const gmapsUrl = nextStop
    ? `https://maps.google.com/?q=${encodeURIComponent(nextStop.address)}`
    : "https://maps.google.com";

  const handleStopClick = (stop: StopData) => {
    setSelectedStop(prev => (prev?.stopNumber === stop.stopNumber ? null : stop));
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 border-b border-border">
        <div className="flex items-start justify-between mb-1">
          <h1 className="font-display text-xl font-bold text-foreground">{route.name}</h1>
          <Badge variant="default">Active</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{route.distance} · {route.estimatedDuration} est.</p>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span className="font-medium">{DONE_STOPS} of {TOTAL_STOPS} stops complete</span>
            <span className="font-bold text-brand-600">{PROGRESS_PCT}%</span>
          </div>
          <div className="h-2.5 bg-brand-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: `${PROGRESS_PCT}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
            <span>{remainingStops} stops remaining</span>
            <span>Est. finish: {finishTime}</span>
          </div>
        </div>
      </div>

      {/* ── Visual Route Map ── */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Route Map</p>
          <p className="text-2xs text-muted-foreground">Tap a pending stop for details</p>
        </div>

        {/* Stop info popup — appears above map when stop selected */}
        {selectedStop && (
          <StopPopup stop={selectedStop} onClose={() => setSelectedStop(null)} />
        )}

        <RouteMap onStopClick={handleStopClick} />
        <MapLegend />
      </div>

      {/* Navigate to next stop CTA */}
      {nextStop && (
        <div className="px-4 pt-4 pb-2">
          <a href={gmapsUrl} target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="w-full h-14 text-base font-semibold rounded-2xl gap-2.5 shadow-brand">
              <NavIcon />
              Navigate to Stop {nextStop.stopNumber}
            </Button>
          </a>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {nextStop.customer} · {nextStop.area}
          </p>
        </div>
      )}

      {/* Stop list */}
      <div className="px-4 py-4 flex flex-col gap-3">
        {STOPS.map((stop) => {
          const isDone = stop.status === "done";
          const isNext = stop.stopNumber === nextStop?.stopNumber;
          const isCOD = stop.paymentMethod === "cod";

          return (
            <Card
              key={stop.stopNumber}
              className={cn(
                "p-4 transition-all",
                isNext && "border-brand-300 bg-brand-50/40",
                isDone && "opacity-70"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Stop number circle */}
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                  isDone
                    ? "bg-success-50 border-2 border-success-500"
                    : isNext
                    ? "bg-brand-500 shadow-brand"
                    : "bg-surface-100 border-2 border-surface-200"
                )}>
                  {isDone ? (
                    <CheckIcon className="w-4 h-4 text-success-600" />
                  ) : (
                    <span className={cn(
                      "font-display text-sm font-bold",
                      isNext ? "text-white" : "text-surface-600"
                    )}>
                      {stop.stopNumber}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className={cn(
                        "font-semibold text-sm leading-tight truncate",
                        isDone ? "text-muted-foreground line-through" : "text-foreground"
                      )}>
                        {stop.customer}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{stop.area}</p>
                    </div>
                    {/* Status icon */}
                    <div className="flex-shrink-0">
                      {isDone ? (
                        <div className="w-5 h-5 rounded-full bg-success-50 flex items-center justify-center">
                          <CheckIcon className="w-3 h-3 text-success-600" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-surface-100 flex items-center justify-center">
                          <ClockIcon className="w-3 h-3 text-surface-400" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">{stop.orderNumber}</p>
                    <div className="flex items-center gap-1.5">
                      {isCOD && !isDone && (
                        <span className="text-2xs font-semibold text-brand-600 bg-brand-50 border border-brand-200 px-1.5 py-0.5 rounded-md">
                          COD
                        </span>
                      )}
                      <span className={cn(
                        "text-sm font-bold tabular-nums",
                        isCOD && !isDone ? "text-brand-500" : "text-foreground"
                      )}>
                        {formatPHP(stop.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
