"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatPHP } from "@/lib/utils";
import { MOCK_ORDERS } from "@/lib/mock-data";
import { useOrdersStore } from "@/store/orders";
import type { OrderStatus } from "@/types";

// ─── Icons ────────────────────────────────────────────────────────────────────

function ArrowLeftIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.31 11a19.79 19.79 0 01-3.07-8.67A2 2 0 013.22 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L7.91 7.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ─── Static data ─────────────────────────────────────────────────────────────

const CUSTOMER_DETAILS: Record<string, {
  name: string;
  address: string;
  phone: string;
  landmark: string;
  area: string;
  lat?: number;
  lng?: number;
}> = {
  "ord-001": {
    name: "Maria Santos",
    address: "123 Rizal St., Barangay 5, Caloocan City",
    phone: "+639171234567",
    landmark: "Near Jollibee corner Rizal",
    area: "Brgy. 5, Caloocan",
    lat: 14.6570,
    lng: 120.9837,
  },
  "ord-002": {
    name: "Roberto Cruz",
    address: "45 Mabini Ave., Barangay 8, Caloocan City",
    phone: "+639182345678",
    landmark: "Blue gate, 2nd house from sari-sari store",
    area: "Brgy. 8, Caloocan",
    lat: 14.6603,
    lng: 120.9822,
  },
  "ord-003": {
    name: "Lina Reyes",
    address: "78 Del Pilar Ext., Barangay 5, Caloocan City",
    phone: "+639193456789",
    landmark: "White bungalow, red roof",
    area: "Brgy. 5, Caloocan",
    lat: 14.6561,
    lng: 120.9841,
  },
  "ord-004": {
    name: "Fernando Delos Reyes",
    address: "88 Sampaguita St., Brgy. Bagong Barrio, Caloocan",
    phone: "+639204567890",
    landmark: "Green fence, beside the chapel",
    area: "Brgy. Bagong Barrio, Caloocan",
    lat: 14.6712,
    lng: 120.9860,
  },
};

const FAIL_REASONS = [
  "No one home",
  "Wrong address",
  "Customer refused delivery",
  "COD amount not ready",
  "Address inaccessible",
];

const PRODUCT_NAME_MAP: Record<string, string> = {
  "prod-1": "Coca-Cola Regular 330ml",
  "prod-2": "Lucky Me! Pancit Canton Original",
  "prod-3": "Piattos Cheese 85g",
  "prod-4": "555 Sardines in Tomato Sauce 155g",
  "prod-5": "Nescafé 3-in-1 Original 20g x 10",
  "prod-6": "Safeguard Classic Bar 60g",
  "prod-7": "Silver Swan Soy Sauce 1L",
  "prod-8": "Surf Powder Detergent 80g x 6",
};

// Map from order status to human-readable timeline label
const STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  confirmed: "Order Confirmed",
  picking: "Picking Started",
  packed: "Packed & Ready",
  out_for_delivery: "Dispatched to Driver",
  delivered: "Delivered",
  failed_delivery: "Delivery Failed",
};

// ─── Helper: format a timestamp for display ───────────────────────────────────

function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// ─── Helper: get current GPS coords (resolves null if unavailable) ────────────

