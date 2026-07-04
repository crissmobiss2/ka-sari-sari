"use client";
import { useState } from "react";
import { Search, Plus, Package, Edit2, ToggleLeft, ToggleRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPHP } from "@/lib/utils";
import { PRODUCTS, CATEGORIES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState(PRODUCTS);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  function toggleActive(id: string) {
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, isActive: !p.isActive } : p));
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{PRODUCTS.length} products across {CATEGORIES.length} categories</p>
        </div>
        <Button size="md">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search by name, brand, SKU…"
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
              {filtered.map((product) => {
                const cat = CATEGORIES.find((c) => c.id === product.categoryId);
                return (
                  <tr key={product.id} className={cn("hover:bg-muted/30 transition-colors", !product.isActive && "opacity-50")}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-surface-100 flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          {product.brand && <p className="text-xs text-muted-foreground">{product.brand} · {product.unit}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-muted-foreground hidden md:table-cell">{product.sku}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <Badge variant="neutral">{cat?.name}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-foreground">{formatPHP(product.price)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={cn("font-medium", product.stock === 0 ? "text-danger-600" : product.stock <= product.lowStockThreshold ? "text-warning-600" : "text-foreground")}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button onClick={() => toggleActive(product.id)}>
                        {product.isActive
                          ? <ToggleRight className="h-5 w-5 text-success-500 inline" />
                          : <ToggleLeft className="h-5 w-5 text-muted-foreground inline" />}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
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
    </div>
  );
}
