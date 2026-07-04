"use client";
import { Settings, Bell, Shield, Database, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

export default function AdminSettingsPage() {
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
              <Input key={f.label} label={f.label} defaultValue={f.value} />
            ))}
            <Button size="md">Save {section.title}</Button>
          </CardContent>
        </Card>
      ))}

      {/* AI features placeholder */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-brand-500" />
            <CardTitle>AI & Automation</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            "Smart restock suggestions",
            "Demand forecasting",
            "Retailer segmentation",
            "Promo recommendation engine",
          ].map((feature) => (
            <div key={feature} className="flex items-center justify-between rounded-xl border border-dashed border-brand-200 bg-brand-50/50 px-4 py-3">
              <span className="text-sm font-medium text-foreground">{feature}</span>
              <span className="rounded-full border border-brand-200 bg-brand-100 px-2.5 py-0.5 text-[10px] font-semibold text-brand-600">
                Coming soon
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
