"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, Lock, ShoppingBasket, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!phone || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    // Demo routing
    if (phone.startsWith("09") && password === "admin") {
      router.push("/admin");
    } else if (phone.startsWith("09") && password === "warehouse") {
      router.push("/warehouse");
    } else if (phone.startsWith("09") && password === "driver") {
      router.push("/driver");
    } else {
      router.push("/dashboard");
    }
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

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="font-display text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Sign in to your Ka Sari-Sari account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Phone number"
              type="tel"
              placeholder="09XX XXX XXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="h-4 w-4" />}
              autoComplete="tel"
            />
            <Input
              label="Password"
              type={showPw ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPw(!showPw)} className="text-muted-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            {error && (
              <div className="rounded-xl bg-danger-50 border border-danger-500/25 px-4 py-3 text-sm text-danger-600">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-brand-500 hover:text-brand-600">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Sign in <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              No account yet?{" "}
              <Link href="/register" className="font-medium text-brand-500 hover:text-brand-600">
                Register your store
              </Link>
            </p>
          </div>

          {/* Demo hint */}
          <div className="mt-8 rounded-xl bg-surface-100 border border-border p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground mb-1.5">Demo access</p>
            <p>09XX + <span className="font-mono text-foreground">any password</span> → Retailer</p>
            <p>09XX + <span className="font-mono text-foreground">admin</span> → Admin console</p>
            <p>09XX + <span className="font-mono text-foreground">warehouse</span> → Warehouse staff</p>
            <p>09XX + <span className="font-mono text-foreground">driver</span> → Driver app</p>
          </div>
        </div>
      </div>
    </div>
  );
}
