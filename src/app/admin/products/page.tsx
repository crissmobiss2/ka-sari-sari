"use client";
import { useState, useMemo, useEffect } from "react";
import { Search, Plus, Package, Edit2, ToggleLeft, ToggleRight, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPHP, cn } from "@/lib/utils";
import { PRODUCTS, CATEGORIES } from "@/lib/mock-data";
import { toastSuccess, toastError } from "@/store/toast";
import type { Product } from "@/types";

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

type Draft = {
  name: string; brand: string; description: string; sku: string;
  categoryId: string; price: string; srp: string; unit: string;
  unitSize: string; imageUrl: string; stock: string;
  minOrderQty: string; lowStockThreshold: string;
  isActive: boolean; isFeatured: boolean;
};

const BLANK: Draft = {
  name: "", brand: "", description: "", sku: "", categoryId: CATEGORIES[0]?.id ?? "",
  price: "", srp: "", unit: "pc", unitSize: "", imageUrl: "", stock: "100",
  minOrderQty: "1", lowStockThreshold: "20", isActive: true, isFeatured: false,
};

function draftFromProduct(p: Product): Draft {
  return {
    name: p.name, brand: p.brand ?? "", description: p.description ?? "",
    sku: p.sku, categoryId: p.categoryId, price: String(p.price),
    srp: p.srp != null ? String(p.srp) : "", unit: p.unit, unitSize: p.unitSize ?? "",
    imageUrl: p.imageUrl ?? "", stock: String(p.stock),
    minOrderQty: String(p.minOrderQty), lowStockThreshold: String(p.lowStockThreshold),
    isActive: p.isActive, isFeatured: p.isFeatured,
  };
}

const UNITS = ["pc", "box", "pack", "bag", "bottle", "can", "sachet", "roll", "pair", "set", "kg", "g", "L", "mL"];

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-foreground">{label}</label>
      {children}
      {error && <p className="text-xs text-danger-700 dark:text-foreground">{error}</p>}
    </div>
  );
}

