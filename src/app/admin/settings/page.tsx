"use client";
// v2
import { useState } from "react";
import { Settings, Database, Zap, Brain, TrendingUp, Users, Tag, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SECTIONS = [
  {
    icon: Settings, title: "General",
    fields: [
      { label: "Platform name", value: "Ka Sari-Sari" },
      { label: "Support email", value: "support@kasarisari.ph" },
      { label: "Support phone", value: "+63 2 8XXX XXXX" },
    ],
  },
  {
    icon: Database, title: "Delivery",
    fields: [
      { label: "Standard delivery fee (PHP)", value: "80" },
      { label: "Free delivery threshold (PHP)", value: "" },
      { label: "Delivery days (comma-separated)", value: "Mon,Tue,Wed,Thu,Fri,Sat" },
    ],
  },
];

interface AiFeature {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  detail: string;
  configFields?: { label: string; value: string; hint?: string }[];
}

const AI_FEATURES: AiFeature[] = [
  {
    id: "restock",
    icon: TrendingUp,
    title: "Smart Restock Suggestions",
    description: "AI predicts what each retailer needs to reorder and when, based on historical sales velocity.",
    detail: "Analyzes 90-day order patterns per retailer. Generates restock alerts 3 days before projected stockout. Shown on retailer dashboard and your fulfillment view.",
    configFields: [
      { label: "Alert lead time (days)", value: "3", hint: "Days before projected stockout to trigger alert" },
      { label: "Minimum order history (days)", value: "30", hint: "Minimum days of data before enabling predictions" },
    ],
  },
  {
    id: "forecast",
    icon: Brain,
    title: "Demand Forecasting",
    description: "Predicts category-level demand for the next 30 days to guide your purchasing decisions.",
    detail: "Uses seasonal trends, holidays, and growth trajectories. Output feeds directly into the Forecast page under Reports. Refresh weekly on Monday 6AM.",
    configFields: [
      { label: "Forecast horizon (days)", value: "30", hint: "How many days ahead to predict" },
      { label: "Confidence threshold (%)", value: "70", hint: "Minimum confidence to show a forecast" },
    ],
  },
  {
    id: "segmentation",
    icon: Users,
    title: "Retailer Segmentation",
    description: "Automatically groups retailers by behavior: order frequency, basket size, and category mix.",
    detail: "Segments update daily. Groups: Champions (top 20%), Growing, At-Risk, Dormant. Used to personalize promotions and priority delivery slots.",
    configFields: [
      { label: "Dormant threshold (days)", value: "60", hint: "Days without order to mark retailer as Dormant" },
    ],
  },
  {
    id: "promo",
    icon: Tag,
    title: "Promo Recommendation Engine",
    description: "Suggests targeted promotions to specific retailer segments to increase order value.",
    detail: "Generates promo bundles based on co-purchase patterns. Recommendations appear in the Deals section and can be pushed via WhatsApp. Requires segmentation to be enabled.",
    configFields: [
      { label: "Max promos per retailer per week", value: "3", hint: "Caps notifications to avoid fatigue" },
      { label: "Min margin to recommend (%)", value: "15", hint: "Only suggest promos that preserve this margin" },
    ],
  },
];

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={enabled}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
        enabled ? "bg-brand-500" : "bg-surface-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition-transform",
          enabled ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function AiFeatureRow({ feature }: { feature: AiFeature }) {
  const [enabled, setEnabled] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className={cn(
      "rounded-xl border transition-colors",
      enabled ? "border-brand-200 bg-brand-50/40" : "border-border bg-card"
    )}>
      {/* Header row */}
      <div className="flex items-start gap-3 px-4 py-4">
        <div className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5",
          enabled ? "bg-brand-100 dark:bg-brand-700 text-brand-600 dark:text-white" : "bg-surface-100 dark:bg-surface-800 text-muted-foreground"
        )}>
          <feature.icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{feature.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{feature.description}</p>
            </div>
            <Toggle enabled={enabled} onToggle={() => setEnabled(!enabled)} />
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-2 text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Less details" : "How it works"}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border px-4 py-4 space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">{feature.detail}</p>

          {enabled && feature.configFields && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide">Configuration</p>
              {feature.configFields.map((field) => (
                <div key={field.label}>
                  <Input label={field.label} defaultValue={field.value} />
                  {field.hint && <p className="text-[11px] text-muted-foreground mt-1">{field.hint}</p>}
                </div>
              ))}
              <Button size="sm" onClick={handleSave} className="flex items-center gap-1.5">
                {saved ? <><Check className="h-3.5 w-3.5" /> Saved!</> : "Save configuration"}
              </Button>
            </div>
          )}

          {!enabled && (
            <div className="rounded-lg bg-surface-100 border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground">
              Enable this feature to configure its settings.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  // Controlled field values: { [sectionTitle]: { [fieldLabel]: value } }
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>(
    () =>
      Object.fromEntries(
        SECTIONS.map((s) => [s.title, Object.fromEntries(s.fields.map((f) => [f.label, f.value]))])
      )
  );
  const [savedSections, setSavedSections] = useState<Record<string, boolean>>({});
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});

  function updateField(section: string, label: string, value: string) {
    setFieldValues((prev) => ({
      ...prev,
      [section]: { ...prev[section], [label]: value },
    }));
  }

  async function handleSaveSection(title: string) {
    setSaveErrors((prev) => ({ ...prev, [title]: "" }));
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: title, fields: fieldValues[title] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSavedSections((prev) => ({ ...prev, [title]: true }));
      setTimeout(() => setSavedSections((prev) => ({ ...prev, [title]: false })), 2000);
    } catch (err) {
      setSaveErrors((prev) => ({
        ...prev,
        [title]: err instanceof Error ? err.message : "Failed to save",
      }));
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Platform configuration and preferences</p>
      </div>

      {SECTIONS.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <section.icon className="h-4 w-4 text-brand-500" />
              <CardTitle>{section.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.fields.map((f) => (
              <Input
                key={f.label}
                label={f.label}
                value={fieldValues[section.title]?.[f.label] ?? f.value}
                onChange={(e) => updateField(section.title, f.label, e.target.value)}
              />
            ))}
            {saveErrors[section.title] && (
              <p className="text-sm text-danger-600">{saveErrors[section.title]}</p>
            )}
            <Button size="md" onClick={() => handleSaveSection(section.title)} className="flex items-center gap-1.5">
              {savedSections[section.title] ? <><Check className="h-4 w-4" /> Saved!</> : `Save ${section.title}`}
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* AI & Automation */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-brand-500" />
            <CardTitle>AI & Automation</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Enable AI-powered features to automate insights and grow retailer loyalty. Each feature can be configured independently.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {AI_FEATURES.map((feature) => (
            <AiFeatureRow key={feature.id} feature={feature} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
