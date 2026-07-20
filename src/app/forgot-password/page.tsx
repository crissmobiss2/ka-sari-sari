"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Phone, ArrowLeft, ArrowRight, Eye, EyeOff, CheckCircle2, Lock } from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [phone, setPhone] = useState("");
  const [loadingSend, setLoadingSend] = useState(false);

  // Step 2
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Step 3
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Countdown effect for step 2
  useEffect(() => {
    if (step !== 2) return;
    setCountdown(60);
    setCanResend(false);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    if (phone.length < 11) return;
    setLoadingSend(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
    } catch {
      // endpoint may not exist yet — proceed anyway
    } finally {
      setLoadingSend(false);
      setStep(2);
    }
  }

  function handleOtpChange(index: number, value: string) {
    // Only allow single digit
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    // Auto-advance
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] ?? "";
    }
    setOtp(newOtp);
    const lastFilled = Math.min(pasted.length - 1, 5);
    otpRefs.current[lastFilled]?.focus();
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) return;
    setLoadingVerify(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPasswordError(data.error ?? "Invalid or expired code. Please try again.");
        setLoadingVerify(false);
        return;
      }
    } catch {
      setPasswordError("Network error. Please check your connection and try again.");
      setLoadingVerify(false);
      return;
    }
    setLoadingVerify(false);
    setStep(3);
  }

  function handleResend() {
    if (!canResend) return;
    setOtp(["", "", "", "", "", ""]);
    // Re-send OTP
    fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    }).catch(() => {});
    setStep(2); // triggers the useEffect to restart countdown
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setLoadingReset(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp: otp.join(""), newPassword: password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setPasswordError(data.error ?? "Invalid or expired OTP. Please start over.");
        setLoadingReset(false);
        return;
      }
    } catch {
      setPasswordError("Network error. Please check your connection and try again.");
      setLoadingReset(false);
      return;
    }
    setLoadingReset(false);
    setSuccess(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Brand header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border bg-card">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark size={28} />
          <span className="font-display text-sm font-bold text-foreground">Ka Sari-Sari</span>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          {/* ── Step 1: Phone entry ── */}
          {step === 1 && (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8"
              >
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>

              <div className="mb-8">
                <h1 className="font-display text-2xl font-bold text-foreground">Reset your password</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Enter the phone number linked to your account. We&apos;ll send a 6-digit code via SMS.
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-4">
                <Input
                  label="Phone number"
                  type="tel"
                  placeholder="09XX XXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  leftIcon={<Phone className="h-4 w-4" />}
                  autoComplete="tel"
                />
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={loadingSend}
                  disabled={phone.length < 11}
                >
                  Send OTP <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link href="/login" className="font-medium text-brand-700 dark:text-brand-400 hover:text-brand-600">
                  Sign in
                </Link>
              </p>
            </>
          )}

          {/* ── Step 2: OTP verification ── */}
          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              <div className="mb-8">
                <h1 className="font-display text-2xl font-bold text-foreground">Enter the code</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  We sent a 6-digit code to{" "}
                  <span className="font-medium text-foreground">{phone}</span>.
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                {/* OTP boxes */}
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      onPaste={handleOtpPaste}
                      className={cn(
                        "w-11 h-12 text-center text-xl font-bold border rounded-xl bg-background text-foreground",
                        "focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
                        "transition-all",
                        digit ? "border-brand-500" : "border-border"
                      )}
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={loadingVerify}
                  disabled={otp.join("").length !== 6}
                >
                  Verify Code
                </Button>
              </form>

              {/* Resend countdown */}
              <p className="mt-5 text-center text-sm text-muted-foreground">
                {canResend ? (
                  <button
                    onClick={handleResend}
                    className="font-medium text-brand-700 dark:text-brand-400 hover:text-brand-600"
                  >
                    Resend code
                  </button>
                ) : (
                  <>Resend code in <span className="font-medium text-foreground">{countdown}s</span></>
                )}
              </p>
            </>
          )}

          {/* ── Step 3: New password ── */}
          {step === 3 && (
            <>
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              {success ? (
                <div className="text-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-50 dark:bg-success-500/10 border border-success-500/25 mx-auto">
                    <CheckCircle2 className="h-8 w-8 text-success-500" />
                  </div>
                  <h1 className="font-display text-2xl font-bold text-foreground">Password reset!</h1>
                  <p className="text-sm text-muted-foreground">
                    Your password has been updated. Redirecting you to sign in…
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h1 className="font-display text-2xl font-bold text-foreground">Create new password</h1>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Choose a strong password of at least 8 characters.
                    </p>
                  </div>

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    {/* Password */}
                    <div className="relative">
                      <Input
                        label="New password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        leftIcon={<Lock className="h-4 w-4" />}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Confirm password */}
                    <div className="relative">
                      <Input
                        label="Confirm password"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Repeat your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        leftIcon={<Lock className="h-4 w-4" />}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {passwordError && (
                      <p className="text-sm text-danger-700 dark:text-foreground font-medium">{passwordError}</p>
                    )}

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      loading={loadingReset}
                      disabled={!password || !confirmPassword}
                    >
                      Reset Password
                    </Button>
                  </form>
                </>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
