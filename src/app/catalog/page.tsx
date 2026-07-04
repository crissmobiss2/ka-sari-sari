"use client";
import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { ProductCard } from "@/components/products/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PRODUCTS, CATEGORIES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Pre-select from URL ?category=slug
  const urlCategorySlug = searchParams.get("category");
  const urlCategory = urlCategorySlug
    ? CATEGORIES.find((c) => c.slug === urlCategorySlug || c.id === urlCategorySlug)?.id ?? null
    : null;

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [activeCategory, setActiveCategory] = useState<string | null>(urlCategory);
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc" | "name">("default");

  const filtered = useMemo(() => {
    let list = [...PRODUCTS];
    if (activeCategory) list = list.filter((p) => p.categoryId === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }
    if (sortBy === "price_asc") list.sort((a, b) => a.price - b.price);
    if (sortBy === "price_desc") list.sort((a, b) => b.price - a.price);
    if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [search, activeCategory, sortBy]);

  const activeCategoryName = activeCategory
    ? CATEGORIES.find((c) => c.id === activeCategory)?.name
    : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar title={activeCategoryName || "Catalog"} />

      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search products, brands…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border transition-colors",
              !activeCategory
                ? "bg-brand-500 text-white border-brand-500"
                : "bg-card text-muted-foreground border-border hover:border-brand-300"
            )}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border transition-colors whitespace-nowrap",
                activeCategory === cat.id
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-card text-muted-foreground border-border hover:border-brand-300"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sort + count row */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "product" : "products"}
            {activeCategoryName && <span className="text-foreground font-medium"> in {activeCategoryName}</span>}
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl border border-input bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="default">Default</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        {/* Product grid */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Search className="h-8 w-8" />}
            title="No products found"
            description={
              search
                ? `No results for "${search}". Try a different keyword.`
                : "No products in this category yet."
            }
            action={
              search || activeCategory
                ? {
                    label: "Clear filters",
                    onClick: () => { setSearch(""); setActiveCategory(null); },
                  }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      <RetailerBottomNav />
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}
