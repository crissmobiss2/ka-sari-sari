"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Flame,
  Lightbulb,
  ShieldAlert,
  Zap,
  Package,
  ShoppingCart,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toastSuccess, toastInfo, toastError } from "@/store/toast";
import { MOCK_ORDERS, PRODUCTS, CATEGORIES } from "@/lib/mock-data";

// -- Types ---------------------------------------------------------------------

// Claude AI forecast shape
interface AiReorder {
  productName: string;
  urgency: "critical" | "high" | "medium";
  suggestedQty: number;
  reason: string;
}

interface AiSeasonalAlert {
  alert: string;
  affectedProducts: string[];
}

interface AiForecast {
  topReorders: AiReorder[];
  seasonalAlerts: AiSeasonalAlert[];
  insights: string;
}

type ActionType = "URGENT" | "Reorder" | "Watch" | "OK";

interface ForecastRow {
  name: string;
  category: string;
  currentStock: number;
  forecastUnits: number;
  trendPct: number;
  confidence: number;
  action: ActionType;
}

interface CategoryForecast {
  name: string;
  changePct: number;
}

interface AiInsight {
  icon: React.ReactNode;
  text: string;
  borderColor: string;
  bgColor: string;
}

interface VelocityEntry {
  productId: string;
  name: string;
  category: string;
  velocity: number; // total order-line appearances across all orders
  totalQty: number; // total units ordered
  stock: number;
}

interface StockoutEntry extends VelocityEntry {
  daysRemaining: number;
}

interface ReorderEntry extends VelocityEntry {
  suggestedQty: number;
}

// -- Static forecast data -------------------------------------------------------

const FORECAST_ROWS: ForecastRow[] = [
  { name: "Coca-Cola Regular 330ml",    category: "Beverages",      currentStock: 142, forecastUnits: 168, trendPct:  18, confidence: 96, action: "Reorder" },
  { name: "Lucky Me! Pancit Canton",    category: "Instant Noodles", currentStock:  89, forecastUnits: 112, trendPct:  26, confidence: 91, action: "Reorder" },
  { name: "Piattos Cheese 85g",         category: "Snacks",         currentStock: 203, forecastUnits: 195, trendPct:  -4, confidence: 88, action: "Watch"   },
  { name: "555 Sardines Tomato 155g",   category: "Canned Goods",   currentStock:  56, forecastUnits:  94, trendPct:  68, confidence: 85, action: "URGENT"  },
  { name: "Nescaf� 3-in-1 Original",   category: "Coffee",         currentStock:  78, forecastUnits:  89, trendPct:  14, confidence: 93, action: "Reorder" },
  { name: "Safeguard Classic Bar",      category: "Personal Care",  currentStock:  34, forecastUnits:  67, trendPct:  97, confidence: 79, action: "URGENT"  },
  { name: "Silver Swan Soy Sauce 1L",  category: "Condiments",     currentStock: 112, forecastUnits:  98, trendPct: -12, confidence: 87, action: "OK"      },
  { name: "Surf Powder Detergent",      category: "Household",      currentStock: 167, forecastUnits: 145, trendPct: -13, confidence: 84, action: "OK"      },
  { name: "Milo Active Go 600g",        category: "Beverages",      currentStock:  23, forecastUnits:  51, trendPct: 122, confidence: 72, action: "URGENT"  },
  { name: "Bear Brand Sterilized 300ml",category: "Dairy",          currentStock:  91, forecastUnits:  88, trendPct:  -3, confidence: 89, action: "Watch"   },
];

const CATEGORY_FORECASTS: CategoryForecast[] = [
  { name: "Beverages",       changePct:  22 },
  { name: "Instant Noodles", changePct:  18 },
  { name: "Personal Care",   changePct:  31 },
  { name: "Snacks",          changePct:   5 },
  { name: "Canned Goods",    changePct:  44 },
  { name: "Condiments",      changePct:  -8 },
];

const MAX_ABS_PCT = Math.max(...CATEGORY_FORECASTS.map((c) => Math.abs(c.changePct)));

// -- Helpers --------------------------------------------------------------------

function actionStyles(action: ActionType): string {
  switch (action) {
    case "URGENT":  return "bg-danger-50 dark:bg-danger-500/10 text-danger-600 dark:text-foreground border border-danger-200";
    case "Reorder": return "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-foreground border border-brand-200";
    case "Watch":   return "bg-warning-50 dark:bg-warning-500/10 text-warning-600 dark:text-foreground border border-warning-200";
    case "OK":      return "bg-surface-100 dark:bg-surface-800 text-muted-foreground";
  }
}

