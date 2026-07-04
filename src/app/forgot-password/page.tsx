"use client";
import { useState } from "react";
import Link from "next/link";
import { Phone, ShoppingBasket, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-50 border border-success-500/25 mx-auto">
                <CheckCircle2 className="h-8 w-8 text-success-500" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">Check your SMS</h1>
              <p className="text-sm text-muted-foreground">
                We sent a reset link to <span className="font-medium text-foreground">{phone}</span>.
                Follow the instructions to reset your password.
              </p>
              <Link href="/login" className="block mt-6 text-sm font-medium text-brand-500 hover:text-brand-600">
                Return to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="font-display text-2xl font-bold text-foreground">Reset your password</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Enter the phone number linked to your account. We&apos;ll send you a reset code via SMS.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Phone number"
                  type="tel"
                  placeholder="09XX XXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone className="h-4 w-4" />}
                  autoComplete="tel"
                />
                <Button type="submit" size="lg" className="w-full" loading={loading} disabled={phone.length < 11}>
                  Send reset code <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link href="/login" className="font-medium text-brand-500 hover:text-brand-600">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
