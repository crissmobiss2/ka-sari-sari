"use client";
import { useState } from "react";
import { MapPin, Search, Globe, Truck, Users, TrendingUp, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { NEXOFLOW_CITIES, getCitiesByHub, HUB_STATS, type NexoflowCity } from "@/lib/nexoflow-cities";

// Mock retailer counts per city for demo
const RETAILER_COUNTS: Record<string, number> = {
  "Caloocan": 34, "Quezon City": 28, "Marikina": 19, "Pasig": 15, "Manila": 22,
  "Makati": 11, "Taguig": 9, "Valenzuela": 18, "Malabon": 12, "Navotas": 8,
  "Mandaluyong": 7, "Las Piñas": 6, "Parañaque": 5, "Muntinlupa": 4, "Pasay": 3,
  "San Juan": 4, "Antipolo": 8, "Bacoor": 6, "Cavite City": 3, "San Jose del Monte": 5,
  "Malolos": 4, "Meycauayan": 3, "Biñan": 2, "Santa Rosa": 4, "Calamba": 3,
  "Dasmariñas": 2, "Cebu City": 12, "Mandaue": 8, "Lapu-Lapu": 5, "Bacolod": 7,
  "Iloilo City": 6, "Tacloban": 3, "Davao City": 9, "Cagayan de Oro": 5,
  "General Santos": 3, "Butuan": 2,
};

const HUBS = Object.keys(HUB_STATS) as Array<keyof typeof HUB_STATS>;

function CityRow({ city }: { city: NexoflowCity }) {
  const count = RETAILER_COUNTS[city.city] ?? 0;
  const isActive = count > 0;
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors rounded-lg">
      <div className={cn("h-2 w-2 rounded-full shrink-0", isActive ? "bg-success-500" : "bg-surface-300")} />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground">{city.city}</span>
        <span className="text-xs text-muted-foreground ml-2">{city.province}</span>
      </div>
      {count > 0 ? (
        <span className="text-xs font-semibold text-success-600 bg-success-50 border border-success-200 rounded-full px-2 py-0.5">
          {count} retailers
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">No retailers yet</span>
      )}
    </div>
  );
}

export default function CoveragePage() {
  const [search, setSearch] = useState("");
  const [selectedHub, setSelectedHub] = useState<string>("all");
  const [selectedIsland, setSelectedIsland] = useState<string>("all");

  const totalRetailers = Object.values(RETAILER_COUNTS).reduce((a, b) => a + b, 0);
  const activeCities = NEXOFLOW_CITIES.filter((c) => (RETAILER_COUNTS[c.city] ?? 0) > 0).length;

  const filtered = NEXOFLOW_CITIES.filter((c) => {
    const matchSearch = search === "" ||
      c.city.toLowerCase().includes(search.toLowerCase()) ||
      c.province.toLowerCase().includes(search.toLowerCase());
    const matchHub = selectedHub === "all" || c.hub === selectedHub;
    const matchIsland = selectedIsland === "all" || c.island === selectedIsland;
    return matchSearch && matchHub && matchIsland;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500">
              <Globe className="h-4 w-4 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Network Coverage</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Powered by <span className="font-semibold text-foreground">Pacific Nexus Global</span> — 137 partner cities across the Philippines
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-success-200 bg-success-50 px-3 py-2 text-xs font-semibold text-success-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Live Network
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Partner Cities", value: "137", sub: "Luzon · Visayas · Mindanao", icon: MapPin, color: "text-brand-600 bg-brand-50" },
          { label: "Active Cities", value: activeCities.toString(), sub: `${NEXOFLOW_CITIES.length - activeCities} not yet activated`, icon: CheckCircle2, color: "text-success-600 bg-success-50" },
          { label: "Total Retailers", value: totalRetailers.toString(), sub: "Registered store owners", icon: Users, color: "text-info-600 bg-info-50" },
          { label: "Delivery Hubs", value: "5", sub: "NCR · N. Luzon · S. Luzon · Visayas · Mindanao", icon: Truck, color: "text-warning-600 bg-warning-50" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl mb-3", s.color)}>
                <s.icon className="h-4.5 w-4.5" />
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1 leading-snug">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hub breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {HUBS.map((hub) => {
          const info = HUB_STATS[hub];
          const hubCities = getCitiesByHub(hub);
          const hubRetailers = hubCities.reduce((s, c) => s + (RETAILER_COUNTS[c.city] ?? 0), 0);
          const hubActive = hubCities.filter((c) => (RETAILER_COUNTS[c.city] ?? 0) > 0).length;
          return (
            <button
              key={hub}
              onClick={() => setSelectedHub(selectedHub === hub ? "all" : hub)}
              className={cn(
                "rounded-2xl border p-4 text-left transition-all hover:shadow-sm",
                selectedHub === hub ? info.color + " ring-2 ring-current/30" : "border-border bg-card"
              )}
            >
              <p className="text-lg font-black tabular-nums text-foreground">{info.cities}</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">{info.label}</p>
              <div className="mt-2 space-y-0.5">
                <p className="text-[10px] text-muted-foreground">{hubRetailers} retailers</p>
                <p className="text-[10px] text-muted-foreground">{hubActive}/{info.cities} cities active</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Island tabs */}
      <div className="flex gap-2">
        {[
          { id: "all", label: "All Islands", count: NEXOFLOW_CITIES.length },
          { id: "Luzon", label: "Luzon", count: 68 },
          { id: "Visayas", label: "Visayas", count: 36 },
          { id: "Mindanao", label: "Mindanao", count: 33 },
        ].map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => { setSelectedIsland(id); setSelectedHub("all"); }}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors",
              selectedIsland === id
                ? "bg-brand-500 text-white"
                : "bg-surface-100 text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
            <span className={cn("text-xs rounded-full px-1.5 py-0.5", selectedIsland === id ? "bg-white/20 text-white" : "bg-surface-200 text-muted-foreground")}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Search + city list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search city or province…"
                className="h-10 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <span className="text-sm text-muted-foreground shrink-0">{filtered.length} cities</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Legend */}
          <div className="flex items-center gap-4 px-4 pb-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-success-500" />Active (has retailers)</div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-surface-300" />Available (no retailers yet)</div>
          </div>

          {/* Grouped by hub */}
          {selectedHub === "all" && selectedIsland === "all" && search === "" ? (
            <div className="divide-y divide-border">
              {HUBS.map((hub) => {
                const hubCities = getCitiesByHub(hub);
                const info = HUB_STATS[hub];
                return (
                  <div key={hub}>
                    <div className={cn("px-4 py-2 flex items-center justify-between")}>
                      <span className={cn("text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border", info.color)}>
                        {info.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{hubCities.length} cities</span>
                    </div>
                    {hubCities.map((city) => <CityRow key={city.city + city.province} city={city} />)}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="pb-2">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">No cities found</div>
              ) : (
                filtered.map((city) => <CityRow key={city.city + city.province} city={city} />)
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Growth opportunity callout */}
      <Card className="border-brand-200 bg-gradient-to-r from-brand-50 to-transparent">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Expansion Opportunity</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {NEXOFLOW_CITIES.length - activeCities} of your 137 Pacific Nexus Global partner cities have no retailers yet.
                With Pacific Nexus Global's logistics network already in place, each new city is a zero-infrastructure expansion.
                Target <strong>Cebu City</strong>, <strong>Davao City</strong>, and <strong>Iloilo City</strong> next —
                all have strong sari-sari store density and Pacific Nexus Global coverage.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