function urgencyBadgeClass(urgency: AiReorder["urgency"]): string {
  switch (urgency) {
    case "critical": return "bg-danger-50 dark:bg-danger-500/10 text-danger-600 dark:text-foreground border border-danger-200";
    case "high":     return "bg-warning-50 dark:bg-warning-500/10 text-warning-700 dark:text-foreground border border-warning-200";
    case "medium":   return "bg-info-50 dark:bg-info-500/10 text-info-600 dark:text-foreground border border-info-200";
  }
}

function confidenceBarColor(pct: number): string {
  if (pct >= 90) return "bg-success-700 dark:bg-success-500";
  if (pct >= 80) return "bg-amber-700 dark:bg-amber-500";
  return "bg-danger-700 dark:bg-danger-500";
}

function exportCSV() {
  const header = ["Product", "Category", "Current Stock", "14-Day Forecast", "Trend %", "Confidence %", "Action"];
  const rows = FORECAST_ROWS.map((r) => [
    `"${r.name}"`,
    r.category,
    r.currentStock,
    r.forecastUnits,
    r.trendPct > 0 ? `+${r.trendPct}%` : `${r.trendPct}%`,
    `${r.confidence}%`,
    r.action,
  ]);
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ka-sari-sari-demand-forecast.csv";
  a.click();
  URL.revokeObjectURL(url);
  toastSuccess("Forecast report exported as CSV");
}

// -- Sub-components -------------------------------------------------------------

function SummaryCard({
  label,
  value,
  sub,
  icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", iconBg, iconColor)}>
          {icon}
        </div>
      </div>
      <p className="font-display text-2xl font-bold text-foreground leading-none">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
    </Card>
  );
}

function ConfidenceBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-surface-100 dark:bg-surface-800 overflow-hidden">
        <div
          className={cn("h-full rounded-full", confidenceBarColor(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium text-foreground tabular-nums">{pct}%</span>
    </div>
  );
}

// -- Page ----------------------------------------------------------------------

export default function AdminForecastPage() {

  // -- Claude AI forecast state ----------------------------------------------
  const [aiData, setAiData] = useState<AiForecast | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [isMockData, setIsMockData] = useState(false);

  const fetchForecast = useCallback(async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/admin/forecast");
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setAiData(data.forecast as AiForecast);
      setIsMockData(data.source === "mock");
    } catch {
      toastError("Could not load AI forecast");
    } finally {
      setAiLoading(false);
    }
  }, []);

  useEffect(() => { fetchForecast(); }, [fetchForecast]);

  // -- Velocity computation from MOCK_ORDERS --------------------------------
  const velocityData = useMemo<VelocityEntry[]>(() => {
    // Build a map: productId -> { appearances (order-line count), totalQty }
    const velocityMap = new Map<string, { velocity: number; totalQty: number }>();

    for (const order of MOCK_ORDERS) {
      for (const item of order.items) {
        const existing = velocityMap.get(item.productId);
        if (existing) {
          existing.velocity += 1;
          existing.totalQty += item.quantity;
        } else {
          velocityMap.set(item.productId, { velocity: 1, totalQty: item.quantity });
        }
      }
    }

    // Build a product lookup
    const productMap = new Map(PRODUCTS.map((p) => [p.id, p]));

    // Enrich with product details and sort by velocity descending
    const entries: VelocityEntry[] = [];
    for (const [productId, { velocity, totalQty }] of velocityMap) {
      const product = productMap.get(productId);
      if (!product) continue;
      // Resolve category name from categoryId
      const categoryNames: Record<string, string> = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.name]));
      entries.push({
        productId,
        name: product.name,
        category: categoryNames[product.categoryId] ?? product.categoryId,
        velocity,
        totalQty,
        stock: product.stock,
      });
    }

    return entries.sort((a, b) => b.velocity - a.velocity);
  }, []);

  // Top 5 high-velocity items
  const highVelocityItems = useMemo(() => velocityData.slice(0, 5), [velocityData]);

  // Predicted stockouts: stock < velocity * 7
  const stockoutItems = useMemo<StockoutEntry[]>(() => {
    return velocityData
      .filter((item) => item.velocity > 0 && item.stock < item.velocity * 7)
      .map((item) => ({
        ...item,
        daysRemaining: item.velocity > 0 ? Math.floor(item.stock / item.velocity) : 999,
      }))
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [velocityData]);

  // Recommended purchase quantities: at-risk products, suggested = velocity * 30
  const reorderItems = useMemo<ReorderEntry[]>(() => {
    return stockoutItems.map((item) => ({
      ...item,
      suggestedQty: item.velocity * 30,
    }));
  }, [stockoutItems]);

  const insights: AiInsight[] = [
    {
      icon: <Flame className="h-4 w-4 text-danger-600 dark:text-danger-500 shrink-0 mt-0.5" />,
      text: "Surge detected: Canned Goods demand up 44% � holiday season correlation identified across order history.",
      borderColor: "border-danger-400",
      bgColor: "bg-danger-50 dark:bg-danger-500/10/60",
    },
    {
      icon: <ShieldAlert className="h-4 w-4 text-warning-600 shrink-0 mt-0.5" />,
      text: "Restock alert: 3 products may stockout within 7 days based on current order velocity and forecast trajectory.",
      borderColor: "border-warning-400",
      bgColor: "bg-warning-50 dark:bg-warning-500/10/60",
    },
    {
      icon: <Lightbulb className="h-4 w-4 text-brand-700 dark:text-brand-400 shrink-0 mt-0.5" />,
      text: "Opportunity: Personal Care up 31% � consider stocking Dove and Palmolive variants to capture demand upside.",
      borderColor: "border-brand-400",
      bgColor: "bg-brand-50 dark:bg-brand-500/10/60",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* -- Header ------------------------------------------------------------ */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5">
            <TrendingUp className="h-6 w-6 text-brand-700 dark:text-brand-400" />
            <h1 className="font-display text-2xl font-bold text-foreground">AI Demand Forecast</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Powered by order history analysis</p>
          <p className="text-xs text-muted-foreground mt-0.5">Last updated: Jan 21, 2026 at 10:32 AM</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => { toastInfo("Generating PDF report�"); window.print(); }}>
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button
            size="sm"
            className="bg-brand-700 dark:bg-brand-500 hover:bg-brand-800 text-white"
            onClick={() => { fetchForecast(); toastSuccess("Refreshing AI forecast�"); }}
            disabled={aiLoading}
          >
            <RefreshCw className={cn("h-4 w-4", aiLoading && "animate-spin")} />
            {aiLoading ? "Generating�" : "Refresh Forecast"}
          </Button>
        </div>
      </div>

      {/* -- Summary cards ----------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Stockout Risk"
          value={`${stockoutItems.length} product${stockoutItems.length !== 1 ? "s" : ""}`}
          sub="require immediate action"
          icon={<AlertTriangle className="h-5 w-5" />}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <SummaryCard
          label="High Velocity Items"
          value={`${highVelocityItems.length} products`}
          sub="most frequently ordered"
          icon={<TrendingUp className="h-5 w-5" />}
          iconBg="bg-brand-50 dark:bg-brand-500/10"
          iconColor="text-brand-700 dark:text-brand-400"
        />
        <SummaryCard
          label="Forecast Accuracy"
          value="94.2%"
          sub="based on 90-day backtest"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconBg="bg-success-50 dark:bg-success-500/10"
          iconColor="text-success-700 dark:text-success-500"
        />
        <SummaryCard
          label="Forecast Period"
          value="Next 14 days"
          sub="Jan 22 � Feb 4, 2026"
          icon={<Calendar className="h-5 w-5" />}
          iconBg="bg-surface-100 dark:bg-surface-800"
          iconColor="text-muted-foreground"
        />
      </div>

      {/* -- AI Forecast section ------------------------------------------------- */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
                <Sparkles className="h-4 w-4 text-brand-700 dark:text-brand-400" />
              </div>
              <div>
                <CardTitle className="text-base">AI Recommendations</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Real-time demand insights from AI analysis</p>
              </div>
            </div>
            {isMockData && (
              <span className="text-[11px] text-muted-foreground bg-muted rounded-lg px-2.5 py-1">
                Using demo data � connect AI API for live forecasting
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {aiLoading ? (
            <div className="flex items-center gap-3 py-6 justify-center">
              <Sparkles className="h-4 w-4 text-brand-700 dark:text-brand-400 animate-pulse" />
              <span className="text-sm text-muted-foreground">Analyzing demand data�</span>
            </div>
          ) : aiData ? (
            <div className="space-y-5">
              {/* Top reorders list */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Top Reorder Recommendations</p>
                <div className="space-y-2">
                  {aiData.topReorders.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400 text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-tight">{item.productName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.reason}</p>
                      </div>
                      <div className="shrink-0 text-right space-y-1">
                        <span className={cn("inline-block text-xs font-semibold rounded-full px-2 py-0.5 capitalize", urgencyBadgeClass(item.urgency))}>
                          {item.urgency}
                        </span>
                        <p className="text-xs font-bold text-success-700 dark:text-success-500 tabular-nums">+{item.suggestedQty} units</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seasonal alerts */}
              {aiData.seasonalAlerts.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Seasonal Alerts</p>
                  <div className="space-y-2">
                    {aiData.seasonalAlerts.map((alert, i) => (
                      <div key={i} className="rounded-xl bg-warning-50 dark:bg-warning-500/10/60 border border-warning-200 p-3.5">
                        <div className="flex items-start gap-2">
                          <TriangleAlert className="h-4 w-4 text-warning-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{alert.alert}</p>
                            {alert.affectedProducts.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Affects: {alert.affectedProducts.join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Insights text */}
              {aiData.insights && (
                <div className="rounded-xl bg-brand-50 dark:bg-brand-500/10/60 border border-brand-200 p-3.5">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-brand-700 dark:text-brand-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground leading-relaxed">{aiData.insights}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">No forecast data available</p>
          )}
        </CardContent>
      </Card>

      {/* -- Velocity-driven intelligence cards -------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* High Velocity Items */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-500/10">
                <Zap className="h-4 w-4 text-brand-700 dark:text-brand-400" />
              </div>
              <div>
                <CardTitle className="text-base">High Velocity Items</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Top 5 most-ordered products</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2.5">
            {highVelocityItems.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No order data available</p>
            ) : (
              highVelocityItems.map((item, idx) => (
                <div key={item.productId} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400 text-xs font-bold">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-tight truncate">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.category}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge variant="neutral" className="text-xs tabular-nums font-semibold">
                      {item.velocity}� ordered
                    </Badge>
                    <p className="text-[11px] text-muted-foreground mt-0.5 text-right">{item.totalQty} units</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Predicted Stockouts */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-base">Predicted Stockouts</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Stock below 7-day velocity threshold</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2.5">
            {stockoutItems.length === 0 ? (
              <div className="flex items-center gap-2 py-4 justify-center">
                <CheckCircle2 className="h-4 w-4 text-success-700 dark:text-success-500" />
                <p className="text-sm text-muted-foreground">All products have sufficient stock</p>
              </div>
            ) : (
              stockoutItems.map((item) => {
                const isUrgent = item.daysRemaining <= 3;
                return (
                  <div key={item.productId} className={cn(
                    "rounded-lg p-2.5 border",
                    isUrgent
                      ? "bg-danger-50 dark:bg-danger-500/10/60 border-danger-200"
                      : "bg-warning-50 dark:bg-warning-500/10/40 border-warning-200"
                  )}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground leading-tight">{item.name}</p>
                      <Badge
                        variant={isUrgent ? "danger" : "warning"}
                        className="shrink-0 text-[11px] font-semibold"
                      >
                        {item.daysRemaining} day{item.daysRemaining !== 1 ? "s" : ""} left
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {item.stock} units in stock � velocity {item.velocity}�
                    </p>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Recommended Purchase Quantities */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-50 dark:bg-success-500/10">
                <ShoppingCart className="h-4 w-4 text-success-700 dark:text-success-500" />
              </div>
              <div>
                <CardTitle className="text-base">Recommended Reorders</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">30-day buffer for at-risk products</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-2.5">
            {reorderItems.length === 0 ? (
              <div className="flex items-center gap-2 py-4 justify-center">
                <Package className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No reorders needed</p>
              </div>
            ) : (
              reorderItems.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-tight truncate">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{item.stock} in stock</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-success-700 dark:text-success-500 tabular-nums">+{item.suggestedQty}</p>
                    <p className="text-[11px] text-muted-foreground">units to order</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* -- Demand forecast table ---------------------------------------------- */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle>Product Demand Forecast</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">14-day projected demand vs. current stock levels</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-danger-700 dark:bg-danger-500" />URGENT
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-brand-700 dark:bg-brand-500" />Reorder
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />Watch
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-surface-300" />OK
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left text-xs font-semibold text-muted-foreground">Product Name</th>
                  <th className="pb-3 text-left text-xs font-semibold text-muted-foreground pl-2">Category</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted-foreground">Current Stock</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted-foreground">14-Day Forecast</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted-foreground">Trend</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted-foreground pr-1">Confidence</th>
                  <th className="pb-3 text-right text-xs font-semibold text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {FORECAST_ROWS.map((row) => {
                  const isUp = row.trendPct > 0;
                  return (
                    <tr
                      key={row.name}
                      className={cn(
                        "border-b border-border last:border-0 transition-colors",
                        row.action === "URGENT"
                          ? "bg-danger-50 dark:bg-danger-500/10/30 hover:bg-danger-50 dark:bg-danger-500/10/50"
                          : "hover:bg-surface-50 dark:bg-surface-900"
                      )}
                    >
                      {/* Product name */}
                      <td className="py-3.5 pr-3">
                        <p className="font-medium text-foreground leading-tight">{row.name}</p>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 pl-2 pr-3">
                        <span className="inline-block text-xs text-muted-foreground bg-surface-100 dark:bg-surface-800 rounded-md px-2 py-0.5 whitespace-nowrap">
                          {row.category}
                        </span>
                      </td>

                      {/* Current stock */}
                      <td className="py-3.5 text-right tabular-nums text-foreground font-medium">
                        {row.currentStock}
                      </td>

                      {/* 14-day forecast */}
                      <td className="py-3.5 text-right tabular-nums font-semibold text-foreground">
                        {row.forecastUnits} units
                      </td>

                      {/* Trend */}
                      <td className="py-3.5 text-right">
                        <span
                          className={cn(
                            "text-xs font-semibold tabular-nums",
                            isUp ? "text-success-700 dark:text-success-500" : "text-danger-600 dark:text-danger-500"
                          )}
                        >
                          {isUp ? "?" : "?"} {isUp ? "+" : ""}{row.trendPct}%
                        </span>
                      </td>

                      {/* Confidence bar */}
                      <td className="py-3.5 pr-2">
                        <div className="flex justify-end">
                          <ConfidenceBar pct={row.confidence} />
                        </div>
                      </td>

                      {/* Action pill */}
                      <td className="py-3.5 text-right">
                        <span
                          className={cn(
                            "inline-block text-xs font-semibold rounded-full px-2.5 py-0.5",
                            actionStyles(row.action)
                          )}
                        >
                          {row.action}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* -- Category chart + AI Insights --------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Category bar chart � 3/5 width */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle>Category Demand Forecast</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Projected 14-day demand change vs. last period</p>
          </CardHeader>
          <CardContent className="pt-2 space-y-3.5">
            {CATEGORY_FORECASTS.map((cat) => {
              const isPos = cat.changePct >= 0;
              const barWidthPct = (Math.abs(cat.changePct) / MAX_ABS_PCT) * 100;
              return (
                <div key={cat.name} className="flex items-center gap-3">
                  {/* Category label */}
                  <span className="text-sm text-muted-foreground w-36 shrink-0 truncate">{cat.name}</span>

                  {/* Bar track */}
                  <div className="flex-1 h-6 rounded-lg bg-surface-100 dark:bg-surface-800 overflow-hidden relative">
                    <div
                      className={cn(
                        "h-full rounded-lg transition-all",
                        isPos
                          ? "bg-gradient-to-r from-brand-600 to-brand-700"
                          : "bg-gradient-to-r from-danger-600 to-danger-700"
                      )}
                      style={{ width: `${barWidthPct}%` }}
                    />
                  </div>

                  {/* Percentage */}
                  <span
                    className={cn(
                      "text-sm font-bold w-14 text-right shrink-0 tabular-nums",
                      isPos ? "text-brand-600" : "text-danger-600 dark:text-danger-500"
                    )}
                  >
                    {isPos ? "+" : ""}{cat.changePct}%
                  </span>
                </div>
              );
            })}

            {/* Legend */}
            <div className="flex items-center gap-4 pt-2 border-t border-border mt-2">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-brand-700 dark:bg-brand-500" />
                <span className="text-xs text-muted-foreground">Demand increase</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-danger-700 dark:bg-danger-500" />
                <span className="text-xs text-muted-foreground">Demand decrease</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Insights � 2/5 width */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle>AI Insights</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Generated from order history analysis</p>
          </CardHeader>
          <CardContent className="pt-2 space-y-3">
            {insights.map((ins, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2.5 rounded-xl p-3.5 border-l-4",
                  ins.bgColor,
                  ins.borderColor
                )}
              >
                {ins.icon}
                <p className="text-xs text-foreground leading-relaxed">{ins.text}</p>
              </div>
            ))}

            {/* Footer note */}
            <div className="pt-2 border-t border-border">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Insights are generated using 90 days of order history. Forecasts reflect trend signals and may not account for unplanned supply events.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
