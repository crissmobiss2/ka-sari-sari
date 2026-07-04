"use client";
import { useState } from "react";
import { Search, AlertTriangle, Package, TrendingDown, ArrowUpDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPHP, formatNumber } from "@/lib/utils";
import { PRODUCTS, CATEGORIES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function AdminInventoryPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

  const filtered = PRODUCTS.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "out") return p.stock === 0;
    if (filter === "low") return p.stock > 0 && p.stock <= p.lowStockThreshold;
    return true;
  });

  const lowStockCount = PRODUCTS.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
  const outCount = PRODUCTS.filter((p) => p.stock === 0).length;

  function stockStatus(p: typeof PRODUCTS[0]) {
    if (p.stock === 0) return { label: "Out of Stock", color: "danger" as const };
    if (p.stock <= p.lowStockThreshold) return { label: "Low Stock", color: "warning" as const };
    return { label: "In Stock", color: "success" as const };
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Inventory</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Monitor stock levels and movements</p>
      </div>

      {/* Alert summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Products", value: PRODUCTS.length, icon: Package, color: "text-foreground" },
          { label: "Low Stock", value: lowStockCount, icon: TrendingDown, color: "text-warning-600" },
          { label: "Out of Stock", value: outCount, icon: AlertTriangle, color: "text-danger-600" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className={`font-display text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search products, SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-1">
          {[
            { id: "all", label: "All" },
            { id: "low", label: `Low (${lowStockCount})` },
            { id: "out", label: `Out (${outCount})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as typeof filter)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium border transition-colors",
                filter === f.id ? "bg-brand-500 text-white border-brand-500" : "bg-card text-muted-foreground border-border hover:border-brand-300"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
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
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((product) => {
                const { label, color } = stockStatus(product);
                const cat = CATEGORIES.find((c) => c.id === product.categoryId);
                return (
                  <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        {product.brand && <p className="text-xs text-muted-foreground">{product.brand}</p>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground font-mono hidden md:table-cell">{product.sku}</td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground hidden lg:table-cell">{cat?.name}</td>
                    <td className="px-5 py-3.5 text-right text-foreground font-medium">{formatPHP(product.price)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-foreground">{formatNumber(product.stock)}</span>
                        <span className="text-xs text-muted-foreground">min {product.lowStockThreshold}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Badge variant={color}>{label}</Badge>
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
    </div>
  );
}
