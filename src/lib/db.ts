import bcrypt from "bcryptjs";
import {
  MOCK_ORDERS,
  MOCK_NOTIFICATIONS,
  PICK_LISTS,
  ADMIN_STATS,
} from "./mock-data";
import type { Order, Notification, PickList, AdminStats } from "@/types";

export interface DBUser {
  id: string;
  phone: string;
  passwordHash: string;
  name: string;
  role: "retailer" | "admin" | "warehouse" | "driver";
  storeName?: string;
  address?: string;
  createdAt: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __ksdb:
    | {
        users: Map<string, DBUser>;
        orders: Map<string, Order>;
        notifications: Map<string, Notification[]>;
        pickLists: Map<string, PickList>;
      }
    | undefined;
}

function initDB() {
  const users = new Map<string, DBUser>();

  const seed = [
    { id: "u-admin",     phone: "09171234567", pw: "admin",     name: "Admin User",       role: "admin"     as const },
    { id: "u-warehouse", phone: "09172345678", pw: "warehouse", name: "Juan dela Cruz",   role: "warehouse" as const },
    { id: "u-driver",    phone: "09173456789", pw: "driver",    name: "Ramon Santos",     role: "driver"    as const },
    { id: "u-r1",        phone: "09181234567", pw: "demo1234", name: "Maria Santos",     role: "retailer"  as const, storeName: "Santos Sari-Sari Store", address: "123 Rizal St, Tondo, Manila" },
  ];
  for (const s of seed) {
    users.set(s.id, {
      id: s.id,
      phone: s.phone,
      passwordHash: bcrypt.hashSync(s.pw, 10),
      name: s.name,
      role: s.role,
      storeName: "storeName" in s ? s.storeName : undefined,
      address: "address" in s ? s.address : undefined,
      createdAt: "2025-01-01T00:00:00Z",
    });
  }

  const orders = new Map<string, Order>();
  for (const o of MOCK_ORDERS) {
    orders.set(o.id, { ...o, userId: "u-r1" });
  }

  const notifications = new Map<string, Notification[]>();
  notifications.set(
    "u-r1",
    MOCK_NOTIFICATIONS.map((n) => ({ ...n, userId: "u-r1" }))
  );

  const pickLists = new Map<string, PickList>();
  for (const pl of PICK_LISTS) pickLists.set(pl.id, pl);

  return { users, orders, notifications, pickLists };
}

if (!global.__ksdb) {
  global.__ksdb = initDB();
}

export const db = global.__ksdb!;

// ── Users ──────────────────────────────────────────────────────────────────

export function findUserByPhone(phone: string): DBUser | undefined {
  for (const u of db.users.values()) {
    if (u.phone === phone) return u;
  }
}

export function findUserById(id: string): DBUser | undefined {
  return db.users.get(id);
}

export function createUser(user: DBUser): void {
  db.users.set(user.id, user);
}

// ── Orders ─────────────────────────────────────────────────────────────────

export function getOrdersByUser(userId: string): Order[] {
  return [...db.orders.values()]
    .filter((o) => o.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAllOrders(): Order[] {
  return [...db.orders.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getOrderById(id: string): Order | undefined {
  return db.orders.get(id);
}

export function saveOrder(order: Order): void {
  db.orders.set(order.id, order);
}

// ── Notifications ──────────────────────────────────────────────────────────

export function getNotificationsForUser(userId: string): Notification[] {
  if (!db.notifications.has(userId)) {
    const seeded = MOCK_NOTIFICATIONS.map((n) => ({
      ...n,
      id: `${n.id}-${userId}`,
      userId,
    }));
    db.notifications.set(userId, seeded);
  }
  return db.notifications.get(userId)!;
}

export function markNotificationRead(userId: string, notifId: string): void {
  const notifs = getNotificationsForUser(userId);
  const idx = notifs.findIndex((n) => n.id === notifId);
  if (idx !== -1) notifs[idx] = { ...notifs[idx], isRead: true };
}

export function markAllRead(userId: string): void {
  const notifs = getNotificationsForUser(userId);
  db.notifications.set(userId, notifs.map((n) => ({ ...n, isRead: true })));
}

// ── Pick Lists ─────────────────────────────────────────────────────────────

export function getAllPickLists(): PickList[] {
  return [...db.pickLists.values()];
}

export function getPickListById(id: string): PickList | undefined {
  return db.pickLists.get(id);
}

export function updatePickList(pl: PickList): void {
  db.pickLists.set(pl.id, pl);
}

// ── Admin Stats ────────────────────────────────────────────────────────────

export function getAdminStats(): AdminStats {
  return {
    ...ADMIN_STATS,
    totalOrders: db.orders.size,
    pendingOrders: [...db.orders.values()].filter((o) => o.status === "pending").length,
  };
}
