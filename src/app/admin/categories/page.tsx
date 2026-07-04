"use client";
import { Plus, Edit2, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/mock-data";

export default function AdminCategoriesPage() {
  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{CATEGORIES.length} product categories</p>
        </div>
        <Button size="md"><Plus className="h-4 w-4" /> Add Category</Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((cat) => (
          <Card key={cat.id} className="p-5 hover:shadow-card-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 shrink-0">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-sm font-semibold text-foreground">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat.productCount} products</p>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
            {cat.description && (
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
            )}
            <div className="mt-3 flex items-center justify-between">
              <Badge variant={cat.isActive ? "success" : "neutral"}>
                {cat.isActive ? "Active" : "Hidden"}
              </Badge>
              <span className="text-xs text-muted-foreground">Order #{cat.sortOrder}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
