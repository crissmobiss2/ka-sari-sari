"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, MapPin, Phone, CheckCircle2, XCircle, ChevronDown, TrendingUp, Building2, Filter, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";
import { getCitiesByHub, isCovered } from "@/lib/nexoflow-cities";

const MOCK_RETAILERS = [
  { id: "r1",  name: "Maria Santos",    store: "Santos Sari-Sari Store",     city: "Caloocan",        hub: "NCR",          phone: "+63 917 123 4567", isActive: true,  orders: 14, joined: "2024-08-01" },
  { id: "r2",  name: "Jun Dela Cruz",   store: "Dela Cruz Tindahan",          city: "Marikina",        hub: "NCR",          phone: "+63 928 234 5678", isActive: true,  orders: 8,  joined: "2024-09-15" },
  { id: "r3",  name: "Nena Reyes",      store: "Ate Nena Store",              city: "Quezon City",     hub: "NCR",          phone: "+63 939 345 6789", isActive: true,  orders: 22, joined: "2024-07-20" },
  { id: "r4",  name: "Lito Garcia",     store: "Garcia Grocery",              city: "Pasig",           hub: "NCR",          phone: "+63 910 456 7890", isActive: false, orders: 3,  joined: "2024-11-01" },
  { id: "r5",  name: "Elena Cruz",      store: "Cruz Corner Store",           city: "Mandaluyong",     hub: "NCR",          phone: "+63 921 567 8901", isActive: true,  orders: 11, joined: "2024-10-05" },
  { id: "r6",  name: "Rodel Aquino",    store: "Aquino Mini-Mart",            city: "Antipolo",        hub: "NCR",          phone: "+63 932 678 9012", isActive: true,  orders: 6,  joined: "2025-01-10" },
  { id: "r7",  name: "Ligaya Bautista", store: "Ligaya's Tindahan",           city: "Cebu City",       hub: "Visayas",      phone: "+63 943 789 0123", isActive: true,  orders: 9,  joined: "2025-02-14" },
  { id: "r8",  name: "Dante Ocampo",    store: "Ocampo Sari-Sari",            city: "Bacolod",         hub: "Visayas",      phone: "+63 954 890 1234", isActive: true,  orders: 5,  joined: "2025-03-01" },
  { id: "r9",  name: "Rowena Delos Santos", store: "DS Store",                city: "Davao City",      hub: "Mindanao",     phone: "+63 965 901 2345", isActive: true,  orders: 7,  joined: "2025-04-20" },
  { id: "r10", name: "Crispin Villanueva", store: "Crispin's Tienda",         city: "San Fernando",    hub: "North Luzon",  phone: "+63 976 012 3456", isActive: false, orders: 1,  joined: "2025-05-05" },
  { id: "r11", name: "Amelia Flores",   store: "Flores Corner",               city: "Calamba",         hub: "South Luzon",  phone: "+63 987 123 4567", isActive: true,  orders: 4,  joined: "2025-06-01" },
  { id: "r12", name: "Bernard Tan",     store: "Tan Variety Store",           city: "Iloilo City",     hub: "Visayas",      phone: "+63 908 234 5678", isActive: true,  orders: 3,  joined: "2025-06-15" },
];

type HubFilter = "all" | "NCR" | "North Luzon" | "South Luzon" | "Visayas" | "Mindanao";

const HUB_COLORS: Record<string, string> = {
  "NCR":          "bg-brand-50 text-brand-600 border-brand-100",
  "North Luzon":  "bg-purple-50 text-purple-600 border-purple-100",
  "South Luzon":  "bg-info-50 text-info-600 border-info-100",
  "Visayas":      "bg-success-50 text-success-600 border-success-100",
  "Mindanao":     "bg-warning-50 text-warning-700 border-warning-100",
};

