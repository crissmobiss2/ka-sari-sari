"use client";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal, AlertCircle } from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { ProductCard } from "@/components/products/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PRODUCTS, CATEGORIES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { Product, Category } from "@/types";

function CatalogContent() {
  const searchParams = useSearchParams();
  const urlCategorySlug = searchParams.get("category");

  // Product + category data — starts empty; populated from API on mount (falls back to mock on error)
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc" | "name">("default");

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),
      fetch("/api/categories").then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); }),
    ])
      .then(([prodData, catData]) => {
        const prods: Product[] =
          Array.isArray(prodData?.products) && prodData.products.length > 0
            ? prodData.products
            : Array.isArray(prodData) && prodData.length > 0
            ? prodData
            : PRODUCTS;
        const cats: Category[] =
          Array.isArray(catData?.categories) && catData.categories.length > 0
            ? catData.categories
            : Array.isArray(catData) && catData.length > 0
            ? catData
            : CATEGORIES;
        setProducts(prods);
        setCategories(cats);
        // Apply URL pre-selection once categories are known
        if (urlCategorySlug) {
          const cat = cats.find((c) => c.slug === urlCategorySlug || c.id === urlCategorySlug);
          if (cat) setActiveCategory(cat.id);
        }
      })
      .catch(() => {
        // API unavailable — fall back to mock data so the catalog still works
        setFetchError(true);
        setProducts(PRODUCTS);
        setCategories(CATEGORIES);
        if (urlCategorySlug) {
          const cat = CATEGORIES.find((c) => c.slug === urlCategorySlug || c.id === urlCategorySlug);
          if (cat) setActiveCategory(cat.id);
        }
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let list = [...products];
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
  }, [products, search, activeCategory, sortBy]);

  const activeCategoryName = activeCategory
    ? categories.find((c) => c.id === activeCategory)?.name
    : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar title={activeCategoryName || "Catalog"} />

      <div className="px-4 py-4 space-y-4">
        {/* Non-blocking error notice when API failed and mock data is shown */}
        {fetchError && (
          <div className="flex items-center gap-2 rounded-xl bg-warning-50 dark:bg-warning-500/10 border border-warning-200 px-4 py-3 text-sm text-warning-700 dark:text-foreground">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Showing demo catalog — could not load live products.
          </div>
        )}

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
                ? "bg-brand-700 text-white border-brand-500"
                : "bg-card text-muted-foreground border-border hover:border-brand-300"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold border transition-colors whitespace-nowrap",
                activeCategory === cat.id
                  ? "bg-brand-700 text-white border-brand-500"
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
            {loading
              ? "Loading…"
              : (
                <>
                  {filtered.length} {filtered.length === 1 ? "product" : "products"}
                  {activeCategoryName && (
                    <span className="text-foreground font-medium"> in {activeCategoryName}</span>
                  )}
                </>
              )}
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl border border-input bg-card px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="default">Default</option>
            <option value="price_asc">Price: Low ? High</option>
            <option value="price_desc">Price: High ? Low</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        {/* Product grid — skeleton while loading, empty state, or real grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card shadow-card overflow-hidden animate-pulse"
              >
                <div className="h-32 bg-surface-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 rounded bg-surface-200 w-3/4" />
                  <div className="h-3 rounded bg-surface-200 w-1/2" />
                  <div className="h-5 rounded bg-surface-200 w-1/3 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
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
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-brand-700 border-t-transparent" />
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}
