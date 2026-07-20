"use client";
import { useState, useMemo } from "react";
import { Search, AlertTriangle, Package, TrendingDown, ArrowUpDown, ArrowUp, ArrowDown, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPHP, formatNumber, cn } from "@/lib/utils";
import { PRODUCTS, CATEGORIES } from "@/lib/mock-data";

type SortKey = "name" | "stock" | "price" | "restock";
type SortDir = "asc" | "desc";

export default function AdminInventoryPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const lowStockCount = PRODUCTS.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
  const outCount = PRODUCTS.filter((p) => p.stock === 0).length;
  const alertCount = lowStockCount + outCount;

  const totalRestockValue = PRODUCTS.filter((p) => p.stock <= p.lowStockThreshold)
    .reduce((sum, p) => sum + p.price * (p.lowStockThreshold * 3 - p.stock), 0);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    const base = PRODUCTS.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.brand?.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;
      if (filter === "out") return p.stock === 0;
      if (filter === "low") return p.stock > 0 && p.stock <= p.lowStockThreshold;
      return true;
    });

    return base.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "stock") cmp = a.stock - b.stock;
      else if (sortKey === "price") cmp = a.price - b.price;
      else if (sortKey === "restock")
        cmp = a.price * Math.max(0, a.lowStockThreshold * 3 - a.stock)
          - b.price * Math.max(0, b.lowStockThreshold * 3 - b.stock);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [search, filter, sortKey, sortDir]);

  function stockStatus(p: typeof PRODUCTS[0]) {
    if (p.stock === 0) return { label: "Out of Stock", color: "danger" as const };
    if (p.stock <= p.lowStockThreshold) return { label: "Low Stock", color: "warning" as const };
    return { label: "In Stock", color: "success" as const };
  }

  function stockPct(p: typeof PRODUCTS[0]) {
    const max = Math.max(p.lowStockThreshold * 5, p.stock);
    return Math.min(100, Math.round((p.stock / max) * 100));
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3.5 w-3.5 text-brand-500" />
      : <ArrowDown className="h-3.5 w-3.5 text-brand-500" />;
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-foreground">Inventory</h1>
            {alertCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-50 px-3 py-1 text-xs font-semibold text-danger-600 ring-1 ring-danger-500/20">
                <AlertTriangle className="h-3.5 w-3.5" />
                {alertCount} alert{alertCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">Monitor stock levels and movements</p>
        </div>
      </div>

      {/* ── Urgent alert banner (only when there are issues) ── */}
      {(lowStockCount > 0 || outCount > 0) && (
        <div className="rounded-xl border border-warning-500/30 bg-warning-50 dark:bg-surface-800 dark:border-warning-600/40 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning-600 dark:text-warning-500 shrink-0" />
          <div className="flex-1 text-sm text-warning-600 dark:text-warning-500">
            <span className="font-semibold">Stock alert: </span>
            {outCount > 0 && (
              <span>
                <span className="font-semibold text-danger-600">{outCount}</span> product{outCount !== 1 ? "s" : ""} out of stock
                {lowStockCount > 0 ? ", " : ""}
              </span>
            )}
            {lowStockCount > 0 && (
              <span>
                <span className="font-semibold">{lowStockCount}</span> running low
              </span>
            )}
            {". "}
            <button
              onClick={() => setFilter("out")}
              className="underline font-medium hover:no-underline"
            >
              View critical items
            </button>
          </div>
          <span className="text-xs text-warning-600 font-medium shrink-0">
            Est. restock: {formatPHP(totalRestockValue)}
          </span>
        </div>
      )}

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Products",  value: PRODUCTS.length, icon: Package,      color: "text-foreground",    bg: "" },
          { label: "Low Stock",       value: lowStockCount,   icon: TrendingDown,  color: "text-warning-600",   bg: "bg-warning-50 dark:bg-card" },
          { label: "Out of Stock",    value: outCount,        icon: AlertTriangle, color: "text-danger-600",    bg: "bg-danger-50 dark:bg-card" },
          { label: "Showing",         value: filtered.length, icon: ShoppingCart,  color: "text-brand-600",     bg: "bg-brand-50 dark:bg-card" },
        ].map((s) => (
          <Card key={s.label} className={cn("p-4", s.bg)}>
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

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search products, brand, SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex gap-1">
          {[
            { id: "all" as const, label: `All (${PRODUCTS.length})` },
            { id: "low" as const, label: `Low (${lowStockCount})` },
            { id: "out" as const, label: `Out (${outCount})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium border transition-colors",
                filter === f.id
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-card text-muted-foreground border-border hover:border-brand-300"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                  <button
                    onClick={() => toggleSort("name")}
                    className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    Product <SortIcon col="name" />
                  </button>
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">SKU</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Category</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                  <button
                    onClick={() => toggleSort("price")}
                    className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors ml-auto"
                  >
                    Price <SortIcon col="price" />
                  </button>
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                  <button
                    onClick={() => toggleSort("stock")}
                    className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors ml-auto"
                  >
                    Stock <SortIcon col="stock" />
                  </button>
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground hidden xl:table-cell">
                  <button
                    onClick={() => toggleSort("restock")}
                    className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors ml-auto"
                  >
                    Restock Value <SortIcon col="restock" />
                  </button>
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((product) => {
                const { label, color } = stockStatus(product);
                const cat = CATEGORIES.find((c) => c.id === product.categoryId);
                const pct = stockPct(product);
                const restockUnits = Math.max(0, product.lowStockThreshold * 3 - product.stock);
                const restockCost = product.price * restockUnits;
                const isOut = product.stock === 0;
                const isLow = !isOut && product.stock <= product.lowStockThreshold;

                return (
                  <tr
                    key={product.id}
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      isOut && "bg-danger-50/40",
                      isLow && !isOut && "bg-warning-50/30"
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        {product.brand && (
                          <p className="text-xs text-muted-foreground">{product.brand} · {product.unit} {product.unitSize}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground font-mono hidden md:table-cell">
                      {product.sku}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground hidden lg:table-cell">
                      {cat?.name}
                    </td>
                    <td className="px-5 py-3.5 text-right text-foreground font-medium">
                      {formatPHP(product.price)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <div className="flex items-baseline gap-1">
                          <span className={cn(
                            "font-semibold tabular-nums",
                            isOut ? "text-danger-600" : isLow ? "text-warning-600" : "text-foreground"
                          )}>
                            {formatNumber(product.stock)}
                          </span>
                          <span className="text-xs text-muted-foreground">/ min {product.lowStockThreshold}</span>
                        </div>
                        {/* Stock level bar */}
                        <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              isOut ? "bg-danger-500 w-0" :
                              isLow ? "bg-warning-500" :
                              "bg-success-500"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right hidden xl:table-cell">
                      {restockUnits > 0 ? (
                        <div className="flex flex-col items-end">
                          <span className="font-medium text-foreground">{formatPHP(restockCost)}</span>
                          <span className="text-xs text-muted-foreground">{formatNumber(restockUnits)} units needed</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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
          <div className="py-16 text-center">
            <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">No products found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter !== "all"
                ? `No products match the "${filter}" filter. Try "All" to see everything.`
                : "Try a different search term."}
            </p>
            {filter !== "all" && (
              <button
                onClick={() => setFilter("all")}
                className="mt-3 text-xs text-brand-600 font-medium underline hover:no-underline"
              >
                Clear filter
              </button>
            )}
          </div>
        )}

        {/* Table footer */}
        {filtered.length > 0 && (
          <div className="border-t border-border px-5 py-2.5 flex justify-between items-center bg-muted/20">
            <span className="text-xs text-muted-foreground">
              {filtered.length} product{filtered.length !== 1 ? "s" : ""} shown
            </span>
            <span className="text-xs text-muted-foreground">
              Total stock value:{" "}
              <span className="font-semibold text-foreground">
                {formatPHP(filtered.reduce((sum, p) => sum + p.price * p.stock, 0))}
              </span>
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}
