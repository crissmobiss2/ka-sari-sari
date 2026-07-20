"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Store, MapPin, Phone, ArrowLeft, CheckCircle2, ChevronDown, Search, AlertCircle } from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NEXOFLOW_CITIES, isCovered, type NexoflowCity } from "@/lib/nexoflow-cities";

export default function StoreProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [cityOpen, setCityOpen] = useState(false);
  const [form, setForm] = useState({
    storeName: "Santos Sari-Sari Store",
    ownerName: "Maria Santos",
    phone: "+63 917 123 4567",
    barangay: "Brgy. San Jose",
    city: "Caloocan",
    province: "Metro Manila",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setForm((prev) => ({
            storeName: data.storeName ?? prev.storeName,
            ownerName: data.ownerName ?? data.name ?? prev.ownerName,
            phone: data.phone ?? prev.phone,
            barangay: data.barangay ?? prev.barangay,
            city: data.city ?? prev.city,
            province: data.province ?? prev.province,
          }));
        }
      } catch {
        // ignore fetch errors; use defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  const filtered = useMemo(() => {
    const q = citySearch.toLowerCase();
    if (!q) return NEXOFLOW_CITIES.slice(0, 20);
    return NEXOFLOW_CITIES.filter(
      (c) => c.city.toLowerCase().includes(q) || c.province.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [citySearch]);

  function selectCity(c: NexoflowCity) {
    set("city", c.city);
    set("province", c.province);
    setCityOpen(false);
    setCitySearch("");
  }

  const covered = isCovered(form.city);

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSaveError(body?.error ?? `Failed to save (${res.status}). Please try again.`);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setSaveError("Network error. Changes were not saved — please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar title="Store Profile" />

      <div className="px-4 py-5 space-y-5 max-w-xl mx-auto">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {saved && (
          <div className="flex items-center gap-2 rounded-xl bg-success-50 dark:bg-success-500/10 border border-success-500/25 dark:border-success-500/30 px-4 py-3 text-sm text-success-700 dark:text-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Store profile updated successfully.
          </div>
        )}

        {saveError && (
          <div className="flex items-center gap-2 rounded-xl bg-danger-50 dark:bg-danger-500/10 border border-danger-500/25 dark:border-danger-500/30 px-4 py-3 text-sm text-danger-700 dark:text-foreground">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {saveError}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            Loading profile…
          </div>
        ) : (
          <>
            {/* Store info */}
            <div className="rounded-2xl border border-border bg-card shadow-card p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Store className="h-4 w-4 text-brand-700 dark:text-brand-400" />
                <h3 className="font-display text-sm font-semibold text-foreground">Store Information</h3>
              </div>
              <Input
                label="Store name"
                value={form.storeName}
                onChange={(e) => set("storeName", e.target.value)}
                placeholder="Your store name"
              />
              <Input
                label="Owner / Contact name"
                value={form.ownerName}
                onChange={(e) => set("ownerName", e.target.value)}
                placeholder="Full name"
              />
              <Input
                label="Phone number"
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                leftIcon={<Phone className="h-4 w-4" />}
              />
            </div>

            {/* Delivery address */}
            <div className="rounded-2xl border border-border bg-card shadow-card p-5 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-700 dark:text-brand-400" />
                  <h3 className="font-display text-sm font-semibold text-foreground">Delivery Address</h3>
                </div>
                {covered ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-success-700 dark:text-foreground bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/30 rounded-full px-2 py-0.5">
                    <CheckCircle2 className="h-3 w-3" /> Nexoflow Covered
                  </span>
                ) : form.city ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-warning-700 dark:text-foreground bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/30 rounded-full px-2 py-0.5">
                    <AlertCircle className="h-3 w-3" /> Not covered yet
                  </span>
                ) : null}
              </div>

              <Input
                label="Barangay / Street"
                value={form.barangay}
                onChange={(e) => set("barangay", e.target.value)}
                placeholder="Brgy. San Jose"
              />

              {/* City picker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">City / Municipality</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCityOpen((o) => !o)}
                    className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-card px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <span className={cn("truncate", form.city ? "text-foreground" : "text-muted-foreground")}>
                      {form.city || "Select city…"}
                    </span>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", cityOpen && "rotate-180")} />
                  </button>

                  {cityOpen && (
                    <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                      <div className="p-2 border-b border-border">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <input
                            autoFocus
                            value={citySearch}
                            onChange={(e) => setCitySearch(e.target.value)}
                            placeholder="Search cities…"
                            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                        </div>
                      </div>
                      <div className="max-h-52 overflow-y-auto divide-y divide-border/50">
                        {filtered.length === 0 && (
                          <p className="py-8 text-center text-xs text-muted-foreground">No cities found</p>
                        )}
                        {filtered.map((c) => (
                          <button
                            key={c.city + c.province}
                            type="button"
                            onClick={() => selectCity(c)}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors"
                          >
                            <div className="text-left">
                              <p className="font-medium text-foreground">{c.city}</p>
                              <p className="text-[11px] text-muted-foreground">{c.province}</p>
                            </div>
                            <span className="text-[10px] font-semibold text-brand-700 dark:text-foreground bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/30 rounded-full px-1.5 py-0.5 shrink-0">
                              {c.hub}
                            </span>
                          </button>
                        ))}
                        {!citySearch && (
                          <p className="py-2 text-center text-[11px] text-muted-foreground">
                            Showing 20 of 137 cities. Type to search more.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {!covered && form.city && (
                  <p className="text-[11px] text-muted-foreground">
                    Delivery may have longer lead times. We're expanding to more cities soon.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Province</label>
                <div className="flex h-11 items-center rounded-xl border border-input bg-muted/50 px-3.5 text-sm text-muted-foreground">
                  {form.province || "Auto-filled from city"}
                </div>
              </div>
            </div>

            {/* Nexoflow coverage note */}
            <div className="rounded-xl border border-brand-100 dark:border-brand-500/30 bg-brand-50 dark:bg-brand-500/10 p-4 flex items-start gap-3">
              <MapPin className="h-4 w-4 text-brand-700 dark:text-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-brand-900 dark:text-foreground">Nexoflow Delivery Network</p>
                <p className="text-xs text-brand-700 dark:text-foreground mt-0.5 leading-relaxed">
                  Ka Sari-Sari uses Nexoflow's network to deliver to 137 cities across the Philippines.
                  Select your city to confirm delivery coverage and estimated lead times.
                </p>
              </div>
            </div>

            <Button size="lg" className="w-full" onClick={handleSave} loading={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </>
        )}
      </div>

      <RetailerBottomNav />
    </div>
  );
}
