"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const ROLES = [
  { role: "retailer",  label: "Retailer",  name: "Maria Santos",   icon: "🛒", home: "/dashboard" },
  { role: "admin",     label: "Admin",     name: "Admin User",     icon: "⚙️", home: "/admin"     },
  { role: "warehouse", label: "Warehouse", name: "Juan dela Cruz", icon: "📦", home: "/warehouse" },
  { role: "driver",    label: "Driver",    name: "Ramon Santos",   icon: "🚗", home: "/driver"    },
];

export function DevRoleSwitcher() {
  const [open, setOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => setCurrentRole(d.user?.role ?? null))
      .catch(() => {});
  }, []);

  function switchRole(role: string) {
    setLoading(role);
    window.location.href = `/api/dev/switch-role?role=${role}`;
  }

  const current = ROLES.find(r => r.role === currentRole);

  return (
    <div className="fixed bottom-24 left-3 z-[9999] flex flex-col-reverse items-start gap-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-full bg-neutral-900 text-white text-[11px] font-bold px-3 py-1.5 shadow-lg hover:bg-neutral-700 transition-colors select-none"
        title="Dev role switcher"
      >
        <span className="text-sm">{current?.icon ?? "👤"}</span>
        <span>DEV{current ? ` · ${current.label}` : " · logged out"}</span>
      </button>

      {open && (
        <div className="rounded-2xl border border-border bg-card shadow-xl p-2.5 space-y-1 w-52 mb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 pt-1 pb-1.5">
            Switch Portal
          </p>
          {ROLES.map(r => {
            const isActive = r.role === currentRole;
            return (
              <button
                key={r.role}
                onClick={() => { if (!isActive) switchRole(r.role); }}
                disabled={isActive || loading !== null}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors disabled:cursor-default",
                  isActive
                    ? "bg-brand-500 text-white"
                    : "hover:bg-muted text-foreground"
                )}
              >
                <span className="text-base leading-none">{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-semibold leading-none", isActive ? "text-white" : "text-foreground")}>
                    {r.label}
                  </p>
                  <p className={cn("text-[10px] mt-0.5 truncate", isActive ? "text-white/70" : "text-muted-foreground")}>
                    {r.name}
                  </p>
                </div>
                {loading === r.role && (
                  <span className="text-[10px] text-muted-foreground">…</span>
                )}
                {isActive && (
                  <span className="text-[10px] text-white/80 font-semibold shrink-0">Active</span>
                )}
              </button>
            );
          })}
          <div className="pt-1 border-t border-border mt-1">
            <button
              onClick={() => { window.location.href = "/login"; }}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-muted transition-colors text-muted-foreground"
            >
              <span className="text-base leading-none">🚪</span>
              <p className="text-xs font-medium">Log out</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
