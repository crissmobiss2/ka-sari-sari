"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DRIVERS } from "@/lib/mock-data";
import { toastSuccess } from "@/store/toast";

const FALLBACK_DRIVER = DRIVERS[0];

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg className={`w-4 h-4 ${filled ? "text-warning-500" : "text-surface-200"}`} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [driver, setDriver] = useState(FALLBACK_DRIVER);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (d.user) {
          setDriver((prev) => ({
            ...prev,
            name: d.user.name ?? prev.name,
            phone: d.user.phone ?? prev.phone,
          }));
          if (d.user.gcash) setGcash(d.user.gcash);
        }
      })
      .catch(() => {});
  }, []);

  const fullStars = Math.floor(driver.rating);

  const [phone, setPhone] = useState(driver.phone);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneTemp, setPhoneTemp] = useState(phone);

  const [gcash, setGcash] = useState("09171234567");
  const [editingGcash, setEditingGcash] = useState(false);
  const [gcashTemp, setGcashTemp] = useState(gcash);

  const onDuty =
    typeof window !== "undefined"
      ? sessionStorage.getItem("driver-duty") === "1"
      : false;

  function savePhone() {
    fetch("/api/driver/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneTemp }),
    }).catch(() => {});
    setPhone(phoneTemp);
    setEditingPhone(false);
    toastSuccess("Phone updated");
  }

  function cancelPhone() {
    setPhoneTemp(phone);
    setEditingPhone(false);
  }

  function saveGcash() {
    fetch("/api/driver/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gcash: gcashTemp }),
    }).catch(() => {});
    setGcash(gcashTemp);
    setEditingGcash(false);
    toastSuccess("GCash payout number updated");
  }

  function cancelGcash() {
    setGcashTemp(gcash);
    setEditingGcash(false);
  }

  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-20 h-20 rounded-full bg-brand-500 flex items-center justify-center">
          <span className="font-display text-2xl font-bold text-white">{driver.avatarInitials}</span>
        </div>
        <div className="text-center">
          <h1 className="font-display text-xl font-bold text-foreground">{driver.name}</h1>
          <p className="text-sm text-muted-foreground">{driver.vehicleType} · {driver.vehiclePlate}</p>
          <div className="flex items-center justify-center gap-1 mt-2">
            {[1,2,3,4,5].map(i => <StarIcon key={i} filled={i <= fullStars} />)}
            <span className="text-sm font-semibold text-foreground ml-1">{driver.rating}</span>
          </div>
        </div>
        <Badge variant={onDuty ? "success" : "neutral"}>
          {onDuty ? "On Duty" : "Off Duty"}
        </Badge>
      </div>

      {/* Stats */}
      <Card className="p-4">
        <div className="grid grid-cols-3 divide-x divide-border">
          <div className="flex flex-col items-center gap-1 px-3">
            <p className="font-display text-xl font-bold text-foreground tabular-nums">{driver.deliveriesTotal.toLocaleString()}</p>
            <p className="text-2xs text-muted-foreground uppercase tracking-wide font-medium text-center">Total Deliveries</p>
          </div>
          <div className="flex flex-col items-center gap-1 px-3">
            <p className="font-display text-xl font-bold text-brand-500 tabular-nums">{driver.deliveriesToday}</p>
            <p className="text-2xs text-muted-foreground uppercase tracking-wide font-medium text-center">Today</p>
          </div>
          <div className="flex flex-col items-center gap-1 px-3">
            <p className="font-display text-xl font-bold text-success-600 tabular-nums">{driver.rating}</p>
            <p className="text-2xs text-muted-foreground uppercase tracking-wide font-medium text-center">Rating</p>
          </div>
        </div>
      </Card>

      {/* Info rows */}
      <Card className="divide-y divide-border">
        {/* Phone — editable */}
        <div className="flex items-center justify-between px-4 py-3.5 gap-3">
          <p className="text-sm text-muted-foreground shrink-0">Phone</p>
          {editingPhone ? (
            <div className="flex items-center gap-2 min-w-0">
              <input
                type="tel"
                value={phoneTemp}
                onChange={(e) => setPhoneTemp(e.target.value)}
                className="text-sm font-medium text-surface-900 bg-surface-50 border border-border rounded-md px-2 py-1 w-36 focus:outline-none focus:ring-2 focus:ring-brand-500"
                autoFocus
              />
              <button
                onClick={savePhone}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 shrink-0"
              >
                Save
              </button>
              <button
                onClick={cancelPhone}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground shrink-0"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-foreground">{phone}</p>
              <button
                onClick={() => { setPhoneTemp(phone); setEditingPhone(true); }}
                className="text-muted-foreground hover:text-foreground p-0.5"
                aria-label="Edit phone number"
              >
                <EditIcon />
              </button>
            </div>
          )}
        </div>

        {/* GCash Payout — editable */}
        <div className="flex items-center justify-between px-4 py-3.5 gap-3">
          <p className="text-sm text-muted-foreground shrink-0">GCash Payout</p>
          {editingGcash ? (
            <div className="flex items-center gap-2 min-w-0">
              <input
                type="tel"
                value={gcashTemp}
                onChange={(e) => setGcashTemp(e.target.value)}
                className="text-sm font-medium text-surface-900 bg-surface-50 border border-border rounded-md px-2 py-1 w-36 focus:outline-none focus:ring-2 focus:ring-brand-500"
                autoFocus
              />
              <button
                onClick={saveGcash}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 shrink-0"
              >
                Save
              </button>
              <button
                onClick={cancelGcash}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground shrink-0"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-foreground">{gcash}</p>
              <button
                onClick={() => { setGcashTemp(gcash); setEditingGcash(true); }}
                className="text-muted-foreground hover:text-foreground p-0.5"
                aria-label="Edit GCash payout number"
              >
                <EditIcon />
              </button>
            </div>
          )}
        </div>

        <InfoRow label="License" value={driver.licenseNumber} />
        <InfoRow label="Vehicle" value={`${driver.vehicleType} – ${driver.vehiclePlate}`} />
        <InfoRow
          label="Driver since"
          value={new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "long" }).format(new Date(driver.createdAt))}
        />
      </Card>

      {/* Sign Out */}
      <button
        onClick={() => {
          // The logout route only exports POST — a GET (window.location) returns 405
          // and leaves the session cookie intact.
          fetch("/api/auth/logout", { method: "POST" })
            .finally(() => router.push("/login"));
        }}
        className="w-full py-3 rounded-lg border-2 border-danger-500 text-danger-600 font-semibold text-sm hover:bg-danger-50 active:bg-danger-100 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
