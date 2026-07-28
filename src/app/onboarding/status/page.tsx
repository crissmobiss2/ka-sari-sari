"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Clock, XCircle, ArrowRight, Check, FileText } from "lucide-react";
import { LogoMark } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Status = "pending" | "under_review" | "approved" | "rejected";

const DOC_LABELS: Record<string, string> = {
  gov_id: "Government ID", selfie: "Selfie with ID", storefront: "Storefront photo", permit: "Business permit",
};

export default function OnboardingStatusPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<Status>("pending");
  const [notes, setNotes] = useState<string | null>(null);
  const [docs, setDocs] = useState<{ docType: string; status: string }[]>([]);

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => { if (r.status === 401) { router.push("/login"); throw new Error("unauth"); } return r.json(); })
      .then((d) => { setStatus((d.verificationStatus as Status) ?? "pending"); setNotes(d.verificationNotes ?? null); setDocs(d.docs ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const cfg = {
    pending:       { icon: Clock,      tone: "warning", title: "Almost there", sub: "Finish your onboarding to submit your store for review." },
    under_review:  { icon: ShieldCheck, tone: "brand",  title: "Under review", sub: "Our team is verifying your store. This usually takes less than 1 business day." },
    approved:      { icon: Check,      tone: "success", title: "You're approved!", sub: "Your store is verified. You can start ordering now." },
    rejected:      { icon: XCircle,    tone: "danger",  title: "Needs attention", sub: notes || "Something needs fixing before we can approve your store. Please contact support." },
  }[status];
  const Icon = cfg.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border bg-card">
        <Link href="/" className="flex items-center gap-2.5"><LogoMark size={28} /><span className="font-display text-sm font-bold text-foreground">Ka Sari-Sari</span></Link>
      </div>

      <div className="flex flex-1 flex-col items-center px-4 py-10">
        <div className="w-full max-w-sm space-y-6">
          {loading ? (
            <div className="h-40 animate-pulse rounded-2xl bg-muted" />
          ) : (
            <>
              <div className="text-center space-y-4">
                <div className={cn("mx-auto flex h-16 w-16 items-center justify-center rounded-full",
                  cfg.tone === "success" ? "bg-success-100 dark:bg-success-500/15" :
                  cfg.tone === "danger" ? "bg-danger-100 dark:bg-danger-500/15" :
                  cfg.tone === "warning" ? "bg-warning-100 dark:bg-warning-500/15" : "bg-brand-100 dark:bg-brand-500/15")}>
                  <Icon className={cn("h-8 w-8",
                    cfg.tone === "success" ? "text-success-700 dark:text-success-400" :
                    cfg.tone === "danger" ? "text-danger-700 dark:text-danger-400" :
                    cfg.tone === "warning" ? "text-warning-700 dark:text-warning-500" : "text-brand-700 dark:text-brand-400")} />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-foreground">{cfg.title}</h1>
                  <p className="mt-2 text-sm text-muted-foreground">{cfg.sub}</p>
                </div>
              </div>

              {/* Document checklist */}
              {docs.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Submitted documents</p>
                  {docs.map((d) => (
                    <div key={d.docType} className="flex items-center gap-2.5 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-foreground">{DOC_LABELS[d.docType] ?? d.docType}</span>
                      <span className="ml-auto text-[11px] text-success-700 dark:text-success-500">Received ✓</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2">
                {status === "approved" ? (
                  <Button size="lg" className="w-full" onClick={() => router.push("/dashboard")}>Go to my dashboard <ArrowRight className="h-4 w-4" /></Button>
                ) : status === "pending" ? (
                  <Button size="lg" className="w-full" onClick={() => router.push("/register")}>Finish onboarding <ArrowRight className="h-4 w-4" /></Button>
                ) : (
                  <Button size="lg" className="w-full" onClick={() => router.push("/shop")}>Browse the catalog <ArrowRight className="h-4 w-4" /></Button>
                )}
                {status === "rejected" && (
                  <Button size="lg" variant="outline" className="w-full" onClick={() => router.push("/register")}>Update my application</Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
