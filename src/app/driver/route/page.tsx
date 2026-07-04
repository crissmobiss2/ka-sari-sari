"use client";

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

const TOTAL_STOPS = STOPS.length;
const DONE_STOPS = STOPS.filter(s => s.status === "done").length;
const PROGRESS_PCT = Math.round((DONE_STOPS / TOTAL_STOPS) * 100);

// Next pending stop
const nextStop = STOPS.find(s => s.status === "pending");

// Estimated finish time — assume 25 min per remaining stop
const remainingStops = TOTAL_STOPS - DONE_STOPS;
const finishMs = Date.now() + remainingStops * 25 * 60 * 1000;
const finishTime = new Intl.DateTimeFormat("en-PH", { hour: "2-digit", minute: "2-digit" }).format(new Date(finishMs));

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

export default function RoutePage() {
  const gmapsUrl = nextStop
    ? `https://maps.google.com/?q=${encodeURIComponent(nextStop.address)}`
    : "https://maps.google.com";

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