async function getCurrentGPS(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const storeOrders = useOrdersStore((s) => s.orders);
  const markDelivered = useOrdersStore((s) => s.markDelivered);
  const markFailed = useOrdersStore((s) => s.markFailed);

  const order = storeOrders.find((o) => o.id === id) ?? MOCK_ORDERS.find((o) => o.id === id) ?? MOCK_ORDERS[0];
  const customer = CUSTOMER_DETAILS[order.id];
  const customerName = customer?.name ?? order.deliveryAddress?.split(",")[0] ?? "Customer";

  const isCOD = order.paymentMethod === "cod";

  const [cashCollected, setCashCollected] = useState(false);
  const [delivered, setDelivered] = useState(false);
  const [failed, setFailed] = useState(false);
  const [deliveredAt, setDeliveredAt] = useState<string | null>(null);
  const [showFailPicker, setShowFailPicker] = useState(false);
  const [showDeliverConfirm, setShowDeliverConfirm] = useState(false);
  const [selectedFailReason, setSelectedFailReason] = useState(FAIL_REASONS[0]);

  // Delivery record ID (looked up from API by matching orderId === id)
  const [deliveryId, setDeliveryId] = useState<string | null>(null);

  // Loading state during API submission — disables action buttons
  const [isSubmitting, setIsSubmitting] = useState(false);

  // POD photo state
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [captureTime, setCaptureTime] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Signature pad state
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const photoTaken = photoUrl !== null;

  // ─── Fetch delivery record ID on mount ───────────────────────────────────────

  useEffect(() => {
    async function fetchDeliveryId() {
      try {
        const res = await fetch("/api/driver/deliveries");
        if (!res.ok) return;
        const data = await res.json();
        const deliveries: Array<{ id: string; orderId: string }> = data.deliveries ?? [];
        const found = deliveries.find((d) => d.orderId === id || d.id === id);
        if (found) setDeliveryId(found.id);
      } catch {
        // deliveryId remains null — API calls will be skipped (local-only fallback)
      }
    }
    fetchDeliveryId();
  }, [id]);

  // ─── Event handlers ───────────────────────────────────────────────────────

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoUrl(URL.createObjectURL(file));
      setCaptureTime(
        new Intl.DateTimeFormat("en-PH", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date())
      );
    }
  }

  function handleRetakePhoto() {
    if (photoUrl) {
      URL.revokeObjectURL(photoUrl);
    }
    setPhotoUrl(null);
    setCaptureTime(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  function handleSignaturePlaceholder() {
    setShowSignaturePad(true);
  }

  function handleCanvasPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawingRef.current = true;
    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  function handleCanvasPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }

  function handleCanvasPointerUp() {
    isDrawingRef.current = false;
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function saveSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureData(canvas.toDataURL("image/png"));
    setShowSignaturePad(false);
  }

  // ─── Handle deliver (async — calls API then updates local state) ──────────

  async function handleDeliver() {
    setIsSubmitting(true);

    // 1. Try to get GPS coordinates
    let lat: number | undefined;
    let lng: number | undefined;
    const gps = await getCurrentGPS();
    if (gps) {
      lat = gps.lat;
      lng = gps.lng;
    }

    // 2. Try to upload POD photo if it's a local blob URL
    let uploadedUrl: string | null = photoUrl;
    if (photoUrl && photoUrl.startsWith("blob:")) {
      try {
        const resp = await fetch(photoUrl);
        const blob = await resp.blob();
        const formData = new FormData();
        formData.append("file", blob, "pod-photo.jpg");
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedUrl = uploadData.url ?? photoUrl;
        }
      } catch {
        // Keep blob URL as fallback — don't block the delivery flow
      }
    }

    // 3. Call API (best-effort; falls back to local-only if unavailable)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL || deliveryId) {
      try {
        await fetch(`/api/driver/deliveries/${deliveryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "delivered",
            orderId: id,
            proofPhotoUrl: uploadedUrl,
            signatureUrl: signatureData,
            recipientName: customerName,
            codCollected: cashCollected ? order.total : undefined,
            lat,
            lng,
          }),
        });
      } catch (err) {
        console.warn("Deliver API call failed:", err);
      }
    }

    // 4. Update local state regardless of API outcome
    const now = new Intl.DateTimeFormat("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    }).format(new Date());
    setDeliveredAt(now);
    markDelivered(id);
    setDelivered(true);
    setShowDeliverConfirm(false);
    setIsSubmitting(false);
  }

  // ─── Handle confirmed failed delivery (async — calls API then local state) ─

  async function handleConfirmFailed() {
    setIsSubmitting(true);

    // Call API (best-effort)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL || deliveryId) {
      try {
        await fetch(`/api/driver/deliveries/${deliveryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "failed_attempt",
            orderId: id,
            failureReason: selectedFailReason,
          }),
        });
      } catch (err) {
        console.warn("Failed delivery API call failed:", err);
      }
    }

    // Update local state regardless of API outcome
    markFailed(id, selectedFailReason);
    setShowFailPicker(false);
    setFailed(true);
    setIsSubmitting(false);
  }

  function handleOpenMaps() {
    if (customer?.lat && customer?.lng) {
      window.open(`geo:${customer.lat},${customer.lng}`, "_blank");
      // Fallback: also open Google Maps in case geo: scheme is not supported
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${customer.lat},${customer.lng}`,
        "_blank"
      );
    } else {
      const encoded = encodeURIComponent(customer?.address ?? order.deliveryAddress ?? "");
      window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, "_blank");
    }
  }

  // ─── Derive timeline events ───────────────────────────────────────────────

  // Use fulfillmentEvents if present, otherwise build synthetic timeline from
  // order timestamps and status.
  const timelineEvents: { label: string; timestamp: string; done: boolean }[] = [];

  if (order.fulfillmentEvents && order.fulfillmentEvents.length > 0) {
    order.fulfillmentEvents.forEach((ev) => {
      const label = STATUS_LABEL[ev.status] ?? ev.status;
      timelineEvents.push({ label, timestamp: formatTimestamp(ev.createdAt), done: true });
    });
  } else {
    // Synthetic timeline from order metadata
    timelineEvents.push({
      label: "Order Placed",
      timestamp: formatTimestamp(order.createdAt),
      done: true,
    });

    const statusOrder: OrderStatus[] = ["confirmed", "picking", "packed", "out_for_delivery"];
    const currentIdx = statusOrder.indexOf(order.status as OrderStatus);

    statusOrder.forEach((s, idx) => {
      if (idx <= currentIdx) {
        timelineEvents.push({
          label: STATUS_LABEL[s] ?? s,
          // Spread timestamps evenly between createdAt and updatedAt for realism
          timestamp: idx === currentIdx
            ? formatTimestamp(order.updatedAt)
            : formatTimestamp(
                new Date(
                  new Date(order.createdAt).getTime() +
                  (idx + 1) *
                    Math.floor(
                      (new Date(order.updatedAt).getTime() - new Date(order.createdAt).getTime()) /
                      (currentIdx + 2)
                    )
                ).toISOString()
              ),
          done: true,
        });
      }
    });
  }

  // ─── Deliver button state ─────────────────────────────────────────────────

  const isDeliverDisabled = (isCOD && !cashCollected) || !photoTaken || isSubmitting;

  function getDeliverButtonLabel(): string {
    if (isSubmitting) return "Submitting...";
    if (!photoTaken) return "Take photo first";
    if (isCOD && !cashCollected) return "Collect cash first";
    return "Mark as Delivered";
  }

  // ─── Failed delivery screen ───────────────────────────────────────────────

  if (failed) {
    return (
      <div className="px-4 py-8 flex flex-col items-center gap-6 min-h-[60vh] justify-center">
        <div className="w-20 h-20 rounded-full bg-danger-50 border-2 border-danger-500 flex items-center justify-center">
          <svg className="w-10 h-10 text-danger-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">Delivery Failed</h2>
          <p className="text-muted-foreground text-sm">{order.orderNumber}</p>
        </div>
        <div className="w-full bg-danger-50 rounded-2xl p-4 border border-danger-500/20 text-center">
          <p className="text-sm text-danger-700 font-medium">
            This delivery has been marked as failed. The dispatcher will be notified to arrange a re-delivery.
          </p>
        </div>
        <Button variant="outline" className="w-full" onClick={() => router.push("/driver/deliveries")}>
          Back to Deliveries
        </Button>
      </div>
    );
  }

  // ─── Confirmation screen ──────────────────────────────────────────────────

  if (delivered) {
    return (
      <div className="px-4 py-8 flex flex-col items-center gap-6 min-h-[60vh] justify-center">
        <div className="w-20 h-20 rounded-full bg-success-50 border-2 border-success-500 flex items-center justify-center">
          <CheckCircleIcon className="w-10 h-10 text-success-600" />
        </div>
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-foreground mb-1">Delivered!</h2>
          <p className="text-muted-foreground text-sm">{order.orderNumber}</p>
          <p className="text-muted-foreground text-sm">{deliveredAt}</p>
        </div>
        <div className="w-full bg-success-50 rounded-2xl p-4 border border-success-500/20 text-center flex flex-col gap-2">
          <p className="text-sm text-success-700 font-medium">Successfully delivered to {customerName}</p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-success-600">
            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>POD photo attached</span>
          </div>
        </div>
        <Button variant="outline" className="w-full" onClick={() => router.push("/driver/deliveries")}>
          Back to Deliveries
        </Button>
      </div>
    );
  }

  // ─── Main detail view ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col">
      {/* Back header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <Link href="/driver/deliveries" className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeftIcon />
        </Link>
        <div>
          <h1 className="font-display text-base font-bold text-foreground leading-tight">Delivery Detail</h1>
          <p className="text-xs text-muted-foreground">{order.orderNumber}</p>
        </div>
      </div>

      <div className="px-4 pb-6 flex flex-col gap-4">

        {/* COD prominent banner */}
        {isCOD && (
          <div className="rounded-2xl bg-warning-50 border-2 border-warning-400 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-warning-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-warning-600 uppercase tracking-wider">COD — Collect from customer</p>
              <p className="font-display text-2xl font-bold text-warning-700 tabular-nums leading-tight">
                {formatPHP(order.total)}
              </p>
              <p className="text-xs text-warning-600 mt-0.5">in cash</p>
            </div>
          </div>
        )}

        {/* Customer info + quick actions */}
        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Customer</p>
          <h2 className="font-display text-lg font-bold text-foreground mb-1">{customerName}</h2>
          <p className="text-sm text-muted-foreground mb-0.5">{customer?.address ?? order.deliveryAddress}</p>
          {customer?.landmark && (
            <p className="text-xs text-muted-foreground mb-3">
              <span className="font-medium text-foreground">Landmark:</span> {customer.landmark}
            </p>
          )}

          {/* Quick-action buttons */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {/* Call */}
            {customer?.phone ? (
              <a
                href={`tel:${customer.phone}`}
                className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 active:bg-brand-100 transition-colors"
              >
                <PhoneIcon className="w-5 h-5" />
                <span className="text-xs font-semibold">Call</span>
              </a>
            ) : (
              <div className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl bg-muted border border-border text-muted-foreground opacity-50 cursor-not-allowed">
                <PhoneIcon className="w-5 h-5" />
                <span className="text-xs font-semibold">Call</span>
              </div>
            )}

            {/* WhatsApp */}
            {customer?.phone ? (
              <a
                href={`https://wa.me/${customer.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl bg-[#dcfce7] border border-[#86efac] text-[#166534] active:bg-[#bbf7d0] transition-colors"
              >
                <WhatsAppIcon className="w-5 h-5" />
                <span className="text-xs font-semibold">WhatsApp</span>
              </a>
            ) : (
              <div className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl bg-muted border border-border text-muted-foreground opacity-50 cursor-not-allowed">
                <WhatsAppIcon className="w-5 h-5" />
                <span className="text-xs font-semibold">WhatsApp</span>
              </div>
            )}

            {/* Open in Maps */}
            <button
              type="button"
              onClick={handleOpenMaps}
              className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 active:bg-blue-100 transition-colors"
            >
              <MapPinIcon className="w-5 h-5" />
              <span className="text-xs font-semibold">Navigate</span>
            </button>
          </div>
        </Card>

        {/* Full item breakdown */}
        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            What&apos;s in the box — {order.items.length} item{order.items.length !== 1 ? "s" : ""}
          </p>
          <div className="flex flex-col divide-y divide-border">
            {order.items.length > 0 ? order.items.map((item) => (
              <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground font-semibold leading-snug">
                    {PRODUCT_NAME_MAP[item.productId] ?? item.productId}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-bold text-brand-600 tabular-nums">
                      × {item.quantity}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      @ {formatPHP(item.unitPrice)} each
                    </span>
                    {item.status === "unavailable" && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-danger-100 text-danger-600">
                        Unavailable
                      </span>
                    )}
                    {item.status === "partial" && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-warning-100 text-warning-600">
                        Partial ({item.fulfilledQty}/{item.quantity})
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm font-bold tabular-nums text-foreground flex-shrink-0 pt-0.5">
                  {formatPHP(item.totalPrice)}
                </p>
              </div>
            )) : (
              <div className="py-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm text-foreground font-semibold">Assorted goods</p>
                  <p className="text-xs text-muted-foreground">1 × {formatPHP(order.subtotal)}</p>
                </div>
                <p className="text-sm font-bold tabular-nums text-foreground">{formatPHP(order.subtotal)}</p>
              </div>
            )}
          </div>

          {/* Order total breakdown */}
          <div className="mt-3 pt-3 border-t border-border flex flex-col gap-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatPHP(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Delivery fee</span>
              <span className="tabular-nums">{formatPHP(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-foreground pt-1 border-t border-border mt-1">
              <span>Total</span>
              <span className="tabular-nums">{formatPHP(order.total)}</span>
            </div>
          </div>
        </Card>

        {/* COD payment toggle (shown here too for completeness, after item list) */}
        {isCOD && (
          <button
            onClick={() => setCashCollected(!cashCollected)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-4 rounded-2xl border-2 transition-all font-semibold text-sm",
              cashCollected
                ? "border-success-500 bg-success-50 text-success-700"
                : "border-warning-400 bg-warning-50 text-warning-700"
            )}
          >
            <div className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
              cashCollected ? "border-success-500 bg-success-500" : "border-warning-400"
            )}>
              {cashCollected && (
                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span>
              {cashCollected
                ? `Cash collected — ${formatPHP(order.total)}`
                : `Confirm cash collected — ${formatPHP(order.total)}`}
            </span>
          </button>
        )}

        {/* Non-COD payment status */}
        {!isCOD && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</p>
              <Badge variant="info">{order.paymentMethod.toUpperCase()}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-success-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-success-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm text-success-700 font-medium">
                Payment already received — {order.paymentMethod.toUpperCase()}
              </p>
            </div>
          </Card>
        )}

        {/* Notes from customer */}
        {order.notes && (
          <div className="px-4 py-3 rounded-xl bg-warning-50 border border-warning-500/25">
            <p className="text-xs font-semibold text-warning-600 uppercase tracking-wider mb-1">Note from customer</p>
            <p className="text-sm text-foreground">{order.notes}</p>
          </div>
        )}

        {/* Order timeline */}
        {timelineEvents.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClockIcon className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Timeline</p>
            </div>
            <div className="flex flex-col gap-0">
              {timelineEvents.map((ev, idx) => (
                <div key={idx} className="flex gap-3">
                  {/* Dot + connector */}
                  <div className="flex flex-col items-center flex-shrink-0" style={{ width: 20 }}>
                    <div className={cn(
                      "w-3 h-3 rounded-full border-2 flex-shrink-0 mt-0.5",
                      ev.done
                        ? "border-brand-500 bg-brand-500"
                        : "border-surface-300 bg-background"
                    )} />
                    {idx < timelineEvents.length - 1 && (
                      <div className="w-0.5 flex-1 bg-border mt-1 mb-1 min-h-[16px]" />
                    )}
                  </div>
                  {/* Content */}
                  <div className={cn("pb-3", idx === timelineEvents.length - 1 && "pb-0")}>
                    <p className={cn(
                      "text-sm font-semibold leading-tight",
                      ev.done ? "text-foreground" : "text-muted-foreground"
                    )}>{ev.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{ev.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Proof of Delivery */}
        <Card className="p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Proof of Delivery
          </p>

          {/* Hidden camera input */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoChange}
          />

          {photoUrl ? (
            <div className="flex flex-col gap-2">
              <div className="relative border-2 border-dashed border-border rounded-xl overflow-hidden">
                <img
                  src={photoUrl}
                  alt="Proof of delivery"
                  className="w-full max-h-48 object-cover block"
                />
                <div className="absolute top-2 right-2">
                  <button
                    onClick={handleRetakePhoto}
                    className="px-3 py-1.5 rounded-lg bg-black/60 text-white text-xs font-medium hover:bg-black/75 transition-colors backdrop-blur-sm"
                  >
                    Retake
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between px-0.5">
                <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: "#f47028" }}>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Photo captured
                </span>
                {captureTime && (
                  <span className="text-xs text-muted-foreground">at {captureTime}</span>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 py-7 px-4 hover:border-brand-400 hover:bg-brand-50/30 active:bg-brand-50/50 transition-colors"
            >
              <CameraIcon className="w-10 h-10 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Take Photo</span>
              <span className="text-xs text-muted-foreground text-center">Required before marking delivered</span>
            </button>
          )}

          {/* Digital Signature */}
          {signatureData ? (
            <div className="mt-3 rounded-xl border border-success-300 bg-success-50 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-success-200">
                <span className="text-xs font-semibold text-success-700 flex items-center gap-1.5">
                  <CheckCircleIcon className="w-3.5 h-3.5" /> Signature captured
                </span>
                <button onClick={() => setSignatureData(null)} className="text-xs text-muted-foreground hover:text-foreground">Redo</button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={signatureData} alt="Customer signature" className="w-full h-24 object-contain bg-white" />
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSignaturePlaceholder}
              className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-background text-foreground hover:bg-muted transition-colors text-sm font-medium"
            >
              <PenIcon className="w-4 h-4" />
              Digital Signature (optional)
            </button>
          )}
        </Card>

        {/* Delivery actions */}
        <div className="flex flex-col gap-3 pt-2">
          {/* Mark Delivered — prominent */}
          <button
            type="button"
            disabled={isDeliverDisabled}
            onClick={() => setShowDeliverConfirm(true)}
            className={cn(
              "w-full h-16 rounded-2xl flex items-center justify-center gap-2 font-bold text-base transition-all",
              isDeliverDisabled
                ? "bg-surface-200 text-surface-500 cursor-not-allowed"
                : "bg-success-600 hover:bg-success-700 active:bg-success-800 text-white shadow-lg shadow-success-600/30"
            )}
          >
            {!isDeliverDisabled && (
              <CheckCircleIcon className="w-5 h-5" />
            )}
            {getDeliverButtonLabel()}
          </button>

          {isDeliverDisabled && !isSubmitting && (
            <p className="text-center text-xs text-muted-foreground -mt-1">
              {!photoTaken
                ? "Take a proof of delivery photo above before marking delivered"
                : "Toggle \"Cash Collected\" above before marking delivered"}
            </p>
          )}

          {/* Mark Failed — clearly secondary but still accessible */}
          <button
            type="button"
            onClick={() => setShowFailPicker(true)}
            className="w-full h-13 py-3.5 rounded-2xl border-2 border-danger-300 text-danger-600 bg-background hover:bg-danger-50 active:bg-danger-100 font-semibold text-sm transition-colors"
          >
            Report Failed Delivery
          </button>
        </div>
      </div>

      {/* ── Mark Delivered confirmation modal ── */}
      {showDeliverConfirm && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50"
          onClick={() => setShowDeliverConfirm(false)}
        >
          <div
            className="bg-card rounded-t-2xl p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-full bg-success-50 border-2 border-success-500 flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-success-600" />
              </div>
              <h3 className="font-display text-base font-bold text-foreground">Confirm Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Mark <span className="font-semibold text-foreground">{order.orderNumber}</span> as delivered to {customerName}?
              </p>
              {isCOD && cashCollected && (
                <div className="px-3 py-2 rounded-lg bg-success-50 border border-success-200 text-xs text-success-700 font-medium">
                  Cash of {formatPHP(order.total)} confirmed collected
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDeliver}
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-success-600 hover:bg-success-700 text-white font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Yes, Mark as Delivered"}
              </button>
              <button
                onClick={() => setShowDeliverConfirm(false)}
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl border border-border text-foreground font-medium text-sm hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Failed delivery picker modal ── */}
      {showFailPicker && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50"
          onClick={() => setShowFailPicker(false)}
        >
          <div className="bg-card rounded-t-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center gap-1 text-center mb-1">
              <div className="w-10 h-10 rounded-full bg-danger-50 border-2 border-danger-400 flex items-center justify-center mb-1">
                <svg className="w-5 h-5 text-danger-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h3 className="font-display text-base font-bold text-foreground">Reason for Failed Delivery</h3>
              <p className="text-xs text-muted-foreground">Select the reason and confirm — dispatcher will be notified</p>
            </div>
            <div className="space-y-2">
              {FAIL_REASONS.map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedFailReason(reason)}
                  className={cn(
                    "w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium text-left transition-colors",
                    selectedFailReason === reason
                      ? "border-danger-400 bg-danger-50 text-danger-700"
                      : "border-border bg-background text-foreground"
                  )}
                >
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    selectedFailReason === reason ? "border-danger-500 bg-danger-500" : "border-surface-300"
                  )}>
                    {selectedFailReason === reason && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  {reason}
                </button>
              ))}
            </div>
            <button
              onClick={handleConfirmFailed}
              disabled={isSubmitting}
              className="w-full h-12 rounded-2xl bg-danger-600 hover:bg-danger-700 text-white font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Confirm Failed Delivery"}
            </button>
            <button
              onClick={() => setShowFailPicker(false)}
              disabled={isSubmitting}
              className="w-full text-center text-sm text-muted-foreground py-1 hover:text-foreground transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Signature Pad Modal ── */}
      {showSignaturePad && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50">
          <div className="bg-card rounded-t-2xl p-5 space-y-4 mx-auto w-full max-w-md">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-foreground">Customer Signature</h3>
              <button onClick={() => setShowSignaturePad(false)} className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Ask the customer to sign in the box below to confirm receipt.</p>
            <div className="rounded-xl border-2 border-dashed border-border bg-white overflow-hidden touch-none">
              <canvas
                ref={canvasRef}
                width={350}
                height={160}
                className="w-full h-40 cursor-crosshair"
                onPointerDown={handleCanvasPointerDown}
                onPointerMove={handleCanvasPointerMove}
                onPointerUp={handleCanvasPointerUp}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={clearSignature}
                className="flex-1 h-11 rounded-2xl border border-border text-foreground text-sm font-semibold hover:bg-muted"
              >
                Clear
              </button>
              <button
                onClick={saveSignature}
                className="flex-1 h-11 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm"
              >
                Save Signature
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
