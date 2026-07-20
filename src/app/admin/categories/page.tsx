"use client";
import { useState, useEffect } from "react";
import { Plus, Edit2, Tag, Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/mock-data";
import { toastSuccess, toastError } from "@/store/toast";
import type { Category } from "@/types";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (Array.isArray(data?.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});
  }, []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  function handleEditClick(cat: Category) {
    setEditingId(cat.id);
    setEditName(cat.name);
  }

  async function handleSave(id: string) {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, name: editName } : cat))
    );
    setEditingId(null);
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      if (!res.ok) { toastError("Failed to save — please refresh"); return; }
      toastSuccess("Category updated");
    } catch {
      toastError("Network error");
    }
  }

  function handleCancel() {
    setEditingId(null);
  }

  async function handleAddCategory() {
    const tempId = `cat-new-${Date.now()}`;
    const newCat: Category = {
      id: tempId,
      name: "New Category",
      slug: `new-category-${Date.now()}`,
      description: "",
      productCount: 0,
      isActive: true,
      sortOrder: categories.length + 1,
    };
    setCategories((prev) => [...prev, newCat]);
    setEditingId(tempId);
    setEditName("New Category");
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "New Category" }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.category?.id) {
          setCategories((prev) =>
            prev.map((c) => (c.id === tempId ? { ...c, id: data.category.id } : c))
          );
          setEditingId(data.category.id);
        }
      }
    } catch { /* keep temp id */ }
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{categories.length} product categories</p>
        </div>
        <Button size="md" onClick={handleAddCategory}>
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Card key={cat.id} className="p-5 hover:shadow-card-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-foreground shrink-0">
                  <Tag className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === cat.id ? (
                    <input
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-700"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSave(cat.id);
                        if (e.key === "Escape") handleCancel();
                      }}
                      autoFocus
                    />
                  ) : (
                    <p className="font-display text-sm font-semibold text-foreground truncate">{cat.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{cat.productCount} products</p>
                </div>
              </div>
              {editingId === cat.id ? (
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <button
                    onClick={() => handleSave(cat.id)}
                    className="text-brand-700 dark:text-brand-400 hover:text-brand-700 transition-colors"
                    title="Save"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleEditClick(cat)}
                  className="text-muted-foreground hover:text-foreground transition-colors ml-2 shrink-0"
                  title="Edit"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              )}
            </div>
            {editingId !== cat.id && cat.description && (
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
            )}
            {editingId === cat.id && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => handleSave(cat.id)}>Save</Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
              </div>
            )}
            {editingId !== cat.id && (
              <div className="mt-3 flex items-center justify-between">
                <Badge variant={cat.isActive ? "success" : "neutral"}>
                  {cat.isActive ? "Active" : "Hidden"}
                </Badge>
                <span className="text-xs text-muted-foreground">Order #{cat.sortOrder}</span>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}