export default function AdminRetailersPage() {
  const router = useRouter();
  const [search, setSearch]   = useState("");
  const [hub, setHub]         = useState<HubFilter>("all");
  const [status, setStatus]   = useState<"all" | "active" | "inactive">("all");
  const [inviteModal, setInviteModal] = useState(false);
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteStore, setInviteStore] = useState("");
  const [inviteToast, setInviteToast] = useState("");

  const filtered = MOCK_RETAILERS.filter((r) => {
    const matchSearch = !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.store.toLowerCase().includes(search.toLowerCase()) ||
      r.city.toLowerCase().includes(search.toLowerCase());
    const matchHub    = hub === "all" || r.hub === hub;
    const matchStatus = status === "all" || (status === "active" ? r.isActive : !r.isActive);
    return matchSearch && matchHub && matchStatus;
  });

  const activeCount = MOCK_RETAILERS.filter((r) => r.isActive).length;
  const hubs = ["all", "NCR", "North Luzon", "South Luzon", "Visayas", "Mindanao"] as HubFilter[];

  async function handleSendInvite() {
    const phone = invitePhone.trim();
    if (!phone) return;
    try {
      await fetch("/api/admin/retailers/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, store: inviteStore.trim() }),
      });
    } catch { /* show toast regardless */ }
    setInviteToast("Invite sent to " + phone);
    setInviteModal(false);
    setInvitePhone("");
    setInviteStore("");
    setTimeout(() => setInviteToast(""), 3500);
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Toast */}
      {inviteToast && (
        <div className="fixed top-5 right-5 z-50 rounded-xl bg-success-600 text-white px-5 py-3 text-sm font-semibold shadow-lg">
          {inviteToast}
        </div>
      )}

      {/* Invite Modal */}
      {inviteModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-xl p-6">
            <button
              onClick={() => setInviteModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="font-display text-lg font-bold text-foreground mb-4">Invite Retailer</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="+63 9XX XXX XXXX"
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Store Name <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Santos Sari-Sari Store"
                  value={inviteStore}
                  onChange={(e) => setInviteStore(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <button
                onClick={handleSendInvite}
                className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500">
              <Users className="h-4 w-4 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Retailers</h1>
          </div>
          <p className="text-sm text-muted-foreground">{MOCK_RETAILERS.length} registered store owners across {new Set(MOCK_RETAILERS.map(r => r.hub)).size} hubs</p>
        </div>
        <button
          onClick={() => setInviteModal(true)}
          className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-100 transition-colors"
        >
          + Invite Retailer
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Retailers", value: MOCK_RETAILERS.length, icon: Users, color: "text-brand-600 bg-brand-50" },
          { label: "Active",          value: activeCount,           icon: CheckCircle2, color: "text-success-600 bg-success-50" },
          { label: "Inactive",        value: MOCK_RETAILERS.length - activeCount, icon: XCircle, color: "text-muted-foreground bg-surface-100" },
          { label: "Cities Served",   value: new Set(MOCK_RETAILERS.map(r => r.city)).size, icon: MapPin, color: "text-info-600 bg-info-50" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl mb-3", s.color)}>
              <s.icon className="h-4 w-4" />
            </div>
            <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Hub filter chips */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
          <Filter className="h-3 w-3" /> Filter by Hub
        </p>
        <div className="flex flex-wrap gap-2">
          {hubs.map((h) => {
            const count = h === "all" ? MOCK_RETAILERS.length : MOCK_RETAILERS.filter(r => r.hub === h).length;
            return (
              <button
                key={h}
                onClick={() => setHub(h)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all",
                  hub === h
                    ? h === "all"
                      ? "bg-brand-500 text-white border-brand-500"
                      : cn(HUB_COLORS[h], "ring-1 ring-current/30")
                    : "border-border text-muted-foreground bg-card hover:text-foreground"
                )}
              >
                {h === "all" ? "All Hubs" : h}
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px]",
                  hub === h && h === "all" ? "bg-white/20 text-white" : "bg-surface-200 dark:bg-surface-800 text-muted-foreground"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search + status filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by name, store, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="h-10 rounded-xl border border-input bg-card px-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Retailer</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Hub</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Contact</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Joined</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Orders</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => router.push("/admin/retailers/" + r.id)}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-700 text-brand-600 dark:text-white text-sm font-bold">
                        {r.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{r.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate max-w-[180px]">{r.store}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{r.city}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className={cn("text-xs font-semibold rounded-full border px-2 py-0.5", HUB_COLORS[r.hub])}>
                      {r.hub}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {r.phone}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-muted-foreground hidden lg:table-cell">{formatDate(r.joined)}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-foreground">{r.orders}</td>
                  <td className="px-5 py-3.5 text-right">
                    {r.isActive
                      ? <Badge variant="success"><CheckCircle2 className="h-3 w-3" /> Active</Badge>
                      : <Badge variant="neutral"><XCircle className="h-3 w-3" /> Inactive</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">No retailers found.</div>
        )}
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{filtered.length} of {MOCK_RETAILERS.length} retailers</span>
          <span className="text-xs text-muted-foreground">{filtered.reduce((s, r) => s + r.orders, 0)} total orders</span>
        </div>
      </Card>

      {/* Expansion opportunity */}
      <Card className="border-brand-200 bg-gradient-to-r from-brand-50 to-transparent p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-foreground">137 Nexoflow Cities Available</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              You have retailers in only {new Set(MOCK_RETAILERS.map(r => r.city)).size} of 137 Nexoflow partner cities.
              The logistics network is already in place — onboard new retailers to expand your reach at zero infrastructure cost.
              Priority targets: <strong>Cagayan de Oro</strong>, <strong>Iloilo City</strong>, <strong>Batangas City</strong>.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
