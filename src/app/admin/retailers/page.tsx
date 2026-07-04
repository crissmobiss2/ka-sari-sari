"use client";
import { useState } from "react";
import { Search, Users, MapPin, Phone, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

const MOCK_RETAILERS = [
  { id: "r1", name: "Maria Santos", store: "Santos Sari-Sari Store", city: "Caloocan City", phone: "+63 917 123 4567", isActive: true, orders: 14, joined: "2024-08-01" },
  { id: "r2", name: "Jun Dela Cruz", store: "Dela Cruz Tindahan", city: "Marikina City", phone: "+63 928 234 5678", isActive: true, orders: 8, joined: "2024-09-15" },
  { id: "r3", name: "Nena Reyes", store: "Ate Nena Store", city: "Quezon City", phone: "+63 939 345 6789", isActive: true, orders: 22, joined: "2024-07-20" },
  { id: "r4", name: "Lito Garcia", store: "Garcia Grocery", city: "Pasig City", phone: "+63 910 456 7890", isActive: false, orders: 3, joined: "2024-11-01" },
  { id: "r5", name: "Elena Cruz", store: "Cruz Corner Store", city: "Mandaluyong", phone: "+63 921 567 8901", isActive: true, orders: 11, joined: "2024-10-05" },
];

export default function AdminRetailersPage() {
  const [search, setSearch] = useState("");
  const filtered = MOCK_RETAILERS.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.store.toLowerCase().includes(search.toLowerCase()) ||
    r.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Retailers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{MOCK_RETAILERS.length} registered store owners</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Retailers", value: MOCK_RETAILERS.length },
          { label: "Active", value: MOCK_RETAILERS.filter((r) => r.isActive).length },
          { label: "Inactive", value: MOCK_RETAILERS.filter((r) => !r.isActive).length },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search by name, store, city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Retailer</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Contact</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Joined</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Orders</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 text-sm font-bold">
                        {r.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{r.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{r.store} · {r.city}</span>
                        </div>
                      </div>
                    </div>
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
      </Card>
    </div>
  );
}
