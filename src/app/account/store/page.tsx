"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, MapPin, Phone, ArrowLeft, CheckCircle2 } from "lucide-react";
import { RetailerTopBar, RetailerBottomNav } from "@/components/layout/retailer-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function StoreProfilePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    storeName: "Santos Sari-Sari Store",
    ownerName: "Maria Santos",
    phone: "+63 917 123 4567",
    barangay: "Brgy. San Jose",
    city: "Caloocan City",
    province: "Metro Manila",
  });

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <RetailerTopBar title="Store Profile" />

      <div className="px-4 py-5 space-y-5">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {saved && (
          <div className="flex items-center gap-2 rounded-xl bg-success-50 border border-success-500/25 px-4 py-3 text-sm text-success-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Store profile updated successfully.
          </div>
        )}

        {/* Store info */}
        <div className="rounded-2xl border border-border bg-card shadow-card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Store className="h-4 w-4 text-brand-500" />
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
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-brand-500" />
            <h3 className="font-display text-sm font-semibold text-foreground">Delivery Address</h3>
          </div>
          <Input
            label="Barangay"
            value={form.barangay}
            onChange={(e) => set("barangay", e.target.value)}
            placeholder="Brgy. San Jose"
          />
          <Input
            label="City / Municipality"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="Caloocan City"
          />
          <Input
            label="Province"
            value={form.province}
            onChange={(e) => set("province", e.target.value)}
            placeholder="Metro Manila"
          />
        </div>

        <Button size="lg" className="w-full" onClick={handleSave} loading={saving}>
          Save changes
        </Button>
      </div>

      <RetailerBottomNav />
    </div>
  );
}
