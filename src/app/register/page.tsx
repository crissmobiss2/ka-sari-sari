"use client";
import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Phone, User, Store, MapPin, Lock, ArrowRight, ArrowLeft, Check, ChevronDown, Search,
  CheckCircle2, CreditCard, Camera, Upload, Calendar, Building2, Truck, Wallet, ShieldCheck,
  Navigation, Clock, Loader2, FileText,
} from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NEXOFLOW_CITIES, isCovered, type NexoflowCity } from "@/lib/nexoflow-cities";

const STEPS = ["Phone", "Verify", "Account", "Owner ID", "Store", "Location", "Business", "Delivery", "Financials", "Consent"];

const ID_TYPES = [
  { value: "philsys", label: "PhilSys / National ID" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "umid", label: "UMID" },
  { value: "sss", label: "SSS ID" },
  { value: "passport", label: "Passport" },
  { value: "postal", label: "Postal ID" },
  { value: "voters", label: "Voter's ID" },
];
const STORE_TYPES = [
  { value: "sari_sari", label: "Sari-Sari Store" },
  { value: "mini_mart", label: "Mini-Mart / Grocery" },
  { value: "carinderia", label: "Carinderia / Eatery" },
  { value: "other", label: "Other Retail" },
];
const STORE_SIZES = [
  { value: "small", label: "Small — 1 counter / window" },
  { value: "medium", label: "Medium — a few shelves" },
  { value: "large", label: "Large — walk-in store" },
];
const DELIVERY_WINDOWS = [
  { value: "morning", label: "Morning (7am–11am)" },
  { value: "afternoon", label: "Afternoon (11am–3pm)" },
  { value: "evening", label: "Evening (3pm–7pm)" },
  { value: "anytime", label: "Anytime" },
];
const DAYS = [
  { value: "mon", label: "Mon" }, { value: "tue", label: "Tue" }, { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" }, { value: "fri", label: "Fri" }, { value: "sat", label: "Sat" }, { value: "sun", label: "Sun" },
];

// ── Small styled controls ────────────────────────────────────────────────────
function Select({ label, value, onChange, options, placeholder, icon }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string; icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-foreground">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-11 w-full appearance-none rounded-xl border border-input bg-card pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700",
            icon ? "pl-10" : "pl-3.5",
            !value && "text-muted-foreground"
          )}
        >
          <option value="" disabled>{placeholder ?? "Select…"}</option>
          {options.map((o) => <option key={o.value} value={o.value} className="text-foreground">{o.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

function FileUpload({ label, hint, docType, done, onDone, icon }: {
  label: string; hint?: string; docType: string; done: boolean;
  onDone: (docType: string) => void; icon?: React.ReactNode;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">(done ? "done" : "idle");
  const [err, setErr] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr("");
    setStatus("uploading");
    if (file.type.startsWith("image/")) setPreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append("file", file);
    fd.append("docType", docType);
    try {
      const res = await fetch("/api/onboarding/upload", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setErr(data.error || "Upload failed"); setStatus("error"); return; }
      setStatus("done");
      onDone(docType);
    } catch {
      setErr("Network error, please retry");
      setStatus("error");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border-2 border-dashed px-4 py-3.5 text-left transition-colors",
          status === "done" ? "border-success-500/50 bg-success-50 dark:bg-success-500/10"
          : status === "error" ? "border-danger-500/50 bg-danger-50 dark:bg-danger-500/10"
          : "border-border hover:border-brand-500 hover:bg-brand-50/40 dark:hover:bg-brand-500/10"
        )}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
        ) : (
          <span className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
            status === "done" ? "bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400"
            : "bg-muted text-muted-foreground"
          )}>
            {status === "uploading" ? <Loader2 className="h-5 w-5 animate-spin" />
              : status === "done" ? <Check className="h-5 w-5" />
              : (icon ?? <Camera className="h-5 w-5" />)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {status === "uploading" ? "Uploading…"
              : status === "done" ? "Uploaded ✓ — tap to replace"
              : status === "error" ? err
              : (hint ?? "Tap to upload a photo")}
          </p>
        </div>
        {status !== "done" && <Upload className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>
      <input ref={inputRef} type="file" accept="image/*,application/pdf" capture="environment" className="hidden" onChange={onChange} />
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accountCreated, setAccountCreated] = useState(false);
  const [uploads, setUploads] = useState<Record<string, boolean>>({});
  const [gpsMsg, setGpsMsg] = useState("");

  const [form, setForm] = useState({
    phone: "", otp: "", name: "", password: "",
    ownerFullName: "", birthdate: "", idType: "", idNumber: "",
    storeName: "", storeType: "", yearsOperating: "", storeSize: "", operatingHours: "",
    barangay: "", city: "", province: "", landmark: "", latitude: "", longitude: "",
    dtiName: "", permitNumber: "", tin: "",
    deliveryDays: [] as string[], deliveryWindow: "", altContactName: "", altContactPhone: "",
    estMonthlySales: "", currentSuppliers: "",
    privacyConsent: false, termsAccepted: false, marketingOptIn: false,
  });
  const [citySearch, setCitySearch] = useState("");
  const [cityOpen, setCityOpen] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm((p) => ({ ...p, [k]: v })); }

  const filteredCities = useMemo(() => {
    const q = citySearch.toLowerCase();
    if (!q) return NEXOFLOW_CITIES.slice(0, 20);
    return NEXOFLOW_CITIES.filter((c) => c.city.toLowerCase().includes(q) || c.province.toLowerCase().includes(q)).slice(0, 20);
  }, [citySearch]);

  function selectCity(c: NexoflowCity) {
    set("city", c.city); set("province", c.province);
    setCityOpen(false); setCitySearch("");
  }
  const covered = isCovered(form.city);

  function markUploaded(docType: string) { setUploads((u) => ({ ...u, [docType]: true })); }

  function toggleDay(d: string) {
    set("deliveryDays", form.deliveryDays.includes(d) ? form.deliveryDays.filter((x) => x !== d) : [...form.deliveryDays, d]);
  }

  function useMyLocation() {
    setGpsMsg("");
    if (typeof navigator === "undefined" || !navigator.geolocation) { setGpsMsg("Location not supported on this device."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("latitude", pos.coords.latitude.toFixed(6));
        set("longitude", pos.coords.longitude.toFixed(6));
        setGpsMsg("Location pinned ✓");
      },
      () => setGpsMsg("Couldn't get location — you can skip this."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Persist onboarding fields for a step to /api/onboarding.
  async function saveProfile(patch: Record<string, unknown>) {
    const res = await fetch("/api/onboarding", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Could not save your details"); }
  }

  async function handleNext() {
    setError("");
    setLoading(true);
    try {
      // 0 — Phone → send OTP
      if (step === 0) {
        const res = await fetch("/api/auth/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: form.phone }) });
        if (!res.ok) { setError((await res.json()).error || "Failed to send code."); return; }
        setStep(1); return;
      }
      // 1 — Verify OTP
      if (step === 1) {
        const res = await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: form.phone, otp: form.otp }) });
        if (!res.ok) { setError((await res.json()).error || "Invalid code."); return; }
        setStep(2); return;
      }
      // 2 — Account → register (creates the pending account + session)
      if (step === 2) {
        if (!accountCreated) {
          const res = await fetch("/api/auth/register", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: form.phone, password: form.password, name: form.name }),
          });
          const data = await res.json();
          if (!res.ok) { setError(data.error || "Registration failed."); return; }
          setAccountCreated(true);
        }
        setStep(3); return;
      }
      // 3 — Owner identity (KYC)
      if (step === 3) {
        if (!uploads.gov_id || !uploads.selfie) { setError("Please upload your ID photo and a selfie."); return; }
        await saveProfile({ ownerFullName: form.ownerFullName, birthdate: form.birthdate || undefined, idType: form.idType, idNumber: form.idNumber });
        setStep(4); return;
      }
      // 4 — Store profile
      if (step === 4) {
        if (!uploads.storefront) { setError("Please upload a photo of your storefront."); return; }
        await saveProfile({
          storeName: form.storeName, storeType: form.storeType,
          yearsOperating: form.yearsOperating ? Number(form.yearsOperating) : undefined,
          storeSize: form.storeSize, operatingHours: form.operatingHours,
        });
        setStep(5); return;
      }
      // 5 — Location
      if (step === 5) {
        await saveProfile({
          barangay: form.barangay, city: form.city, province: form.province, landmark: form.landmark,
          latitude: form.latitude ? Number(form.latitude) : undefined,
          longitude: form.longitude ? Number(form.longitude) : undefined,
        });
        setStep(6); return;
      }
      // 6 — Business registration (optional)
      if (step === 6) {
        await saveProfile({ dtiName: form.dtiName, permitNumber: form.permitNumber, tin: form.tin });
        setStep(7); return;
      }
      // 7 — Delivery preferences
      if (step === 7) {
        await saveProfile({
          deliveryDays: form.deliveryDays.join(","), deliveryWindow: form.deliveryWindow,
          altContactName: form.altContactName, altContactPhone: form.altContactPhone,
        });
        setStep(8); return;
      }
      // 8 — Financial profile
      if (step === 8) {
        await saveProfile({
          estMonthlySales: form.estMonthlySales ? Number(form.estMonthlySales) : undefined,
          currentSuppliers: form.currentSuppliers,
        });
        setStep(9); return;
      }
      // 9 — Consent → submit for review
      if (step === 9) {
        if (!form.privacyConsent || !form.termsAccepted) { setError("Please accept the Privacy Notice and Terms to continue."); return; }
        await saveProfile({ privacyConsent: true, termsAccepted: true, marketingOptIn: form.marketingOptIn });
        const res = await fetch("/api/onboarding/submit", { method: "POST" });
        const data = await res.json();
        if (!res.ok) {
          setError((data.missingDocs?.length ? "Missing documents: " + data.missingDocs.join(", ") : data.error) || "Could not submit.");
          return;
        }
        setStep(10); return;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const pct = Math.round((Math.min(step, STEPS.length) / STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border bg-card">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark size={28} />
          <span className="font-display text-sm font-bold text-foreground">Ka Sari-Sari</span>
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center px-4 py-8">
        <div className="w-full max-w-sm">
          {/* Progress */}
          {step < 10 && (
            <div className="mb-7">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground">Step {step + 1} of {STEPS.length}</span>
                <span className="text-xs text-muted-foreground">{STEPS[step]}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-brand-700 transition-all duration-300" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}

          {/* Step 0 — Phone */}
          {step === 0 && (
            <div className="space-y-5">
              <Header title="Enter your number" sub="We'll use this as your login and send a verification code." />
              <Input label="Mobile number" type="tel" placeholder="09XX XXX XXXX" value={form.phone}
                onChange={(e) => set("phone", e.target.value)} leftIcon={<Phone className="h-4 w-4" />} />
              <ErrorText error={error} />
              <Button size="lg" className="w-full" onClick={handleNext} loading={loading}
                disabled={loading || !form.phone.startsWith("09") || form.phone.length < 11}>
                Send Code <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 1 — OTP */}
          {step === 1 && (
            <div className="space-y-5">
              <Header title="Verify your number" sub={`Enter the 6-digit code sent to ${form.phone}.`} />
              <Input label="Verification code" inputMode="numeric" placeholder="000000" maxLength={6} value={form.otp}
                onChange={(e) => set("otp", e.target.value.replace(/\D/g, "").slice(0, 6))} leftIcon={<CheckCircle2 className="h-4 w-4" />} />
              <ErrorText error={error} />
              <Button size="lg" className="w-full" onClick={handleNext} loading={loading} disabled={loading || form.otp.length < 6}>
                Verify <ArrowRight className="h-4 w-4" />
              </Button>
              <button type="button" onClick={() => { setError(""); fetch("/api/auth/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: form.phone }) }).catch(() => {}); }}
                className="w-full text-center text-sm text-brand-700 dark:text-brand-400">Resend code</button>
            </div>
          )}

          {/* Step 2 — Account */}
          {step === 2 && (
            <div className="space-y-5">
              <Header title="Create your account" sub="Your name and a password to sign in." />
              <Input label="Your full name" placeholder="Maria Santos" value={form.name}
                onChange={(e) => set("name", e.target.value)} leftIcon={<User className="h-4 w-4" />} />
              <Input label="Password" type="password" placeholder="At least 6 characters" value={form.password}
                onChange={(e) => set("password", e.target.value)} leftIcon={<Lock className="h-4 w-4" />} />
              <ErrorText error={error} />
              <NextBack loading={loading} onNext={handleNext} onBack={() => setStep(1)}
                disabled={!form.name || form.password.length < 6} />
            </div>
          )}

          {/* Step 3 — Owner identity (KYC) */}
          {step === 3 && (
            <div className="space-y-5">
              <Header title="Verify your identity" sub="Required to keep the marketplace safe. Your ID is stored securely and only used for verification." />
              <Input label="Full legal name (as on your ID)" placeholder="Maria Reyes Santos" value={form.ownerFullName}
                onChange={(e) => set("ownerFullName", e.target.value)} leftIcon={<User className="h-4 w-4" />} />
              <Input label="Birthdate" type="date" value={form.birthdate}
                onChange={(e) => set("birthdate", e.target.value)} leftIcon={<Calendar className="h-4 w-4" />} />
              <Select label="ID type" value={form.idType} onChange={(v) => set("idType", v)} options={ID_TYPES} placeholder="Select an ID" icon={<CreditCard className="h-4 w-4" />} />
              <Input label="ID number" placeholder="Number on your ID" value={form.idNumber}
                onChange={(e) => set("idNumber", e.target.value)} leftIcon={<FileText className="h-4 w-4" />} />
              <FileUpload label="Photo of your government ID" hint="Front side, clearly readable" docType="gov_id" done={!!uploads.gov_id} onDone={markUploaded} icon={<CreditCard className="h-5 w-5" />} />
              <FileUpload label="Selfie holding your ID" hint="Your face + ID in one photo" docType="selfie" done={!!uploads.selfie} onDone={markUploaded} icon={<Camera className="h-5 w-5" />} />
              <ErrorText error={error} />
              <NextBack loading={loading} onNext={handleNext} onBack={() => setStep(2)}
                disabled={!form.ownerFullName || !form.idType || !form.idNumber} />
            </div>
          )}

          {/* Step 4 — Store profile */}
          {step === 4 && (
            <div className="space-y-5">
              <Header title="About your store" sub="Tell us what you run so we can set you up right." />
              <Input label="Store name" placeholder="Santos Sari-Sari Store" value={form.storeName}
                onChange={(e) => set("storeName", e.target.value)} leftIcon={<Store className="h-4 w-4" />} />
              <Select label="Store type" value={form.storeType} onChange={(v) => set("storeType", v)} options={STORE_TYPES} placeholder="Select store type" icon={<Store className="h-4 w-4" />} />
              <Select label="Store size" value={form.storeSize} onChange={(v) => set("storeSize", v)} options={STORE_SIZES} placeholder="Select size" icon={<Building2 className="h-4 w-4" />} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Years operating" type="number" inputMode="numeric" placeholder="e.g. 3" value={form.yearsOperating}
                  onChange={(e) => set("yearsOperating", e.target.value.replace(/\D/g, ""))} />
                <Input label="Operating hours" placeholder="6am–10pm" value={form.operatingHours}
                  onChange={(e) => set("operatingHours", e.target.value)} leftIcon={<Clock className="h-4 w-4" />} />
              </div>
              <FileUpload label="Photo of your storefront" hint="A clear photo of your store from outside" docType="storefront" done={!!uploads.storefront} onDone={markUploaded} icon={<Store className="h-5 w-5" />} />
              <ErrorText error={error} />
              <NextBack loading={loading} onNext={handleNext} onBack={() => setStep(3)}
                disabled={!form.storeName || !form.storeType} />
            </div>
          )}

          {/* Step 5 — Location */}
          {step === 5 && (
            <div className="space-y-5">
              <Header title="Where is your store?" sub="We need this for deliveries and verification." />
              <Input label="Barangay / Street" placeholder="Brgy. San Jose" value={form.barangay}
                onChange={(e) => set("barangay", e.target.value)} leftIcon={<MapPin className="h-4 w-4" />} />
              {/* City picker with coverage */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-foreground">City / Municipality</label>
                  {covered && form.city && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-success-700 dark:text-foreground">
                      <CheckCircle2 className="h-3 w-3" /> Delivery available
                    </span>
                  )}
                </div>
                <div className="relative">
                  <button type="button" onClick={() => setCityOpen((o) => !o)}
                    className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-card px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700">
                    <span className={cn("truncate", form.city ? "text-foreground" : "text-muted-foreground")}>{form.city || "Select your city…"}</span>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", cityOpen && "rotate-180")} />
                  </button>
                  {cityOpen && (
                    <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                      <div className="p-2 border-b border-border">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <input autoFocus value={citySearch} onChange={(e) => setCitySearch(e.target.value)} placeholder="Search cities…"
                            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-700" />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto divide-y divide-border/50">
                        {filteredCities.map((c) => (
                          <button key={c.city + c.province} type="button" onClick={() => selectCity(c)}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/50">
                            <div className="text-left"><p className="font-medium text-foreground">{c.city}</p><p className="text-[11px] text-muted-foreground">{c.province}</p></div>
                            <span className="text-[10px] font-semibold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 border border-brand-100 rounded-full px-1.5 py-0.5 shrink-0">{c.hub}</span>
                          </button>
                        ))}
                        {!citySearch && <p className="py-2 text-center text-[11px] text-muted-foreground">Showing 20 of {NEXOFLOW_CITIES.length}. Type to search.</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Input label="Nearest landmark" placeholder="Beside the barangay hall" value={form.landmark}
                onChange={(e) => set("landmark", e.target.value)} leftIcon={<MapPin className="h-4 w-4" />} />
              <div>
                <button type="button" onClick={useMyLocation}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 dark:bg-brand-500/10 py-2.5 text-sm font-medium text-brand-700 dark:text-brand-400">
                  <Navigation className="h-4 w-4" /> {form.latitude ? "Update pinned location" : "Pin my exact location (GPS)"}
                </button>
                {gpsMsg && <p className="mt-1.5 text-center text-[11px] text-muted-foreground">{gpsMsg}</p>}
              </div>
              <ErrorText error={error} />
              <NextBack loading={loading} onNext={handleNext} onBack={() => setStep(4)} disabled={!form.barangay || !form.city} />
            </div>
          )}

          {/* Step 6 — Business registration (optional) */}
          {step === 6 && (
            <div className="space-y-5">
              <Header title="Business registration" sub="Optional — add these if your store is registered. You can skip and add them later." />
              <Input label="DTI / Registered business name" placeholder="Optional" value={form.dtiName}
                onChange={(e) => set("dtiName", e.target.value)} leftIcon={<Building2 className="h-4 w-4" />} />
              <Input label="Mayor's / Business permit no." placeholder="Optional" value={form.permitNumber}
                onChange={(e) => set("permitNumber", e.target.value)} leftIcon={<FileText className="h-4 w-4" />} />
              <Input label="TIN" placeholder="Optional — for BIR-registered receipts" value={form.tin}
                onChange={(e) => set("tin", e.target.value)} leftIcon={<FileText className="h-4 w-4" />} />
              <FileUpload label="Permit photo (optional)" hint="Business/Mayor's permit if you have one" docType="permit" done={!!uploads.permit} onDone={markUploaded} icon={<FileText className="h-5 w-5" />} />
              <ErrorText error={error} />
              <NextBack loading={loading} onNext={handleNext} onBack={() => setStep(5)} nextLabel="Continue" />
            </div>
          )}

          {/* Step 7 — Delivery preferences */}
          {step === 7 && (
            <div className="space-y-5">
              <Header title="Delivery preferences" sub="When's best to deliver, and who can receive?" />
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">Preferred delivery days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((d) => (
                    <button key={d.value} type="button" onClick={() => toggleDay(d.value)}
                      className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        form.deliveryDays.includes(d.value) ? "border-brand-500 bg-brand-700 text-white" : "border-border text-muted-foreground hover:border-brand-300")}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <Select label="Preferred time window" value={form.deliveryWindow} onChange={(v) => set("deliveryWindow", v)} options={DELIVERY_WINDOWS} placeholder="Select a window" icon={<Clock className="h-4 w-4" />} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Alternate contact" placeholder="Name" value={form.altContactName} onChange={(e) => set("altContactName", e.target.value)} leftIcon={<User className="h-4 w-4" />} />
                <Input label="Their number" type="tel" placeholder="09XX…" value={form.altContactPhone} onChange={(e) => set("altContactPhone", e.target.value)} leftIcon={<Phone className="h-4 w-4" />} />
              </div>
              <ErrorText error={error} />
              <NextBack loading={loading} onNext={handleNext} onBack={() => setStep(6)} nextLabel="Continue" />
            </div>
          )}

          {/* Step 8 — Financial profile */}
          {step === 8 && (
            <div className="space-y-5">
              <Header title="Business profile" sub="Helps us tailor pricing and, later, a credit line. Estimates are fine." />
              <Input label="Estimated monthly sales (₱)" type="number" inputMode="numeric" placeholder="e.g. 60000" value={form.estMonthlySales}
                onChange={(e) => set("estMonthlySales", e.target.value.replace(/\D/g, ""))} leftIcon={<Wallet className="h-4 w-4" />} />
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">Current suppliers</label>
                <textarea value={form.currentSuppliers} onChange={(e) => set("currentSuppliers", e.target.value)}
                  placeholder="Who do you buy from now? (e.g. Puregold, local distributor)"
                  className="min-h-20 w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700" />
              </div>
              <ErrorText error={error} />
              <NextBack loading={loading} onNext={handleNext} onBack={() => setStep(7)} nextLabel="Continue" />
            </div>
          )}

          {/* Step 9 — Consent */}
          {step === 9 && (
            <div className="space-y-5">
              <Header title="Review & consent" sub="Last step — a couple of agreements before we review your store." />
              <Consent checked={form.privacyConsent} onChange={(v) => set("privacyConsent", v)}
                title="Data Privacy consent"
                body="I consent to Ka Sari-Sari collecting and processing my personal and business information, including my ID, for account verification and service delivery, per the Data Privacy Act (RA 10173)." />
              <Consent checked={form.termsAccepted} onChange={(v) => set("termsAccepted", v)}
                title="Terms of Service"
                body="I have read and agree to the Ka Sari-Sari Terms of Service and Merchant Agreement." />
              <Consent checked={form.marketingOptIn} onChange={(v) => set("marketingOptIn", v)}
                title="Promotions (optional)"
                body="Send me deals, new-product alerts, and updates via SMS or push." />
              <ErrorText error={error} />
              <NextBack loading={loading} onNext={handleNext} onBack={() => setStep(8)} nextLabel="Submit for review" disabled={!form.privacyConsent || !form.termsAccepted} />
            </div>
          )}

          {/* Step 10 — Submitted */}
          {step === 10 && (
            <div className="space-y-6 text-center pt-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-100 dark:bg-success-500/15">
                <ShieldCheck className="h-8 w-8 text-success-700 dark:text-success-400" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Submitted for review</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Thanks, {form.name || "there"}! Our team is reviewing your store. You'll get a notification once you're approved — usually within 1 business day. You can browse the catalog while you wait.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 text-left space-y-2.5">
                {[
                  ["Identity & ID", true], ["Store details & photo", true],
                  ["Location", true], ["Agreements signed", true], ["Admin approval", false],
                ].map(([label, done]) => (
                  <div key={label as string} className="flex items-center gap-2.5 text-sm">
                    <span className={cn("flex h-5 w-5 items-center justify-center rounded-full", done ? "bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-400" : "bg-muted text-muted-foreground")}>
                      {done ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    </span>
                    <span className={cn(done ? "text-foreground" : "text-muted-foreground")}>{label}</span>
                    {!done && <span className="ml-auto text-[11px] text-warning-700 dark:text-warning-500">Pending</span>}
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <Button size="lg" className="w-full" onClick={() => router.push("/shop")}>Browse the catalog <ArrowRight className="h-4 w-4" /></Button>
                <Button size="lg" variant="outline" className="w-full" onClick={() => router.push("/onboarding/status")}>View my application</Button>
              </div>
            </div>
          )}

          {step < 10 && (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Already registered? <Link href="/login" className="font-medium text-brand-700 dark:text-brand-400">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Presentational helpers ────────────────────────────────────────────────────
function Header({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}
function ErrorText({ error }: { error: string }) {
  if (!error) return null;
  return <div className="rounded-xl bg-danger-50 dark:bg-danger-500/10 border border-danger-500/25 px-4 py-3 text-sm text-danger-700 dark:text-foreground">{error}</div>;
}
function NextBack({ loading, onNext, onBack, disabled, nextLabel }: {
  loading: boolean; onNext: () => void; onBack: () => void; disabled?: boolean; nextLabel?: string;
}) {
  return (
    <div className="flex gap-3">
      <Button size="lg" variant="outline" onClick={onBack} disabled={loading} className="shrink-0 px-4"><ArrowLeft className="h-4 w-4" /></Button>
      <Button size="lg" className="flex-1" onClick={onNext} loading={loading} disabled={loading || disabled}>
        {nextLabel ?? "Continue"} <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
function Consent({ checked, onChange, title, body }: { checked: boolean; onChange: (v: boolean) => void; title: string; body: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={cn("flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors",
        checked ? "border-brand-500 bg-brand-50/50 dark:bg-brand-500/10" : "border-border hover:border-brand-300")}>
      <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
        checked ? "border-brand-700 bg-brand-700 text-white" : "border-input")}>
        {checked && <Check className="h-3 w-3" />}
      </span>
      <span>
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="block text-[12px] leading-relaxed text-muted-foreground">{body}</span>
      </span>
    </button>
  );
}
