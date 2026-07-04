"use client";

import { useState } from "react";
import { ScanLine, Search, CheckCircle2, XCircle, Plus, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PRODUCTS, CATEGORIES } from "@/lib/mock-data";

function getStock(productId: string): number {
  const n = productId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return (n * 7 + 13) % 201;
}

type ScanEntry = {
  id: string;
  productName: string;
  quantity: number;
  scannedAt: Date;
};

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return "Just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function ScanPage() {
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchedValue, setSearchedValue] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [logged, setLogged] = useState(false);
  const [recentScans, setRecentScans] = useState<ScanEntry[]>([]);

  const foundProduct = searchedValue
    ? PRODUCTS.find(
        (p) =>
          p.id.toLowerCase().includes(searchedValue.toLowerCase()) ||
          p.name.toLowerCase().includes(searchedValue.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchedValue.toLowerCase())
      )
    : null;

  const notFound = searchedValue && !foundProduct && !loading;

  function handleSearch() {
    if (!barcode.trim()) return;
    setLoading(true);
    setLogged(false);
    setQuantity(1);
    setTimeout(() => {
      setSearchedValue(barcode.trim());
      setLoading(false);
    }, 800);
  }

  function handleLogReceipt() {
    if (!foundProduct) return;
    const entry: ScanEntry = {
      id: foundProduct.id,
      productName: foundProduct.name,
      quantity,
      scannedAt: new Date(),
    };
    setRecentScans((prev) => [entry, ...prev].slice(0, 5));
    setLogged(true);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Scan Product</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Point camera at barcode or enter SKU manually
        </p>
      </div>

      {/* Camera viewfinder */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative aspect-square w-full max-w-sm rounded-2xl border-2 border-brand-500 bg-black overflow-hidden flex items-center justify-center">
          <ScanLine className="h-16 w-16 text-brand-500/60" />
          <div
            className="absolute left-0 right-0 h-0.5 bg-brand-500/40"
            style={{ animation: "scanline 2s ease-in-out infinite" }}
          />
          <style>{`
            @keyframes scanline {
              0%, 100% { top: 10%; }
              50% { top: 90%; }
            }
          `}</style>
        </div>
        <p className="text-xs text-muted-foreground">Camera access required</p>
      </div>

      {/* Manual search */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Or enter barcode / SKU manually</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. CC-330-REG or prod-1"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Button onClick={handleSearch} disabled={loading || !barcode.trim()}>
            <Search className="h-4 w-4" />
            {loading ? "Searching…" : "Search"}
          </Button>
        </div>
      </div>

      {/* Search result */}
      {loading && (
        <Card>
          <CardContent className="p-6 flex items-center justify-center gap-3">
            <div className="h-5 w-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            <span className="text-sm text-muted-foreground">Looking up product…</span>
          </CardContent>
        </Card>
      )}

      {notFound && (
        <Card>
          <CardContent className="p-6 flex flex-col items-center gap-2 text-center">
            <XCircle className="h-10 w-10 text-danger-500" />
            <p className="font-semibold text-foreground">Product not found</p>
            <p className="text-sm text-muted-foreground">
              No match for &ldquo;{searchedValue}&rdquo;. Check the SKU or barcode and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {foundProduct && !loading && (
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Product info */}
            <div className="space-y-1">
              <p className="font-semibold text-base text-foreground">{foundProduct.name}</p>
              <p className="text-sm text-muted-foreground">{foundProduct.brand}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {(() => {
                  const cat = CATEGORIES.find((c) => c.id === foundProduct.categoryId);
                  return cat ? <Badge variant="neutral">{cat.name}</Badge> : null;
                })()}
                <span className="text-xs font-mono text-muted-foreground">{foundProduct.sku}</span>
              </div>
            </div>

            {/* Stock level */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Current stock:</span>
              <span
                className={cn(
                  "font-bold text-lg",
                  getStock(foundProduct.id) === 0
                    ? "text-danger-500"
                    : getStock(foundProduct.id) <= 20
                    ? "text-warning-600"
                    : "text-success-600"
                )}
              >
                {getStock(foundProduct.id)}
              </span>
              <span className="text-sm text-muted-foreground">{foundProduct.unit}s</span>
            </div>

            {/* Quantity input */}
            {!logged && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Quantity to receive</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="h-9 w-9 rounded-xl border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="h-9 w-9 rounded-xl border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <Button className="w-full" onClick={handleLogReceipt}>
                  Log Receipt
                </Button>
              </div>
            )}

            {/* Success state */}
            {logged && (
              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <CheckCircle2 className="h-10 w-10 text-success-700" />
                <p className="font-semibold text-success-700">Receipt logged!</p>
                <p className="text-sm text-muted-foreground">
                  {quantity} {foundProduct.unit}{quantity !== 1 ? "s" : ""} of {foundProduct.name} recorded.
                </p>
                <Button
                  variant="outline"
                  className="mt-1"
                  onClick={() => {
                    setBarcode("");
                    setSearchedValue("");
                    setLogged(false);
                    setQuantity(1);
                  }}
                >
                  Scan Another
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent scans */}
      {recentScans.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-foreground">Recent Scans</h2>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {recentScans.map((scan, idx) => (
                  <li
                    key={`${scan.id}-${scan.scannedAt.getTime()}`}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 gap-3",
                      idx === 0 && "rounded-t-2xl",
                      idx === recentScans.length - 1 && "rounded-b-2xl"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{scan.productName}</p>
                      <p className="text-xs text-muted-foreground">Qty: {scan.quantity}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {timeAgo(scan.scannedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
