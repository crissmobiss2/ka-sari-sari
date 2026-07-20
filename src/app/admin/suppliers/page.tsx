"use client";
import { useState, useEffect } from "react";
import {
  Search, LayoutGrid, List, Plus, Eye, ShoppingCart, Pencil,
  Phone, Mail, MapPin, User, X, Truck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const INITIAL_SUPPLIERS = [
  { id: "sup-1", name: "PhilBev Distribution Inc.", contact: "Roberto Aquino", phone: "+63 2 8888 1234", email: "roberto@philbev.com", city: "Valenzuela City", status: "active", terms: "30 days NET", leadTime: 3, totalPurchases: 2450000, lastOrder: "Jan 15, 2025", categories: ["Beverages", "Coffee"] },
  { id: "sup-2", name: "Lucky Me Foods Corp", contact: "Sandra Villanueva", phone: "+63 2 8777 9900", email: "orders@luckyme.com", city: "Taguig City", status: "active", terms: "COD", leadTime: 2, totalPurchases: 1820000, lastOrder: "Jan 18, 2025", categories: ["Instant Noodles", "Snacks"] },
  { id: "sup-3", name: "Del Monte Philippines", contact: "Carlos Mendoza", phone: "+63 2 8999 5678", email: "c.mendoza@delmonte.ph", city: "Malolos City", status: "active", terms: "15 days NET", leadTime: 4, totalPurchases: 980000, lastOrder: "Jan 10, 2025", categories: ["Canned Goods", "Condiments"] },
  { id: "sup-4", name: "Procter & Gamble Philippines", contact: "Maricel Santos", phone: "+63 2 8555 4321", email: "ph.orders@pg.com", city: "Pasig City", status: "active", terms: "45 days NET", leadTime: 5, totalPurchases: 3200000, lastOrder: "Jan 20, 2025", categories: ["Personal Care", "Laundry"] },
  { id: "sup-5", name: "Mega Global Corp", contact: "Jaime Reyes", phone: "+63 2 8333 7788", email: "jaime@megaglobal.ph", city: "Quezon City", status: "active", terms: "30 days NET", leadTime: 3, totalPurchases: 755000, lastOrder: "Jan 12, 2025", categories: ["Canned Goods"] },
];

const TERMS_COLORS: Record<string, string> = {
  "COD":         "bg-success-50 dark:bg-success-500/10 dark:bg-success-500/20 text-success-700 dark:text-foreground border-success-500/25 dark:border-success-500/30",
  "15 days NET": "bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-foreground border-blue-200 dark:border-blue-500/30",
  "30 days NET": "bg-warning-50 dark:bg-warning-500/10 dark:bg-warning-500/20 text-warning-700 dark:text-foreground border-warning-500/25 dark:border-warning-500/30",
  "45 days NET": "bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-foreground border-purple-200 dark:border-purple-500/30",
};

function formatM(n: number) {
  if (n >= 1_000_000) return `PHP ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `PHP ${(n / 1_000).toFixed(0)}K`;
  return `PHP ${n}`;
}

type Supplier = (typeof INITIAL_SUPPLIERS)[number];

type CardHandlers = {
  onView: (s: Supplier) => void;
  onNewPO: (s: Supplier) => void;
  onEdit: (s: Supplier) => void;
};

function SupplierCard({ s, onView, onNewPO, onEdit }: { s: Supplier } & CardHandlers) {
  const initials = s.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <Card className="p-5 flex flex-col gap-4 hover:shadow-card-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 rounded-xl bg-brand-100 dark:bg-brand-700 text-brand-600 dark:text-white flex items-center justify-center text-sm font-bold">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-foreground leading-tight">{s.name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="h-3 w-3" /> {s.city}
            </div>
          </div>
        </div>
        <Badge variant={s.status === "active" ? "success" : "neutral"} className="shrink-0">
          {s.status === "active" ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <User className="h-3.5 w-3.5 shrink-0" />
          <span>{s.contact}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          <span>{s.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{s.email}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center border-t border-border pt-3">
        <span className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
          TERMS_COLORS[s.terms] ?? "bg-surface-100 dark:bg-surface-800 text-surface-600 border-surface-200"
        )}>
          {s.terms}
        </span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Truck className="h-3.5 w-3.5" />
          <span>{s.leadTime}d lead</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Total Purchases</p>
          <p className="font-semibold text-foreground font-variant-numeric tabular-nums">{formatM(s.totalPurchases)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Last Order</p>
          <p className="font-semibold text-foreground">{s.lastOrder}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {s.categories.map((c) => (
          <span key={c} className="rounded-full bg-surface-100 dark:bg-surface-800 px-2 py-0.5 text-xs text-surface-600">
            {c}
          </span>
        ))}
      </div>

      <div className="flex gap-2 border-t border-border pt-3">
        <button
          onClick={() => onView(s)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <Eye className="h-3.5 w-3.5" /> View
        </button>
        <button
          onClick={() => onNewPO(s)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-brand-700 py-2 text-xs font-medium text-white hover:bg-brand-800 transition-colors"
        >
          <ShoppingCart className="h-3.5 w-3.5" /> New PO
        </button>
        <button
          onClick={() => onEdit(s)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  );
}

function ViewSupplierModal({ s, onClose }: { s: Supplier; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display text-lg font-bold text-foreground">Supplier Details</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted/50 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 shrink-0 rounded-xl bg-brand-100 dark:bg-brand-700 text-brand-600 dark:text-white flex items-center justify-center text-sm font-bold">
              {s.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-foreground">{s.name}</p>
              <Badge variant={s.status === "active" ? "success" : "neutral"} className="mt-1">
                {s.status === "active" ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4 shrink-0" />
              <span className="font-medium text-foreground">{s.contact}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{s.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span>{s.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{s.city}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Truck className="h-4 w-4 shrink-0" />
              <span>Lead Time: {s.leadTime} days</span>
            </div>
          </div>
          <div className="border-t border-border pt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Payment Terms</p>
              <span className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium mt-1",
                TERMS_COLORS[s.terms] ?? "bg-surface-100 dark:bg-surface-800 text-surface-600 border-surface-200"
              )}>
                {s.terms}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Purchases</p>
              <p className="font-semibold text-foreground tabular-nums mt-1">{formatM(s.totalPurchases)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Order</p>
              <p className="font-semibold text-foreground mt-1">{s.lastOrder}</p>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground mb-2">Categories</p>
            <div className="flex flex-wrap gap-1.5">
              {s.categories.map((c) => (
                <span key={c} className="rounded-full bg-surface-100 dark:bg-surface-800 px-2 py-0.5 text-xs text-surface-600">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="p-5 pt-0">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Close
          </button>
        </div>
      </Card>
    </div>
  );
}

function EditSupplierModal({
  s,
  onClose,
  onSave,
}: {
  s: Supplier;
  onClose: () => void;
  onSave: (updated: Supplier) => void;
}) {
  const [form, setForm] = useState({
    company: s.name,
    contact: s.contact,
    phone: s.phone,
    email: s.email,
    city: s.city,
    terms: s.terms,
    leadTime: String(s.leadTime),
  });
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSave() {
    if (!form.company.trim()) {
      setError("Company name is required.");
      return;
    }
    setError("");
    onSave({
      ...s,
      name: form.company.trim(),
      contact: form.contact,
      phone: form.phone,
      email: form.email,
      city: form.city,
      terms: form.terms,
      leadTime: parseInt(form.leadTime, 10) || s.leadTime,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display text-lg font-bold text-foreground">Edit Supplier</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted/50 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
          )}
          <Input label="Company Name" placeholder="e.g. PhilBev Distribution Inc." value={form.company} onChange={set("company")} />
          <Input label="Contact Name" placeholder="Primary contact person" value={form.contact} onChange={set("contact")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone" placeholder="+63 2 8888 1234" value={form.phone} onChange={set("phone")} />
            <Input label="Email" type="email" placeholder="orders@supplier.com" value={form.email} onChange={set("email")} />
          </div>
          <Input label="City" placeholder="e.g. Valenzuela City" value={form.city} onChange={set("city")} />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Payment Terms</label>
              <select
                value={form.terms}
                onChange={set("terms")}
                className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option>COD</option>
                <option>15 days NET</option>
                <option>30 days NET</option>
                <option>45 days NET</option>
                <option>60 days NET</option>
              </select>
            </div>
            <Input
              label="Lead Time (days)"
              type="number"
              min="1"
              placeholder="3"
              value={form.leadTime}
              onChange={set("leadTime")}
            />
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-medium text-white hover:bg-brand-800 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </Card>
    </div>
  );
}

function AddSupplierModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (s: Supplier) => void;
}) {
  const [form, setForm] = useState({
    company: "", contact: "", phone: "", email: "",
    address: "", city: "", terms: "30 days NET", leadTime: "3",
  });
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleAdd() {
    if (!form.company.trim()) {
      setError("Company name is required.");
      return;
    }
    setError("");
    const newSupplier: Supplier = {
      id: `sup-new-${form.company.trim().replace(/\s+/g, "-").toLowerCase().slice(0, 20)}`,
      name: form.company.trim(),
      contact: form.contact,
      phone: form.phone,
      email: form.email,
      city: form.city,
      status: "active",
      terms: form.terms,
      leadTime: parseInt(form.leadTime, 10) || 3,
      totalPurchases: 0,
      lastOrder: "—",
      categories: [],
    };
    onAdd(newSupplier);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-display text-lg font-bold text-foreground">Add Supplier</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted/50 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
          )}
          <Input label="Company Name" placeholder="e.g. PhilBev Distribution Inc." value={form.company} onChange={set("company")} />
          <Input label="Contact Name" placeholder="Primary contact person" value={form.contact} onChange={set("contact")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone" placeholder="+63 2 8888 1234" value={form.phone} onChange={set("phone")} />
            <Input label="Email" type="email" placeholder="orders@supplier.com" value={form.email} onChange={set("email")} />
          </div>
          <Input label="Address" placeholder="Street address" value={form.address} onChange={set("address")} />
          <Input label="City" placeholder="e.g. Valenzuela City" value={form.city} onChange={set("city")} />
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Payment Terms</label>
              <select
                value={form.terms}
                onChange={set("terms")}
                className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option>COD</option>
                <option>15 days NET</option>
                <option>30 days NET</option>
                <option>45 days NET</option>
                <option>60 days NET</option>
              </select>
            </div>
            <Input
              label="Lead Time (days)"
              type="number"
              min="1"
              placeholder="3"
              value={form.leadTime}
              onChange={set("leadTime")}
            />
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 rounded-xl bg-brand-700 py-2.5 text-sm font-medium text-white hover:bg-brand-800 transition-colors"
          >
            Add Supplier
          </button>
        </div>
      </Card>
    </div>
  );
}

export default function AdminSuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);

  useEffect(() => {
    fetch("/api/admin/suppliers")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (Array.isArray(data?.suppliers) && data.suppliers.length > 0) {
          setSuppliers(data.suppliers);
        }
      })
      .catch(() => {});
  }, []);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [showAdd, setShowAdd] = useState(false);
  const [viewSupplier, setViewSupplier] = useState<Supplier | null>(null);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleAdd(s: Supplier) {
    setSuppliers((prev) => [...prev, s]);
    showToast(`Supplier "${s.name}" added successfully.`);
    setShowAdd(false);
    fetch("/api/admin/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    }).catch(() => {});
  }

  function handleEdit(updated: Supplier) {
    setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    showToast(`Supplier "${updated.name}" updated successfully.`);
    setEditSupplier(null);
    fetch(`/api/admin/suppliers/${updated.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    }).catch(() => {});
  }

  function handleNewPO(s: Supplier) {
    showToast(`Creating PO for ${s.name}`);
  }

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.contact.toLowerCase().includes(search.toLowerCase()) ||
    s.city.toLowerCase().includes(search.toLowerCase())
  );

  const totalPurchases = suppliers.reduce((sum, s) => sum + s.totalPurchases, 0);
  const avgLeadTime = suppliers.length
    ? (suppliers.reduce((sum, s) => sum + s.leadTime, 0) / suppliers.length).toFixed(1)
    : "0.0";

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {showAdd && <AddSupplierModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {viewSupplier && <ViewSupplierModal s={viewSupplier} onClose={() => setViewSupplier(null)} />}
      {editSupplier && (
        <EditSupplierModal
          s={editSupplier}
          onClose={() => setEditSupplier(null)}
          onSave={handleEdit}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-foreground text-background text-sm font-medium px-4 py-3 shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-foreground">Suppliers</h1>
          <span className="rounded-full bg-brand-50 dark:bg-brand-500/10 dark:bg-brand-500/20 border border-brand-200 dark:border-brand-500/30 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:text-foreground">
            {suppliers.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search suppliers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-64 rounded-xl border border-input bg-card pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-800 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Supplier
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Suppliers", value: suppliers.length.toString() },
          { label: "Active", value: suppliers.filter((s) => s.status === "active").length.toString() },
          { label: "Total Purchases YTD", value: formatM(totalPurchases) },
          { label: "Average Lead Time", value: `${avgLeadTime} days` },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="font-display text-xl font-bold text-foreground tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex justify-end">
        <div className="flex rounded-xl border border-border overflow-hidden">
          <button
            onClick={() => setViewMode("card")}
            className={cn(
              "px-3 py-2 transition-colors",
              viewMode === "card" ? "bg-brand-700 text-white" : "text-muted-foreground hover:bg-muted/50"
            )}
            aria-label="Card view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "px-3 py-2 transition-colors",
              viewMode === "table" ? "bg-brand-700 text-white" : "text-muted-foreground hover:bg-muted/50"
            )}
            aria-label="Table view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Card view */}
      {viewMode === "card" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((s) => (
              <SupplierCard
                key={s.id}
                s={s}
                onView={setViewSupplier}
                onNewPO={handleNewPO}
                onEdit={setEditSupplier}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-muted-foreground text-sm">No suppliers found.</div>
          )}
        </>
      )}

      {/* Table view */}
      {viewMode === "table" && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Supplier</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Contact</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Terms</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Lead Time</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Total Purchases</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Last Order</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium text-foreground">{s.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="h-3 w-3" /> {s.city}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <p className="text-sm text-foreground">{s.contact}</p>
                      <p className="text-xs text-muted-foreground">{s.phone}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        TERMS_COLORS[s.terms] ?? "bg-surface-100 dark:bg-surface-800 text-surface-600 border-surface-200"
                      )}>
                        {s.terms}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm text-muted-foreground hidden lg:table-cell tabular-nums">
                      {s.leadTime} days
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-foreground tabular-nums">
                      {formatM(s.totalPurchases)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell">{s.lastOrder}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={s.status === "active" ? "success" : "neutral"}>
                        {s.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setViewSupplier(s)}
                          className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted/50 transition-colors"
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleNewPO(s)}
                          className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted/50 transition-colors"
                          title="New PO"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditSupplier(s)}
                          className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted/50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-muted-foreground text-sm">No suppliers found.</div>
          )}
        </Card>
      )}
    </div>
  );
}
