"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Download, ArrowUpDown, CheckCircle2, Package, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PRODUCTS, CATEGORIES } from "@/lib/mock-data";
import { toastSuccess } from "@/store/toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = "name-asc" | "stock-asc" | "stock-desc";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function downloadInventoryCSV(
  products: Array<{ id: string; name: string; brand?: string; categoryId: string; sku: string }>,
  currentStock: (id: string) => number
) {
  const rows = [
    ["Product ID", "SKU", "Name", "Brand", "Category", "Stock (units)"],
    ...products.map((p) => [
      p.id,
      p.sku,
      `"${p.name}"`,
      `"${p.brand ?? ""}"`,
      p.categoryId,
      currentStock(p.id).toString(),
    ]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ka-sari-sari-inventory.csv";
  a.click();
  URL.revokeObjectURL(url);
  toastSuccess("Inventory exported as CSV");
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [products, setInventoryProducts] = useState(PRODUCTS);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name-asc");

  useEffect(() => {
    fetch("/api/products?limit=500")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const fetched = d.products ?? d;
        if (Array.isArray(fetched) && fetched.length > 0) setInventoryProducts(fetched);
      })
      .catch(() => {});
  }, []);

  // Delta adjustments layered on top of base stock
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});

  // Which product has the inline adjust input open
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustInput, setAdjustInput] = useState<string>("");

  // ── Derived stock ──────────────────────────────────────────────────────────
  function currentStock(productId: string) {
    const base = products.find((p) => p.id === productId)?.stock ?? 0;
    return base + (adjustments[productId] ?? 0);
  }

  function getProductThreshold(productId: string) {
    return products.find((p) => p.id === productId)?.lowStockThreshold ?? 20;
  }

  // ── Inline adjust actions ─────────────────────────────────────────────────
  function openAdjust(productId: string) {
    setAdjustingId(productId);
    setAdjustInput("0");
  }

  function confirmAdjust(productId: string) {
    const delta = parseInt(adjustInput, 10);
    if (isNaN(delta)) {
      setAdjustingId(null);
      return;
    }
    const base = products.find((p) => p.id === productId)?.stock ?? 0;
    const prevAdj = adjustments[productId] ?? 0;
    const newTotal = Math.max(0, base + prevAdj + delta);
    const newAdj = newTotal - base;
    setAdjustments((prev) => ({ ...prev, [productId]: newAdj }));
    fetch("/api/warehouse/inventory/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        adjustment: delta,
        reason: "Manual stock adjustment",
      }),
    }).catch(() => {});
    setAdjustingId(null);
    const productName = products.find((p) => p.id === productId)?.name ?? productId;
    const sign = delta >= 0 ? `+${delta}` : `${delta}`;
    toastSuccess(`Stock adjusted (${sign}) for ${productName}`);
  }

  function cancelAdjust() {
    setAdjustingId(null);
  }

  // ── Summary counts ────────────────────────────────────────────────────────
  const totalSKUs = products.length;
  const outOfStockCount = products.filter((p) => currentStock(p.id) === 0).length;
  const lowStockCount = products.filter((p) => {
    const s = currentStock(p.id);
    return s >= 1 && s <= getProductThreshold(p.id);
  }).length;
  const totalUnits = products.reduce((sum, p) => sum + currentStock(p.id), 0);

  // ── Filtered + sorted list ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = products.filter((p) => {
      const matchesSearch =
        q === "" ||
        p.name.toLowerCase().includes(q) ||
        (p.brand ?? "").toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q);
      const matchesCategory =
        activeCategory === "all" || p.categoryId === activeCategory;
      return matchesSearch && matchesCategory;
    });

    return [...base].sort((a, b) => {
      if (sortKey === "name-asc") return a.name.localeCompare(b.name);
      if (sortKey === "stock-asc") return currentStock(a.id) - currentStock(b.id);
      if (sortKey === "stock-desc") return currentStock(b.id) - currentStock(a.id);
      return 0;
    });
  }, [products, search, activeCategory, sortKey, adjustments]); // eslint-disable-line react-hooks/exhaustive-deps

  const lowStockFiltered = filtered.filter((p) => {
    const s = currentStock(p.id);
    return s >= 1 && s <= getProductThreshold(p.id);
  });

  // ── Sort options ──────────────────────────────────────────────────────────
  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "name-asc", label: "Name A–Z" },
    { key: "stock-asc", label: "Stock: Low" },
    { key: "stock-desc", label: "Stock: High" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-6 pb-4 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Inventory</h1>
          <button
            onClick={() => downloadInventoryCSV(filtered, currentStock)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-100 hover:text-surface-900 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, brand, or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* ── Stock Summary Card ─────────────────────────────────────────────── */}
      <div className="px-4 pb-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Stock Summary
            </p>
            <div className="grid grid-cols-4 gap-3">
              <div className="flex flex-col items-center gap-1">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-display text-xl font-bold text-foreground">{totalSKUs}</span>
                <span className="text-[10px] text-muted-foreground text-center leading-tight">Total SKUs</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <XCircle className="h-4 w-4 text-danger-500" />
                <span className="font-display text-xl font-bold text-danger-500">{outOfStockCount}</span>
                <span className="text-[10px] text-muted-foreground text-center leading-tight">Out of Stock</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-warning-600" />
                <span className="font-display text-xl font-bold text-warning-600">{lowStockCount}</span>
                <span className="text-[10px] text-muted-foreground text-center leading-tight">Low Stock</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-success-600" />
                <span className="font-display text-xl font-bold text-success-600">
                  {totalUnits.toLocaleString()}
                </span>
                <span className="text-[10px] text-muted-foreground text-center leading-tight">Total Units</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Category filter tabs ───────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3 no-scrollbar">
        <button
          onClick={() => setActiveCategory("all")}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-colors",
            activeCategory === "all"
              ? "bg-brand-700 text-white"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-colors",
              activeCategory === cat.id
                ? "bg-brand-700 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* ── Sort + result count row ────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-4 pb-3">
        <p className="text-xs text-muted-foreground">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="text-xs rounded-lg border border-border bg-background text-foreground px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Low-stock alert banner ─────────────────────────────────────────── */}
      <div className="px-4">
        {lowStockFiltered.length > 0 && (
          <div className="bg-warning-50 border border-warning-300 rounded-xl p-3 mb-3 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-warning-600 shrink-0 mt-0.5" />
            <p className="text-sm text-warning-700 font-medium">
              {lowStockFiltered.length} product{lowStockFiltered.length !== 1 ? "s are" : " is"} running low on
              stock. Review and reorder soon.
            </p>
          </div>
        )}

        {/* ── Product list ───────────────────────────────────────────────── */}
        <div className="space-y-2 pb-6">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-base font-semibold text-foreground">No products found</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different search or category.</p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((product) => {
              const stock = currentStock(product.id);
              const threshold = product.lowStockThreshold ?? 20;
              const isLow = stock >= 1 && stock <= threshold;
              const isOut = stock === 0;
              const category = CATEGORIES.find((c) => c.id === product.categoryId);
              const isAdjusting = adjustingId === product.id;

              return (
                <div
                  key={product.id}
                  className={cn(
                    "rounded-xl border border-border bg-card overflow-hidden transition-all",
                    (isLow || isOut) && "border-l-4 border-l-danger-500"
                  )}
                >
                  <div className="p-3">
                    <div className="flex items-start gap-3">
                      {/* Left: name + brand + SKU + category */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.brand}
                          {product.sku && (
                            <span className="ml-1.5 font-mono text-[10px] bg-muted rounded px-1 py-0.5 text-muted-foreground">
                              {product.sku}
                            </span>
                          )}
                        </p>
                        {category && (
                          <Badge variant="neutral" className="mt-1 text-xs">
                            {category.name}
                          </Badge>
                        )}
                      </div>

                      {/* Right: stock value + badge + adjust */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={cn("font-bold text-lg leading-none", isOut ? "text-danger-500" : isLow ? "text-warning-600" : "text-success-600")}>
                          {stock.toLocaleString()}
                        </span>
                        <Badge variant={isOut ? "danger" : isLow ? "warning" : "success"} className="text-xs">
                          {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                        </Badge>

                        {/* Adjust Stock button / inline form */}
                        {!isAdjusting ? (
                          <button
                            onClick={() => openAdjust(product.id)}
                            className="mt-1 text-xs font-medium text-brand-600 hover:text-brand-700 underline underline-offset-2 transition-colors"
                          >
                            Adjust Stock
                          </button>
                        ) : (
                          <div className="mt-1 flex items-center gap-1">
                            <input
                              type="number"
                              value={adjustInput}
                              onChange={(e) => setAdjustInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") confirmAdjust(product.id);
                                if (e.key === "Escape") cancelAdjust();
                              }}
                              autoFocus
                              placeholder="±qty"
                              className="w-16 text-xs rounded-lg border border-border bg-background text-foreground px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                            <button
                              onClick={() => confirmAdjust(product.id)}
                              className="text-xs rounded-lg bg-brand-700 text-white px-2 py-1 font-semibold hover:bg-brand-600 transition-colors"
                            >
                              OK
                            </button>
                            <button
                              onClick={cancelAdjust}
                              className="text-xs rounded-lg border border-border bg-background text-muted-foreground px-2 py-1 hover:text-foreground transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
