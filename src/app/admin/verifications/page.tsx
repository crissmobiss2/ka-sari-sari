"use client";
import { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck, Clock, CheckCircle2, XCircle, MapPin, Phone, Store, User,
  Calendar, CreditCard, Building2, Truck, Wallet, X, Loader2, ExternalLink, FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";

type Tab = "queue" | "approved" | "rejected";
const TAB_STATUS: Record<Tab, string> = { queue: "pending,under_review", approved: "approved", rejected: "rejected" };

const ID_LABELS: Record<string, string> = { philsys: "PhilSys / National ID", drivers_license: "Driver's License", umid: "UMID", sss: "SSS ID", passport: "Passport", postal: "Postal ID", voters: "Voter's ID" };
const STORE_LABELS: Record<string, string> = { sari_sari: "Sari-Sari Store", mini_mart: "Mini-Mart / Grocery", carinderia: "Carinderia / Eatery", other: "Other Retail" };
const DOC_LABELS: Record<string, string> = { gov_id: "Government ID", selfie: "Selfie with ID", storefront: "Storefront", permit: "Business permit" };

interface ListItem {
  id: string; name: string; phone: string; storeName?: string; city?: string; province?: string;
  verificationStatus: string; submittedAt?: string; createdAt?: string; ownerFullName?: string; storeType?: string; docCount: number;
}

function StatusBadge({ s }: { s: string }) {
  if (s === "approved") return <Badge variant="success"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>;
  if (s === "rejected") return <Badge variant="danger"><XCircle className="h-3 w-3" /> Rejected</Badge>;
  if (s === "under_review") return <Badge variant="default"><ShieldCheck className="h-3 w-3" /> Under review</Badge>;
  return <Badge variant="warning"><Clock className="h-3 w-3" /> Pending</Badge>;
}

export default function AdminVerificationsPage() {
  const [tab, setTab] = useState<Tab>("queue");
  const [list, setList] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/retailers?status=${TAB_STATUS[tab]}`)
      .then((r) => r.json())
      .then((d) => setList(d.retailers ?? []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-700"><ShieldCheck className="h-4 w-4 text-white" /></div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Store Verifications</h1>
          <p className="text-sm text-muted-foreground">Review and approve new store owners before they can order.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([["queue", "Review queue"], ["approved", "Approved"], ["rejected", "Rejected"]] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
              tab === t ? "border-brand-500 bg-brand-700 text-white" : "border-border text-muted-foreground hover:text-foreground")}>
            {label}{tab === t && list.length > 0 && <span className="ml-1.5 opacity-80">({list.length})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />)}</div>
      ) : list.length === 0 ? (
        <Card className="py-16 text-center text-sm text-muted-foreground">
          {tab === "queue" ? "No stores awaiting review. 🎉" : `No ${tab} stores.`}
        </Card>
      ) : (
        <div className="grid gap-3">
          {list.map((r) => (
            <Card key={r.id} className="p-4 flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-700 text-brand-700 dark:text-white font-bold">
                {(r.storeName || r.name || "?").charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">{r.storeName || r.name}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{r.ownerFullName || r.name}</span>
                  {r.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.city}</span>}
                  <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{r.docCount} docs</span>
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <StatusBadge s={r.verificationStatus} />
                {r.submittedAt && <p className="mt-1 text-[11px] text-muted-foreground">{formatDate(r.submittedAt)}</p>}
              </div>
              <Button size="sm" variant="outline" onClick={() => setSelectedId(r.id)}>Review</Button>
            </Card>
          ))}
        </div>
      )}

      {selectedId && (
        <ReviewModal id={selectedId} onClose={() => setSelectedId(null)} onDone={() => { setSelectedId(null); load(); }} />
      )}
    </div>
  );
}

// ── Detail / decision modal ──────────────────────────────────────────────────
interface Detail {
  retailer: { id: string; name: string; phone: string; storeName?: string; address?: string; city?: string; province?: string; verificationStatus: string; verificationNotes?: string; createdAt: string };
  profile: Record<string, unknown> | null;
  docs: { id: string; docType: string; status: string; url: string | null }[];
}

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm border-b border-border/60 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{icon}{title}</p>
      {children}
    </div>
  );
}

function ReviewModal({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: () => void }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<"" | "approve" | "reject">("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/admin/retailers/${id}`).then((r) => r.json()).then((d) => { setDetail(d); }).catch(() => setErr("Failed to load")).finally(() => setLoading(false));
  }, [id]);

  async function decide(action: "approve" | "reject") {
    if (action === "reject" && !notes.trim()) { setErr("Add a reason so the store owner knows what to fix."); return; }
    setErr(""); setBusy(action);
    try {
      const res = await fetch(`/api/admin/retailers/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, notes: notes.trim() || undefined }),
      });
      if (!res.ok) { setErr((await res.json()).error || "Action failed"); setBusy(""); return; }
      onDone();
    } catch { setErr("Network error"); setBusy(""); }
  }

  const p = detail?.profile ?? {};
  const g = (k: string) => p[k] as string | number | undefined;
  const gps = g("latitude") && g("longitude") ? `${g("latitude")}, ${g("longitude")}` : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-background border border-border shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur px-5 py-3">
          <h2 className="font-display text-lg font-bold text-foreground">Review store</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !detail ? (
          <div className="p-10 text-center text-sm text-muted-foreground">Could not load this store.</div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-700 text-brand-700 dark:text-white font-bold text-lg">
                {(detail.retailer.storeName || detail.retailer.name).charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{detail.retailer.storeName || detail.retailer.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{detail.retailer.phone}</p>
              </div>
              <div className="ml-auto"><StatusBadge s={detail.retailer.verificationStatus} /></div>
            </div>

            {/* KYC documents */}
            <Section icon={<CreditCard className="h-3.5 w-3.5" />} title="Identity documents">
              {detail.docs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents uploaded.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {detail.docs.map((d) => (
                    <a key={d.id} href={d.url ?? "#"} target="_blank" rel="noreferrer"
                      className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                      {d.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.url} alt={d.docType} className="h-full w-full object-cover" />
                      ) : <div className="flex h-full items-center justify-center"><FileText className="h-6 w-6 text-muted-foreground" /></div>}
                      <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[9px] font-medium text-white flex items-center justify-between">
                        {DOC_LABELS[d.docType] ?? d.docType}<ExternalLink className="h-2.5 w-2.5" />
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </Section>

            <Section icon={<User className="h-3.5 w-3.5" />} title="Owner">
              <Row label="Legal name" value={g("ownerFullName")} />
              <Row label="Birthdate" value={g("birthdate")} />
              <Row label="ID type" value={g("idType") ? (ID_LABELS[g("idType") as string] ?? g("idType")) : undefined} />
              <Row label="ID number" value={g("idNumber")} />
            </Section>

            <Section icon={<Store className="h-3.5 w-3.5" />} title="Store">
              <Row label="Store name" value={detail.retailer.storeName} />
              <Row label="Type" value={g("storeType") ? (STORE_LABELS[g("storeType") as string] ?? g("storeType")) : undefined} />
              <Row label="Size" value={g("storeSize")} />
              <Row label="Years operating" value={g("yearsOperating")} />
              <Row label="Hours" value={g("operatingHours")} />
            </Section>

            <Section icon={<MapPin className="h-3.5 w-3.5" />} title="Location">
              <Row label="Address" value={detail.retailer.address} />
              <Row label="Barangay" value={g("barangay")} />
              <Row label="City" value={detail.retailer.city} />
              <Row label="Province" value={detail.retailer.province} />
              <Row label="Landmark" value={g("landmark")} />
              <Row label="GPS" value={gps ? <a className="text-brand-700 dark:text-brand-400 inline-flex items-center gap-1" href={`https://maps.google.com/?q=${gps}`} target="_blank" rel="noreferrer">Open map <ExternalLink className="h-3 w-3" /></a> : undefined} />
            </Section>

            {(g("dtiName") || g("permitNumber") || g("tin")) && (
              <Section icon={<Building2 className="h-3.5 w-3.5" />} title="Business registration">
                <Row label="DTI name" value={g("dtiName")} />
                <Row label="Permit no." value={g("permitNumber")} />
                <Row label="TIN" value={g("tin")} />
              </Section>
            )}

            {(g("deliveryDays") || g("deliveryWindow") || g("altContactName")) && (
              <Section icon={<Truck className="h-3.5 w-3.5" />} title="Delivery preferences">
                <Row label="Days" value={g("deliveryDays")} />
                <Row label="Window" value={g("deliveryWindow")} />
                <Row label="Alt contact" value={g("altContactName") ? `${g("altContactName")} ${g("altContactPhone") ?? ""}` : undefined} />
              </Section>
            )}

            {(g("estMonthlySales") || g("currentSuppliers")) && (
              <Section icon={<Wallet className="h-3.5 w-3.5" />} title="Business profile">
                <Row label="Est. monthly sales" value={g("estMonthlySales") ? `₱${Number(g("estMonthlySales")).toLocaleString()}` : undefined} />
                <Row label="Current suppliers" value={g("currentSuppliers")} />
              </Section>
            )}

            {detail.retailer.verificationStatus === "rejected" && detail.retailer.verificationNotes && (
              <div className="rounded-xl border border-danger-500/25 bg-danger-50 dark:bg-danger-500/10 px-4 py-3 text-sm text-danger-700 dark:text-foreground">
                <span className="font-semibold">Rejection note:</span> {detail.retailer.verificationNotes}
              </div>
            )}

            {/* Decision */}
            {detail.retailer.verificationStatus !== "approved" && (
              <div className="space-y-3 pt-1">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional note (required to reject — the owner sees this)"
                  className="min-h-16 w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700" />
                {err && <p className="text-sm text-danger-700 dark:text-foreground">{err}</p>}
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 border-danger-500/40 text-danger-700 dark:text-foreground" onClick={() => decide("reject")} loading={busy === "reject"} disabled={!!busy}>
                    <XCircle className="h-4 w-4" /> Reject
                  </Button>
                  <Button className="flex-1" onClick={() => decide("approve")} loading={busy === "approve"} disabled={!!busy}>
                    <CheckCircle2 className="h-4 w-4" /> Approve
                  </Button>
                </div>
              </div>
            )}
            {detail.retailer.verificationStatus === "approved" && (
              <div className="rounded-xl border border-success-500/25 bg-success-50 dark:bg-success-500/10 px-4 py-3 text-sm text-success-700 dark:text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> This store is approved and can order.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
