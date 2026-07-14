"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, User, Store, MapPin, Lock, ArrowRight, Check, ChevronDown, Search, CheckCircle2 } from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NEXOFLOW_CITIES, isCovered, type NexoflowCity } from "@/lib/nexoflow-cities";

const STEPS = ["Phone", "Verify", "Account", "Store", "Activate"];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    phone: "", otp: "", name: "", password: "",
    storeName: "", barangay: "", city: "", province: "",
  });
  const [citySearch, setCitySearch] = useState("");
  const [cityOpen, setCityOpen] = useState(false);

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  const filteredCities = useMemo(() => {
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

  async function handleNext() {
    setError("");
    if (step === 0) {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: form.phone }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Failed to send OTP. Please try again.");
          return;
        }
        setStep((s) => s + 1);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (step === 1) {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: form.phone, otp: form.otp }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Invalid code. Please check and try again.");
          return;
        }
        setStep((s) => s + 1);
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (step < 4) { setStep((s) => s + 1); }
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const address = [form.barangay, form.city, form.province].filter(Boolean).join(", ");
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: form.phone,
          password: form.password,
          name: form.name,
          storeName: form.storeName,
          address,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }
      router.push("/dashboard?welcome=1");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border bg-card">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark size={28} />
          <span className="font-display text-sm font-bold text-foreground">Ka Sari-Sari</span>
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center px-4 py-10">
        {/* Step progress */}
        <div className="w-full max-w-sm mb-8">
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
                <div className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  i < step  ? "bg-brand-500 text-white"
                  : i === step ? "border-2 border-brand-500 text-brand-500"
                  : "border-2 border-border text-muted-foreground"
                )}>
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={cn("text-xs hidden sm:block", i === step ? "font-medium text-foreground" : "text-muted-foreground")}>
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className={cn("h-px flex-1", i < step ? "bg-brand-500" : "bg-border")} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-sm">
          {/* Step 0 — Phone */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Enter your number</h1>
                <p className="mt-1 text-sm text-muted-foreground">We'll use this as your login.</p>
              </div>
              <Input
                label="Mobile number"
                type="tel"
                placeholder="09XX XXX XXXX"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                leftIcon={<Phone className="h-4 w-4" />}
              />
              {error && (
                <p className="text-sm text-danger-600">{error}</p>
              )}
              <Button
                size="lg"
                className="w-full"
                onClick={handleNext}
                loading={loading}
                disabled={loading || !form.phone.startsWith("09") || form.phone.length < 11}
              >
                Send Code <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 1 — OTP Verification */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Verify your number</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the 6-digit code sent to {form.phone}.
                </p>
              </div>
              <Input
                label="Verification code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                maxLength={6}
                value={form.otp}
                onChange={(e) => set("otp", e.target.value.replace(/\D/g, "").slice(0, 6))}
                leftIcon={<CheckCircle2 className="h-4 w-4" />}
              />
              {error && (
                <p className="text-sm text-danger-600">{error}</p>
              )}
              <Button
                size="lg"
                className="w-full"
                onClick={handleNext}
                loading={loading}
                disabled={loading || form.otp.length < 6}
              >
                Verify <ArrowRight className="h-4 w-4" />
              </Button>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  fetch("/api/auth/send-otp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phone: form.phone }),
                  }).catch(() => {});
                }}
                className="w-full text-center text-sm text-brand-500 hover:text-brand-600"
              >
                Resend code
              </button>
            </div>
          )}

          {/* Step 2 — Account */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Create your account</h1>
                <p className="mt-1 text-sm text-muted-foreground">Your name and password for sign-in.</p>
              </div>
              <Input label="Full name" placeholder="Maria Santos" value={form.name}
                onChange={(e) => set("name", e.target.value)} leftIcon={<User className="h-4 w-4" />} />
              <Input label="Password" type="password" placeholder="At least 6 characters" value={form.password}
                onChange={(e) => set("password", e.target.value)} leftIcon={<Lock className="h-4 w-4" />} />
              <Button size="lg" className="w-full" onClick={handleNext}
                disabled={!form.name || form.password.length < 6}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 3 — Store */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Your store details</h1>
                <p className="mt-1 text-sm text-muted-foreground">We need this for deliveries and verification.</p>
              </div>
              <Input label="Store name" placeholder="Santos Sari-Sari Store" value={form.storeName}
                onChange={(e) => set("storeName", e.target.value)} leftIcon={<Store className="h-4 w-4" />} />
              <Input label="Barangay / Street" placeholder="Brgy. San Jose" value={form.barangay}
                onChange={(e) => set("barangay", e.target.value)} leftIcon={<MapPin className="h-4 w-4" />} />

              {/* City picker with Nexoflow coverage */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-foreground">City / Municipality</label>
                  {covered && form.city && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-success-700">
                      <CheckCircle2 className="h-3 w-3" /> Delivery available
                    </span>
                  )}
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCityOpen((o) => !o)}
                    className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-card px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <span className={cn("truncate", form.city ? "text-foreground" : "text-muted-foreground")}>
                      {form.city || "Select your city…"}
                    </span>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", cityOpen && "rotate-180")} />
                  </button>
                  {cityOpen && (
                    <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                      <div className="p-2 border-b border-border">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <input autoFocus value={citySearch} onChange={(e) => setCitySearch(e.target.value)}
                            placeholder="Search cities…"
                            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500" />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto divide-y divide-border/50">
                        {filteredCities.map((c) => (
                          <button key={c.city + c.province} type="button" onClick={() => selectCity(c)}
                            className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors">
                            <div className="text-left">
                              <p className="font-medium text-foreground">{c.city}</p>
                              <p className="text-[11px] text-muted-foreground">{c.province}</p>
                            </div>
                            <span className="text-[10px] font-semibold text-brand-500 bg-brand-50 border border-brand-100 rounded-full px-1.5 py-0.5 shrink-0">
                              {c.hub}
                            </span>
                          </button>
                        ))}
                        {!citySearch && (
                          <p className="py-2 text-center text-[11px] text-muted-foreground">Showing 20 of 137. Type to search.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Province</label>
                <div className="flex h-11 items-center rounded-xl border border-input bg-muted/50 px-3.5 text-sm text-muted-foreground">
                  {form.province || "Auto-filled from city"}
                </div>
              </div>
              <Button size="lg" className="w-full" onClick={handleNext}
                disabled={!form.storeName || !form.barangay || !form.city}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 4 — Activate */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Activate your account</h1>
                <p className="mt-1 text-sm text-muted-foreground">Your first year is completely free. No payment needed today.</p>
              </div>
              <div className="rounded-2xl border border-brand-200 bg-brand-50 dark:bg-brand-500/10 dark:border-brand-500/30 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-display text-3xl font-bold text-brand-500">FREE</p>
                    <p className="text-sm text-muted-foreground">First year on us</p>
                  </div>
                  <span className="rounded-full bg-success-50 border border-success-500/25 px-2.5 py-1 text-xs font-medium text-success-600">
                    No credit card
                  </span>
                </div>
                <ul className="space-y-2 text-sm text-foreground">
                  {["Unlimited warehouse orders", "Live stock visibility", "Order tracking", "Priority support"].map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-success-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>

              {error && (
                <div className="rounded-xl bg-danger-50 border border-danger-500/25 px-4 py-3 text-sm text-danger-600">
                  {error}
                </div>
              )}

              <Button size="lg" className="w-full" onClick={handleSubmit} loading={loading}>
                Activate free account <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Free for 1 year. Then ₱200/month per store from Year 2.
              </p>
            </div>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already registered?{" "}
            <Link href="/login" className="font-medium text-brand-500 hover:text-brand-600">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
