"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  Phone,
  Pencil,
  Slash,
  Check,
  User,
  Lock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "admin" | "warehouse" | "driver";
type Status = "active" | "inactive";

interface StaffMember {
  id: string;
  name: string;
  role: Role;
  phone: string;
  status: Status;
  lastActive: string;
  initials: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_STAFF: StaffMember[] = [
  { id: "s1", name: "Juan dela Cruz", role: "admin", phone: "09171234567", status: "active", lastActive: "Just now", initials: "JC" },
  { id: "s2", name: "Maria Santos", role: "admin", phone: "09182345678", status: "active", lastActive: "3 hours ago", initials: "MS" },
  { id: "s3", name: "Roberto Cruz", role: "warehouse", phone: "09193456789", status: "active", lastActive: "2 hours ago", initials: "RC" },
  { id: "s4", name: "Ana Reyes", role: "warehouse", phone: "09174567890", status: "active", lastActive: "1 hour ago", initials: "AR" },
  { id: "s5", name: "Dante Villanueva", role: "warehouse", phone: "09185678901", status: "active", lastActive: "30 min ago", initials: "DV" },
  { id: "s6", name: "Lourdes Bautista", role: "warehouse", phone: "09196789012", status: "inactive", lastActive: "2 days ago", initials: "LB" },
  { id: "s7", name: "Ramon Dela Cruz", role: "warehouse", phone: "09177890123", status: "active", lastActive: "4 hours ago", initials: "RD" },
  { id: "s8", name: "Pedro Bautista", role: "driver", phone: "09188901234", status: "active", lastActive: "Just now", initials: "PB" },
  { id: "s9", name: "Jose Mendoza", role: "driver", phone: "09199012345", status: "active", lastActive: "1 hour ago", initials: "JM" },
  { id: "s10", name: "Ernesto Aquino", role: "driver", phone: "09170123456", status: "active", lastActive: "45 min ago", initials: "EA" },
  { id: "s11", name: "Florencia Ramos", role: "driver", phone: "09181234567", status: "inactive", lastActive: "3 days ago", initials: "FR" },
  { id: "s12", name: "Domingo Santos", role: "driver", phone: "09192345678", status: "active", lastActive: "2 hours ago", initials: "DS" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<Role, { label: string; avatarClass: string; badgeClass: string }> = {
  admin: {
    label: "Admin",
    avatarClass: "bg-purple-500",
    badgeClass: "bg-purple-50 text-purple-700 border border-purple-200",
  },
  warehouse: {
    label: "Warehouse",
    avatarClass: "bg-blue-500",
    badgeClass: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  driver: {
    label: "Driver",
    avatarClass: "bg-brand-500",
    badgeClass: "bg-brand-50 text-brand-700 border border-brand-200",
  },
};

type FilterTab = "all" | Role;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "admin", label: "Admin" },
  { key: "warehouse", label: "Warehouse" },
  { key: "driver", label: "Driver" },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ─── Add Staff Modal ──────────────────────────────────────────────────────────

interface AddStaffModalProps {
  onClose: () => void;
  onAdd: (member: StaffMember) => void;
}

function AddStaffModal({ onClose, onAdd }: AddStaffModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("warehouse");
  const [password, setPassword] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !password.trim()) return;
    const newMember: StaffMember = {
      id: `s${Date.now()}`,
      name: name.trim(),
      role,
      phone: phone.trim(),
      status: "active",
      lastActive: "Just now",
      initials: getInitials(name.trim()),
    };
    onAdd(newMember);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        {/* Modal header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-foreground">Add Staff Member</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Juan dela Cruz"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="h-4 w-4" />}
            required
          />

          <Input
            label="Phone Number"
            placeholder="09XX XXX XXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Phone className="h-4 w-4" />}
            required
          />

          {/* Role select — styled to match Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="h-11 w-full rounded-xl border border-input bg-card px-4 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="admin">Admin</option>
              <option value="warehouse">Warehouse</option>
              <option value="driver">Driver</option>
            </select>
          </div>

          <Input
            label="Password"
            type="password"
            placeholder="Set a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
            required
          />

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" size="md" className="flex-1">
              Create Staff
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Staff Modal ─────────────────────────────────────────────────────────

interface EditStaffModalProps {
  member: StaffMember;
  onClose: () => void;
  onSave: (updated: StaffMember) => void;
}

function EditStaffModal({ member, onClose, onSave }: EditStaffModalProps) {
  const [name, setName] = useState(member.name);
  const [role, setRole] = useState<Role>(member.role);
  const [status, setStatus] = useState<Status>(member.status);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      ...member,
      name: name.trim(),
      role,
      status,
      initials: getInitials(name.trim()),
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-bold text-foreground">Edit Staff Member</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Juan dela Cruz"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="h-4 w-4" />}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="h-11 w-full rounded-xl border border-input bg-card px-4 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="admin">Admin</option>
              <option value="warehouse">Warehouse</option>
              <option value="driver">Driver</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="h-11 w-full rounded-xl border border-input bg-card px-4 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" size="md" className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Staff Card ───────────────────────────────────────────────────────────────

interface StaffCardProps {
  member: StaffMember;
  onToggleStatus: (id: string) => void;
  onEdit: (id: string) => void;
}

function StaffCard({ member, onToggleStatus, onEdit }: StaffCardProps) {
  const cfg = ROLE_CONFIG[member.role];
  const isActive = member.status === "active";

  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3">
      {/* Top row: avatar + name + role badge */}
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 ${cfg.avatarClass}`}
        >
          {member.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground leading-tight truncate">{member.name}</p>
          <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.badgeClass}`}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Phone */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Phone className="h-3 w-3 shrink-0" />
        <span>{member.phone}</span>
      </div>

      {/* Status + last active */}
      <div className="flex items-center gap-2">
        <span
          className={`inline-block w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-success-500" : "bg-surface-300"}`}
        />
        <span className={`text-xs font-medium ${isActive ? "text-success-700" : "text-muted-foreground"}`}>
          {isActive ? "Active" : "Inactive"}
        </span>
        <span className="text-xs text-muted-foreground">· Last active: {member.lastActive}</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(member.id)}
          className="flex-1 text-xs"
        >
          <Pencil className="h-3 w-3" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleStatus(member.id)}
          className={`flex-1 text-xs ${
            isActive
              ? "border-danger-200 text-danger-600 hover:bg-danger-50"
              : "border-success-200 text-success-700 hover:bg-success-50"
          }`}
        >
          {isActive ? <Slash className="h-3 w-3" /> : <Check className="h-3 w-3" />}
          {isActive ? "Suspend" : "Activate"}
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);

  const filtered = activeTab === "all" ? staff : staff.filter((s) => s.role === activeTab);
  const activeCount = staff.filter((s) => s.status === "active").length;
  const uniqueRoleCount = new Set(staff.map((s) => s.role)).size;

  const tabCount = (key: FilterTab) =>
    key === "all" ? staff.length : staff.filter((s) => s.role === key).length;

  function handleToggleStatus(id: string) {
    setStaff((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: m.status === "active" ? "inactive" : "active" }
          : m
      )
    );
  }

  function handleEdit(id: string) {
    const member = staff.find((m) => m.id === id);
    if (member) setEditStaff(member);
  }

  function handleSaveEdit(updated: StaffMember) {
    setStaff((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setEditStaff(null);
  }

  function handleAdd(member: StaffMember) {
    setStaff((prev) => [member, ...prev]);
  }

  return (
    <>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Staff Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage warehouse pickers, drivers, and administrators
            </p>
          </div>
          <Button variant="default" size="md" onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4" />
            Add Staff
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 px-6 py-4">
          {/* Total Staff */}
          <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-foreground leading-none">{staff.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Staff</p>
            </div>
          </div>

          {/* Active Now */}
          <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-50 shrink-0">
              <span className="w-3 h-3 rounded-full bg-success-500" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-foreground leading-none">{activeCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Active Now</p>
            </div>
          </div>

          {/* Roles */}
          <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 shrink-0">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-foreground leading-none">{uniqueRoleCount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Roles · Admin, Warehouse, Driver</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 pb-4 flex gap-2 flex-wrap">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`h-8 px-4 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-brand-500 text-white"
                  : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}{" "}
              <span className={`ml-1 text-xs ${activeTab === tab.key ? "opacity-80" : "opacity-60"}`}>
                ({tabCount(tab.key)})
              </span>
            </button>
          ))}
        </div>

        {/* Staff Grid */}
        <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((member) => (
            <StaffCard
              key={member.id}
              member={member}
              onToggleStatus={handleToggleStatus}
              onEdit={handleEdit}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground text-sm">
              No staff found.
            </div>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <AddStaffModal onClose={() => setShowModal(false)} onAdd={handleAdd} />
      )}

      {/* Edit Staff Modal */}
      {editStaff && (
        <EditStaffModal
          member={editStaff}
          onClose={() => setEditStaff(null)}
          onSave={handleSaveEdit}
        />
      )}
    </>
  );
}
