"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DRIVERS } from "@/lib/mock-data";

const driver = DRIVERS[0];

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg className={`w-4 h-4 ${filled ? "text-warning-500" : "text-surface-200"}`} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export default function ProfilePage() {
  const fullStars = Math.floor(driver.rating);

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
        <Badge variant="success">On Route</Badge>
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
        <InfoRow label="Phone" value={driver.phone} />
        <InfoRow label="License" value={driver.licenseNumber} />
        <InfoRow label="Vehicle" value={`${driver.vehicleType} – ${driver.vehiclePlate}`} />
        <InfoRow label="Driver since" value={new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "long" }).format(new Date(driver.createdAt))} />
      </Card>
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
