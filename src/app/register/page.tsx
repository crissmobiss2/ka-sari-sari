"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, User, Store, MapPin, Lock, ShoppingBasket, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const STEPS = ["Phone", "Account", "Store", "Payment"];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [form, setForm] = useState({
    phone: "", name: "", password: "",
    storeName: "", barangay: "", city: "", province: "",
  });

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  async function handleSendOtp() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setOtpSent(true);
    setLoading(false);
  }

  async function handleVerifyOtp() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setStep(1);
    setLoading(false);
  }

  async function handleNext() {
    if (step < 3) { setStep((s) => s + 1); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    router.push("/dashboard?welcome=1");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border bg-card">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand-500">
            <ShoppingBasket className="h-4 w-4 text-white" strokeWidth={2.2} />
          </div>
          <span className="font-display text-sm font-bold text-foreground">Ka Sari-Sari</span>
        </Link>
      </div>

      <div className="flex flex-1 flex-col items-center px-4 py-10">
        {/* Progress */}
        <div className="w-full max-w-sm mb-8">
          <div className="flex items-center gap-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
                <div className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  i < step ? "bg-brand-500 text-white" : i === step ? "border-2 border-brand-500 text-brand-500" : "border-2 border-border text-muted-foreground"
                )}>
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </div>
                <span className={cn("text-xs hidden sm:block", i === step ? "font-medium text-foreground" : "text-muted-foreground")}>
                  {label}
                </span>
                {i < STEPS.length - 1 && <div className={cn("h-px flex-1", i < step ? "bg-brand-500" : "bg-border")} />}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-sm">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Verify your number</h1>
                <p className="mt-1 text-sm text-muted-foreground">We&apos;ll send a one-time code to confirm it&apos;s you.</p>
              </div>
              {!otpSent ? (
                <>
                  <Input label="Mobile number" type="tel" placeholder="09XX XXX XXXX" value={form.phone}
                    onChange={(e) => set("phone", e.target.value)} leftIcon={<Phone className="h-4 w-4" />} />
                  <Button size="lg" className="w-full" onClick={handleSendOtp} loading={loading}
                    disabled={form.phone.length < 11}>
                    Send OTP <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="rounded-xl bg-surface-100 border border-border px-4 py-3 text-sm text-muted-foreground">
                    Code sent to <span className="font-medium text-foreground">{form.phone}</span>
                  </div>
                  <Input label="Enter 6-digit code" type="tel" placeholder="000000" value={otp}
                    onChange={(e) => setOtp(e.target.value)} maxLength={6} />
                  <Button size="lg" className="w-full" onClick={handleVerifyOtp} loading={loading}
                    disabled={otp.length < 6}>
                    Verify <ArrowRight className="h-4 w-4" />
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Didn&apos;t receive it?{" "}
                    <button className="text-brand-500 font-medium" onClick={handleSendOtp}>Resend code</button>
                  </p>
                </>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Create your account</h1>
                <p className="mt-1 text-sm text-muted-foreground">Your name and password for sign-in.</p>
              </div>
              <Input label="Full name" placeholder="Maria Santos" value={form.name}
                onChange={(e) => set("name", e.target.value)} leftIcon={<User className="h-4 w-4" />} />
              <Input label="Password" type="password" placeholder="At least 8 characters" value={form.password}
                onChange={(e) => set("password", e.target.value)} leftIcon={<Lock className="h-4 w-4" />} />
              <Button size="lg" className="w-full" onClick={handleNext} disabled={!form.name || !form.password}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Your store details</h1>
                <p className="mt-1 text-sm text-muted-foreground">We need this for deliveries and verification.</p>
              </div>
              <Input label="Store name" placeholder="Santos Sari-Sari Store" value={form.storeName}
                onChange={(e) => set("storeName", e.target.value)} leftIcon={<Store className="h-4 w-4" />} />
              <Input label="Barangay" placeholder="Brgy. San Jose" value={form.barangay}
                onChange={(e) => set("barangay", e.target.value)} leftIcon={<MapPin className="h-4 w-4" />} />
              <Input label="City / Municipality" placeholder="Caloocan City" value={form.city}
                onChange={(e) => set("city", e.target.value)} />
              <Input label="Province" placeholder="Metro Manila" value={form.province}
                onChange={(e) => set("province", e.target.value)} />
              <Button size="lg" className="w-full" onClick={handleNext}
                disabled={!form.storeName || !form.barangay || !form.city}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">Activate your account</h1>
                <p className="mt-1 text-sm text-muted-foreground">One annual platform fee unlocks unlimited ordering.</p>
              </div>
              <div className="rounded-2xl border border-brand-200 bg-brand-50 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-display text-3xl font-bold text-foreground">₱1,000</p>
                    <p className="text-sm text-muted-foreground">Annual platform access fee</p>
                  </div>
                  <span className="rounded-full bg-success-50 border border-success-500/25 px-2.5 py-1 text-xs font-medium text-success-600">
                    Best value
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

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Choose payment method</p>
                {["GCash", "Maya", "Bank Transfer", "Cash on Delivery"].map((m) => (
                  <label key={m} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 cursor-pointer hover:border-brand-300 transition-colors">
                    <input type="radio" name="pm" value={m} className="accent-brand-500" defaultChecked={m === "GCash"} />
                    <span className="text-sm font-medium text-foreground">{m}</span>
                  </label>
                ))}
              </div>

              <Button size="lg" className="w-full" onClick={handleNext} loading={loading}>
                Pay ₱1,000 and start ordering <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Secure payment. Renews automatically after 1 year.
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