function iCls(hasError = false) {
  return cn(
    "block w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 transition-colors",
    hasError ? "border-danger-500" : "border-input"
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm font-medium text-foreground">
      {checked ? <ToggleRight className="h-6 w-6 text-success-700 dark:text-success-500" /> : <ToggleLeft className="h-6 w-6 text-muted-foreground" />}
      {label}
    </button>
  );
}

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [products, setProducts] = useState(PRODUCTS);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);

  useEffect(() => {
    fetch("/api/products?limit=500")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const fetched = d.products ?? d;
        if (Array.isArray(fetched) && fetched.length > 0) setProducts(fetched);
      })
      .catch(() => {});
  }, []);
  const [editing, setEditing] = useState<Product | null>(null);
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search || p.name.toLowerCase().includes(q) ||
      (p.brand?.toLowerCase().includes(q) ?? false) || p.sku.toLowerCase().includes(q);
    const matchCat = catFilter === "all" || p.categoryId === catFilter;
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? p.isActive : !p.isActive);
    return matchSearch && matchCat && matchStatus;
  }), [products, search, catFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter(p => p.isActive).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    lowStock: products.filter(p => p.stock > 0 && p.stock <= p.lowStockThreshold).length,
  }), [products]);

  function openAdd() { setDraft(BLANK); setErrors({}); setEditing(null); setModal("add"); }
  function openEdit(p: Product) { setDraft(draftFromProduct(p)); setErrors({}); setEditing(p); setModal("edit"); }
  function closeModal() { setModal(null); setEditing(null); }

  function set(field: keyof Draft, value: string | boolean) {
    setDraft(d => ({ ...d, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof Draft, string>> = {};
    if (!draft.name.trim()) e.name = "Product name is required";
    if (!draft.sku.trim()) e.sku = "SKU is required";
    else if (modal === "add" && products.some(p => p.sku === draft.sku.trim())) e.sku = "SKU already exists";
    if (!draft.categoryId) e.categoryId = "Category is required";
    const priceNum = Number(draft.price);
    if (!draft.price || isNaN(priceNum) || priceNum <= 0) e.price = "Valid price required";
    if (!draft.unit.trim()) e.unit = "Unit is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const isNew = modal === "add";
      const url = isNew ? "/api/products" : `/api/products/${editing!.id}`;
      const method = isNew ? "POST" : "PATCH";

      const payload = {
        slug: toSlug(draft.name),
        name: draft.name.trim(),
        brand: draft.brand.trim() || undefined,
        description: draft.description.trim() || undefined,
        sku: draft.sku.trim(),
        categoryId: draft.categoryId,
        price: Number(draft.price),
        srp: draft.srp ? Number(draft.srp) : undefined,
        unit: draft.unit,
        unitSize: draft.unitSize.trim() || undefined,
        imageUrl: draft.imageUrl.trim() || undefined,
        stock: Number(draft.stock) || 0,
        minOrderQty: Number(draft.minOrderQty) || 1,
        lowStockThreshold: Number(draft.lowStockThreshold) || 20,
        isActive: draft.isActive,
        isFeatured: draft.isFeatured,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isNew ? { ...payload, createdAt: new Date().toISOString() } : payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (isNew) {
          const newProduct: Product = data.product ?? { id: `prod-${Date.now()}`, ...payload, createdAt: new Date().toISOString() };
          setProducts(prev => [newProduct, ...prev]);
          toastSuccess(`${newProduct.name} added`);
        } else {
          setProducts(prev => prev.map(p => p.id !== editing!.id ? p : { ...p, ...payload }));
          toastSuccess(`${draft.name} updated`);
        }
        closeModal();
      } else {
        toastError("Failed to save product");
      }
    } catch {
      toastError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(id: string) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const next = !product.isActive;
    // Optimistic update
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: next } : p));
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      if (!res.ok) {
        // Roll back on failure
        setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: !next } : p));
        toastError("Failed to update product");
      }
    } catch {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, isActive: !next } : p));
      toastError("Network error");
    }
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{stats.total} products · {stats.active} active</p>
        </div>
        <Button size="md" onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Stats chips */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Active", value: stats.active, color: "text-success-700 dark:text-foreground" },
          { label: "Out of Stock", value: stats.outOfStock, color: "text-danger-700 dark:text-foreground" },
          { label: "Low Stock", value: stats.lowStock, color: "text-warning-700 dark:text-foreground" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <span className={`font-display text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search" placeholder="Search by name, brand, SKU…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
          />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="h-10 rounded-xl border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700">
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-10 rounded-xl border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Product</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">SKU</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Category</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Price</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Stock</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Active</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(product => {
                const cat = CATEGORIES.find(c => c.id === product.categoryId);
                return (
                  <tr key={product.id} className={cn("hover:bg-muted/30 transition-colors", !product.isActive && "opacity-50")}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-surface-100 dark:bg-surface-800 overflow-hidden shrink-0">
                          {product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          {product.brand && <p className="text-xs text-muted-foreground">{product.brand} · {product.unit}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-muted-foreground hidden md:table-cell">{product.sku}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <Badge variant="neutral">{cat?.name ?? "—"}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-foreground">{formatPHP(product.price)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={cn("font-medium tabular-nums",
                        product.stock === 0 ? "text-danger-700 dark:text-foreground" :
                        product.stock <= product.lowStockThreshold ? "text-warning-700 dark:text-foreground" : "text-foreground"
                      )}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button onClick={() => toggleActive(product.id)}>
                        {product.isActive
                          ? <ToggleRight className="h-5 w-5 text-success-700 dark:text-success-500 inline" />
                          : <ToggleLeft className="h-5 w-5 text-muted-foreground inline" />}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => openEdit(product)}
                        className="text-muted-foreground hover:text-foreground transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">No products found.</div>
        )}
      </Card>

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h2 className="font-display text-lg font-bold text-foreground">
                {modal === "add" ? "Add New Product" : "Edit Product"}
              </h2>
              <button onClick={closeModal}
                className="rounded-xl p-2 hover:bg-surface-100 dark:bg-surface-800 transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Product Name *" error={errors.name}>
                    <input value={draft.name} onChange={e => set("name", e.target.value)}
                      placeholder="e.g. Lucky Me Pancit Canton Original"
                      className={iCls(!!errors.name)} />
                  </Field>
                </div>

                <Field label="Brand">
                  <input value={draft.brand} onChange={e => set("brand", e.target.value)}
                    placeholder="e.g. Lucky Me" className={iCls()} />
                </Field>

                <Field label="SKU *" error={errors.sku}>
                  <input value={draft.sku} onChange={e => set("sku", e.target.value.toUpperCase())}
                    placeholder="e.g. LM-PC-ORI"
                    className={cn(iCls(!!errors.sku), "font-mono tracking-wide")} />
                </Field>

                <Field label="Category *" error={errors.categoryId}>
                  <select value={draft.categoryId} onChange={e => set("categoryId", e.target.value)}
                    className={iCls(!!errors.categoryId)}>
                    <option value="">Select category…</option>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>

                <Field label="Unit *" error={errors.unit}>
                  <select value={draft.unit} onChange={e => set("unit", e.target.value)}
                    className={iCls(!!errors.unit)}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </Field>

                <Field label="Unit Size">
                  <input value={draft.unitSize} onChange={e => set("unitSize", e.target.value)}
                    placeholder="e.g. 60g, 330mL, 12x30g" className={iCls()} />
                </Field>

                <Field label="Wholesale Price (₱) *" error={errors.price}>
                  <input type="number" min="0" step="0.01" value={draft.price}
                    onChange={e => set("price", e.target.value)}
                    placeholder="0.00" className={iCls(!!errors.price)} />
                </Field>

                <Field label="SRP (₱) — optional">
                  <input type="number" min="0" step="0.01" value={draft.srp}
                    onChange={e => set("srp", e.target.value)}
                    placeholder="0.00" className={iCls()} />
                </Field>

                <Field label="Stock">
                  <input type="number" min="0" value={draft.stock}
                    onChange={e => set("stock", e.target.value)} className={iCls()} />
                </Field>

                <Field label="Min Order Qty">
                  <input type="number" min="1" value={draft.minOrderQty}
                    onChange={e => set("minOrderQty", e.target.value)} className={iCls()} />
                </Field>

                <Field label="Low Stock Alert At">
                  <input type="number" min="0" value={draft.lowStockThreshold}
                    onChange={e => set("lowStockThreshold", e.target.value)} className={iCls()} />
                </Field>

                <Field label="Image URL">
                  <input value={draft.imageUrl} onChange={e => set("imageUrl", e.target.value)}
                    placeholder="https://picsum.photos/seed/slug/400/400" className={iCls()} />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Description">
                    <textarea value={draft.description}
                      onChange={e => set("description", e.target.value)}
                      rows={3} placeholder="Optional product description…"
                      className={cn(iCls(), "resize-none")} />
                  </Field>
                </div>

                <div className="sm:col-span-2 flex gap-6 pt-1">
                  <ToggleField label="Active" checked={draft.isActive} onChange={v => set("isActive", v)} />
                  <ToggleField label="Featured" checked={draft.isFeatured} onChange={v => set("isFeatured", v)} />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex justify-end gap-3 shrink-0">
              <Button variant="outline" onClick={closeModal} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving…
                  </span>
                ) : modal === "add" ? "Add Product" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
