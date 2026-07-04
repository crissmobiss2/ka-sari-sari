"use client";

import { useState } from "react";
import { Search, Plus, Minus, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PRODUCTS, CATEGORIES } from "@/lib/mock-data";
import { toastSuccess } from "@/store/toast";

function getStock(productId: string): number {
  const n = productId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return (n * 7 + 13) % 201;
}

function downloadInventoryCSV(products: Array<{ id: string; name: string; brand?: string; categoryId: string }>) {
  const rows = [
    ["Product ID", "Name", "Brand", "Category", "Stock (units)"],
    ...products.map((p) => [
      p.id,
      `"${p.name}"`,
      `"${p.brand || ''}"`,
      p.categoryId,
      getStock(p.id).toString(),
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

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});

  function currentStock(productId: string) {
    return getStock(productId) + (adjustments[productId] ?? 0);
  }

  function adjust(productId: string, delta: number) {
    setAdjustments((prev) => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] ?? 0) + delta),
    }));
  }

  const totalSKUs = 122;
  const inStockCount = PRODUCTS.filter((p) => currentStock(p.id) > 20).length;
  const lowStockCount = PRODUCTS.filter((p) => {
    const s = currentStock(p.id);
    return s >= 1 && s <= 20;
  }).length;
  const outOfStockCount = PRODUCTS.filter((p) => currentStock(p.id) === 0).length;

  const filtered = PRODUCTS.filter((p) => {
    const matchesSearch =
      search.trim() === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "all" || p.categoryId === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockFiltered = filtered.filter((p) => {
    const s = currentStock(p.id);
    return s >= 1 && s <= 20;
  });

  function stockColor(stock: number) {
    if (stock === 0) return "text-danger-500";
    if (stock <= 20) return "text-warning-600";
    return "text-success-600";
  }

  function stockStatus(stock: number) {
    if (stock === 0) return "Out of Stock";
    if (stock <= 20) return "Low Stock";
    return "In Stock";
  }

  function stockBadgeVariant(stock: number): "success" | "warning" | "danger" {
    if (stock === 0) return "danger";
    if (stock <= 20) return "warning";
    return "success";
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Inventory</h1>
          <button
            onClick={() => downloadInventoryCSV(filtered)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-100 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products or brands…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex gap-3 overflow-x-auto px-4 pb-3 -mx-0">
        {[
          { label: "Total SKUs", value: totalSKUs, color: "text-foreground", bg: "bg-muted" },
          { label: "In Stock", value: inStockCount, color: "text-success-600", bg: "bg-success-50" },
          { label: "Low Stock", value: lowStockCount, color: "text-warning-600", bg: "bg-warning-50" },
          { label: "Out of Stock", value: outOfStockCount, color: "text-danger-500", bg: "bg-red-50" },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className={cn("flex flex-col items-center justify-center rounded-xl px-4 py-2.5 shrink-0", bg)}
          >
            <span className={cn("text-xl font-bold font-display", color)}>{value}</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{label}</span>
          </div>
        ))}
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-3">
        <button
          onClick={() => setActiveCategory("all")}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-colors",
            activeCategory === "all"
              ? "bg-brand-500 text-white"
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
                ? "bg-brand-500 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Low stock alert banner */}
      <div className="px-4">
        {lowStockFiltered.length > 0 && (
          <div className="bg-warning-50 border border-warning-300 rounded-xl p-3 mb-3 flex items-start gap-2">
            <span className="text-base">⚠️</span>
            <p className="text-sm text-warning-700 font-medium">
              {lowStockFiltered.length} product{lowStockFiltered.length !== 1 ? "s are" : " is"} running low on stock. Review and reorder soon.
            </p>
          </div>
        )}

        {/* Product list */}
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
              const category = CATEGORIES.find((c) => c.id === product.categoryId);
              return (
                <Card key={product.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      {/* Left: name + brand */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.brand}</p>
                        {category && (
                          <Badge variant="neutral" className="mt-1 text-xs">
                            {category.name}
                          </Badge>
                        )}
                      </div>

                      {/* Right: stock controls */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={cn("font-bold text-lg leading-none", stockColor(stock))}>
                          {stock}
                        </span>
                        <Badge variant={stockBadgeVariant(stock)} className="text-xs">
                          {stockStatus(stock)}
                        </Badge>
                        <div className="flex items-center gap-1 mt-1">
                          <button
                            onClick={() => adjust(product.id, -1)}
                            disabled={stock === 0}
                            className="h-6 w-6 rounded-md border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => adjust(product.id, 1)}
                            className="h-6 w-6 rounded-md border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
