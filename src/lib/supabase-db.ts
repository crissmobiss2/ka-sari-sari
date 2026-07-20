// Supabase-backed data access layer
// Replaces in-memory db.ts functions for production use.
// API routes import from here for all real-data operations.

import { supabaseAdmin } from "./supabase";
import bcrypt from "bcryptjs";
import type { AdminStats } from "@/types";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DBUser {
  id: string;
  phone: string;
  passwordHash: string;
  name: string;
  role: "retailer" | "admin" | "warehouse" | "driver";
  storeName?: string;
  address?: string;
  city?: string;
  province?: string;
  status: string;
  creditLimit: number;
  creditTerms: number;
  subscriptionStatus: string;
  subscriptionExpiresAt?: string;
  loyaltyPoints: number;
  walletBalance: number;
  createdAt: string;
}

export interface DBOrder {
  id: string;
  orderNumber: string;
  retailerId: string;
  status: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod?: string;
  paymentStatus: string;
  paymentIntentId?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  notes?: string;
  driverId?: string;
  estimatedDeliveryAt?: string;
  confirmedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  // Joined
  retailer?: { name: string; storeName?: string; phone: string };
  driver?: { name: string; phone: string };
  items?: DBOrderItem[];
}

export interface DBOrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage?: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface DBProduct {
  id: string;
  categoryId: string;
  name: string;
  slug?: string;
  brand?: string;
  unit?: string;
  unitSize?: string;
  price: number;
  srp?: number;
  sku?: string;
  barcode?: string;
  minOrderQty: number;
  isActive: boolean;
  isFeatured: boolean;
  stockQty: number;
  lowStockThreshold: number;
  reorderPoint: number;
  imageUrl?: string;
  description?: string;
}

// ── Row mappers ───────────────────────────────────────────────────────────────

function rowToUser(row: Record<string, unknown>): DBUser {
  return {
    id: row.id as string,
    phone: row.phone as string,
    passwordHash: row.password_hash as string,
    name: row.name as string,
    role: row.role as DBUser["role"],
    storeName: row.store_name as string | undefined,
    address: row.address as string | undefined,
    city: row.city as string | undefined,
    province: row.province as string | undefined,
    status: row.status as string,
    creditLimit: Number(row.credit_limit ?? 0),
    creditTerms: Number(row.credit_terms ?? 0),
    subscriptionStatus: row.subscription_status as string,
    subscriptionExpiresAt: row.subscription_expires_at as string | undefined,
    loyaltyPoints: Number(row.loyalty_points ?? 0),
    walletBalance: Number(row.wallet_balance ?? 0),
    createdAt: row.created_at as string,
  };
}

function rowToOrder(row: Record<string, unknown>): DBOrder {
  return {
    id: row.id as string,
    orderNumber: row.order_number as string,
    retailerId: row.retailer_id as string,
    status: row.status as string,
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee ?? 0),
    discount: Number(row.discount ?? 0),
    total: Number(row.total),
    paymentMethod: row.payment_method as string | undefined,
    paymentStatus: row.payment_status as string,
    paymentIntentId: row.payment_intent_id as string | undefined,
    deliveryAddress: row.delivery_address as string | undefined,
    deliveryCity: row.delivery_city as string | undefined,
    notes: row.notes as string | undefined,
    driverId: row.driver_id as string | undefined,
    estimatedDeliveryAt: row.estimated_delivery_at as string | undefined,
    confirmedAt: row.confirmed_at as string | undefined,
    dispatchedAt: row.dispatched_at as string | undefined,
    deliveredAt: row.delivered_at as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToProduct(row: Record<string, unknown>): DBProduct {
  return {
    id: row.id as string,
    categoryId: row.category_id as string,
    name: row.name as string,
    slug: row.slug as string | undefined,
    brand: row.brand as string | undefined,
    unit: row.unit as string | undefined,
    unitSize: row.unit_size as string | undefined,
    price: Number(row.price),
    srp: row.srp ? Number(row.srp) : undefined,
    sku: row.sku as string | undefined,
    barcode: row.barcode as string | undefined,
    minOrderQty: Number(row.min_order_qty ?? 1),
    isActive: Boolean(row.is_active),
    isFeatured: Boolean(row.is_featured),
    stockQty: Number(row.stock_qty ?? 0),
    lowStockThreshold: Number(row.low_stock_threshold ?? 10),
    reorderPoint: Number(row.reorder_point ?? 20),
    imageUrl: row.image_url as string | undefined,
    description: row.description as string | undefined,
  };
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function findUserByPhone(phone: string): Promise<DBUser | null> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("phone", phone)
    .single();
  if (error && error.code !== "PGRST116") {
    console.error("[supabase-db] findUserByPhone error:", error.code, error.message);
  }
  return data ? rowToUser(data) : null;
}

export async function findUserById(id: string): Promise<DBUser | null> {
  const { data } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", id)
    .single();
  return data ? rowToUser(data) : null;
}

export async function createUser(user: {
  phone: string;
  password: string;
  name: string;
  role: string;
  storeName?: string;
  address?: string;
  city?: string;
  province?: string;
}): Promise<DBUser> {
  const passwordHash = await bcrypt.hash(user.password, 10);
  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({
      phone: user.phone,
      password_hash: passwordHash,
      name: user.name,
      role: user.role,
      store_name: user.storeName,
      address: user.address,
      city: user.city,
      province: user.province,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToUser(data);
}

export async function updateUser(id: string, updates: Partial<{
  name: string;
  storeName: string;
  address: string;
  city: string;
  province: string;
  status: string;
  creditLimit: number;
  creditTerms: number;
  subscriptionStatus: string;
  subscriptionExpiresAt: string;
  loyaltyPoints: number;
  walletBalance: number;
  passwordHash: string;
}>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.storeName !== undefined) row.store_name = updates.storeName;
  if (updates.address !== undefined) row.address = updates.address;
  if (updates.city !== undefined) row.city = updates.city;
  if (updates.province !== undefined) row.province = updates.province;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.creditLimit !== undefined) row.credit_limit = updates.creditLimit;
  if (updates.creditTerms !== undefined) row.credit_terms = updates.creditTerms;
  if (updates.subscriptionStatus !== undefined) row.subscription_status = updates.subscriptionStatus;
  if (updates.subscriptionExpiresAt !== undefined) row.subscription_expires_at = updates.subscriptionExpiresAt;
  if (updates.loyaltyPoints !== undefined) row.loyalty_points = updates.loyaltyPoints;
  if (updates.walletBalance !== undefined) row.wallet_balance = updates.walletBalance;
  if (updates.passwordHash !== undefined) row.password_hash = updates.passwordHash;
  row.updated_at = new Date().toISOString();
  await supabaseAdmin.from("users").update(row).eq("id", id);
}

export async function getUsersByRole(role: string): Promise<DBUser[]> {
  const { data } = await supabaseAdmin.from("users").select("*").eq("role", role).eq("status", "active");
  return (data ?? []).map(rowToUser);
}

// ── OTP ───────────────────────────────────────────────────────────────────────

export async function saveOTP(phone: string, codeHash: string, expiresAt: Date): Promise<void> {
  // Invalidate existing OTPs for this phone
  await supabaseAdmin.from("otp_codes").update({ used: true }).eq("phone", phone).eq("used", false);
  await supabaseAdmin.from("otp_codes").insert({
    phone,
    code_hash: codeHash,
    expires_at: expiresAt.toISOString(),
  });
}

export async function verifyOTP(phone: string, codeHash: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("otp_codes")
    .select("id")
    .eq("phone", phone)
    .eq("code_hash", codeHash)
    .eq("used", false)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (!data) return false;
  await supabaseAdmin.from("otp_codes").update({ used: true }).eq("id", data.id);
  return true;
}

// ── Products ──────────────────────────────────────────────────────────────────

export async function getProducts(opts: {
  categoryId?: string;
  search?: string;
  featured?: boolean;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<DBProduct[]> {
  let q = supabaseAdmin.from("products").select("*");
  if (opts.activeOnly ?? true) q = q.eq("is_active", true);
  if (opts.categoryId) q = q.eq("category_id", opts.categoryId);
  if (opts.featured) q = q.eq("is_featured", true);
  if (opts.search) q = q.ilike("name", `%${opts.search}%`);
  if (opts.limit) q = q.limit(opts.limit);
  if (opts.offset) q = q.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);
  const { data } = await q.order("name");
  return (data ?? []).map(rowToProduct);
}

export async function getProductById(id: string): Promise<DBProduct | null> {
  const { data } = await supabaseAdmin.from("products").select("*").eq("id", id).single();
  return data ? rowToProduct(data) : null;
}

export async function updateProductStock(productId: string, delta: number): Promise<void> {
  await supabaseAdmin.rpc("adjust_stock", { p_product_id: productId, p_delta: delta });
}

export async function upsertProduct(product: Partial<DBProduct> & { id: string }): Promise<DBProduct> {
  const row: Record<string, unknown> = {
    id: product.id,
    category_id: product.categoryId,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    unit: product.unit,
    unit_size: product.unitSize,
    price: product.price,
    srp: product.srp,
    sku: product.sku,
    barcode: product.barcode,
    min_order_qty: product.minOrderQty ?? 1,
    is_active: product.isActive ?? true,
    is_featured: product.isFeatured ?? false,
    stock_qty: product.stockQty ?? 0,
    low_stock_threshold: product.lowStockThreshold ?? 10,
    reorder_point: product.reorderPoint ?? 20,
    image_url: product.imageUrl,
    description: product.description,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabaseAdmin.from("products").upsert(row).select().single();
  if (error) throw new Error(error.message);
  return rowToProduct(data);
}

export async function getCategories(): Promise<{
  id: string; name: string; slug?: string; description?: string; imageUrl?: string; isActive: boolean; sortOrder: number;
}[]> {
  const { data } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    slug: c.slug as string | undefined,
    description: c.description as string | undefined,
    imageUrl: c.image_url as string | undefined,
    isActive: Boolean(c.is_active),
    sortOrder: Number(c.sort_order ?? 0),
  }));
}

export async function getProductByIdOrSlug(idOrSlug: string): Promise<DBProduct | null> {
  const { data } = await supabaseAdmin
    .from("products")
    .select("*")
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .eq("is_active", true)
    .single();
  return data ? rowToProduct(data) : null;
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function getOrdersByUser(retailerId: string): Promise<DBOrder[]> {
  const { data } = await supabaseAdmin
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("retailer_id", retailerId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((row) => {
    const order = rowToOrder(row);
    const r = row as Record<string, unknown>;
    if (r.items) {
      order.items = (r.items as Record<string, unknown>[]).map((i) => ({
        id: i.id as string,
        orderId: i.order_id as string,
        productId: i.product_id as string,
        productName: i.product_name as string,
        productImage: i.product_image as string | undefined,
        qty: Number(i.qty),
        unitPrice: Number(i.unit_price),
        subtotal: Number(i.subtotal),
      }));
    }
    return order;
  });
}

export async function getAllOrders(opts: {
  status?: string;
  driverId?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<DBOrder[]> {
  let q = supabaseAdmin
    .from("orders")
    .select("*, retailer:users!retailer_id(name, store_name, phone), driver:users!driver_id(name, phone)");
  if (opts.status) q = q.eq("status", opts.status);
  if (opts.driverId) q = q.eq("driver_id", opts.driverId);
  if (opts.limit) q = q.limit(opts.limit);
  const { data } = await q.order("created_at", { ascending: false });
  return (data ?? []).map(rowToOrder);
}

export async function getOrderById(id: string): Promise<DBOrder | null> {
  const { data } = await supabaseAdmin
    .from("orders")
    .select("*, retailer:users!retailer_id(name, store_name, phone), driver:users!driver_id(name, phone), items:order_items(*, product:products(name, image_url))")
    .eq("id", id)
    .single();
  if (!data) return null;
  const order = rowToOrder(data);
  const d = data as Record<string, unknown>;
  if (d.items) {
    order.items = (d.items as Record<string, unknown>[]).map((i) => ({
      id: i.id as string,
      orderId: i.order_id as string,
      productId: i.product_id as string,
      productName: i.product_name as string,
      productImage: i.product_image as string | undefined,
      qty: Number(i.qty),
      unitPrice: Number(i.unit_price),
      subtotal: Number(i.subtotal),
    }));
  }
  return order;
}

export async function createOrder(order: {
  id: string;
  orderNumber: string;
  retailerId: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  notes?: string;
  items: Array<{
    productId: string;
    productName: string;
    productImage?: string;
    qty: number;
    unitPrice: number;
    subtotal: number;
  }>;
}): Promise<DBOrder> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .insert({
      id: order.id,
      order_number: order.orderNumber,
      retailer_id: order.retailerId,
      subtotal: order.subtotal,
      delivery_fee: order.deliveryFee,
      discount: order.discount,
      total: order.total,
      payment_method: order.paymentMethod,
      delivery_address: order.deliveryAddress,
      delivery_city: order.deliveryCity,
      notes: order.notes,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  if (order.items.length > 0) {
    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(
      order.items.map((i) => ({
        order_id: order.id,
        product_id: i.productId || null,
        product_name: i.productName,
        product_image: i.productImage ?? null,
        qty: i.qty,
        unit_price: i.unitPrice,
        subtotal: i.subtotal,
      }))
    );
    if (itemsError) throw new Error(`Failed to insert order items: ${itemsError.message}`);
  }

  return rowToOrder(data);
}

export async function updateOrderStatus(
  id: string,
  status: string,
  extra?: {
    driverId?: string;
    paymentStatus?: string;
    paymentIntentId?: string;
    confirmedAt?: string;
    dispatchedAt?: string;
    deliveredAt?: string;
  }
): Promise<void> {
  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (extra?.driverId) update.driver_id = extra.driverId;
  if (extra?.paymentStatus) update.payment_status = extra.paymentStatus;
  if (extra?.paymentIntentId) update.payment_intent_id = extra.paymentIntentId;
  if (extra?.confirmedAt) update.confirmed_at = extra.confirmedAt;
  if (extra?.dispatchedAt) update.dispatched_at = extra.dispatchedAt;
  if (extra?.deliveredAt) update.delivered_at = extra.deliveredAt;
  await supabaseAdmin.from("orders").update(update).eq("id", id);
}

export async function updateOrderPayment(
  id: string,
  paymentStatus: string,
  paymentIntentId?: string
): Promise<void> {
  await supabaseAdmin
    .from("orders")
    .update({ payment_status: paymentStatus, payment_intent_id: paymentIntentId, updated_at: new Date().toISOString() })
    .eq("id", id);
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function getNotifications(userId: string): Promise<{
  id: string; title: string; body: string; type: string; isRead: boolean; data?: unknown; createdAt: string;
}[]> {
  const { data } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    type: n.type,
    isRead: n.is_read,
    data: n.data,
    createdAt: n.created_at,
  }));
}

export async function createNotification(userId: string, notif: {
  title: string; body: string; type: string; data?: Record<string, unknown>;
}): Promise<void> {
  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    title: notif.title,
    body: notif.body,
    type: notif.type,
    data: notif.data,
  });
}

export async function markNotificationRead(userId: string, notifId: string): Promise<void> {
  await supabaseAdmin.from("notifications").update({ is_read: true }).eq("id", notifId).eq("user_id", userId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await supabaseAdmin.from("notifications").update({ is_read: true }).eq("user_id", userId);
}

// ── Wallet ────────────────────────────────────────────────────────────────────

export async function getWalletBalance(userId: string): Promise<number> {
  const { data } = await supabaseAdmin.from("users").select("wallet_balance").eq("id", userId).single();
  return Number(data?.wallet_balance ?? 0);
}

export async function getWalletTransactions(userId: string): Promise<{
  id: string; type: string; amount: number; description: string; status: string; referenceId?: string; createdAt: string;
}[]> {
  const { data } = await supabaseAdmin
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);
  return (data ?? []).map((t) => ({
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    description: t.description,
    status: t.status,
    referenceId: t.reference_id,
    createdAt: t.created_at,
  }));
}

export async function creditWallet(userId: string, amount: number, description: string, referenceId?: string): Promise<void> {
  await supabaseAdmin.rpc("credit_wallet", { p_user_id: userId, p_amount: amount, p_description: description, p_reference_id: referenceId ?? null });
}

export async function debitWallet(userId: string, amount: number, description: string, referenceId?: string): Promise<void> {
  await supabaseAdmin.rpc("debit_wallet", { p_user_id: userId, p_amount: amount, p_description: description, p_reference_id: referenceId ?? null });
}

// ── Loyalty ───────────────────────────────────────────────────────────────────

export async function getLoyaltyPoints(userId: string): Promise<number> {
  const { data } = await supabaseAdmin.from("users").select("loyalty_points").eq("id", userId).single();
  return Number(data?.loyalty_points ?? 0);
}

export async function getLoyaltyTransactions(userId: string): Promise<{
  id: string; points: number; type: string; description: string; orderId?: string; createdAt: string;
}[]> {
  const { data } = await supabaseAdmin
    .from("loyalty_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((t) => ({
    id: t.id,
    points: t.points,
    type: t.type,
    description: t.description,
    orderId: t.order_id,
    createdAt: t.created_at,
  }));
}

export async function awardLoyaltyPoints(userId: string, points: number, orderId: string, description: string): Promise<void> {
  await supabaseAdmin.from("loyalty_transactions").insert({
    user_id: userId,
    points,
    type: "earned",
    description,
    order_id: orderId,
  });
  await supabaseAdmin.rpc("add_loyalty_points", { p_user_id: userId, p_points: points });
}

// ── Pick Lists ────────────────────────────────────────────────────────────────

export async function getPickLists(warehouseId?: string): Promise<{
  id: string; orderId: string; orderNumber?: string; status: string; assignedTo?: string;
  items: { id: string; productName: string; qtyRequired: number; qtyPicked: number; binLocation?: string; status: string; }[];
  createdAt: string;
}[]> {
  let q = supabaseAdmin
    .from("pick_lists")
    .select("*, order:orders(order_number), items:pick_list_items(*)")
    .order("created_at", { ascending: false });
  if (warehouseId) q = q.eq("warehouse_id", warehouseId);
  const { data } = await q;
  return (data ?? []).map((pl) => ({
    id: pl.id,
    orderId: pl.order_id,
    orderNumber: (pl.order as Record<string, unknown>)?.order_number as string | undefined,
    status: pl.status,
    assignedTo: pl.assigned_to,
    items: ((pl.items as Record<string, unknown>[]) ?? []).map((i) => ({
      id: i.id as string,
      productName: i.product_name as string,
      qtyRequired: Number(i.qty_required),
      qtyPicked: Number(i.qty_picked),
      binLocation: i.bin_location as string | undefined,
      status: i.status as string,
    })),
    createdAt: pl.created_at,
  }));
}

export async function updatePickListItem(
  itemId: string,
  qtyPicked: number,
  status: "picked" | "short" | "substituted"
): Promise<void> {
  await supabaseAdmin
    .from("pick_list_items")
    .update({ qty_picked: qtyPicked, status, picked_at: new Date().toISOString() })
    .eq("id", itemId);
}

export async function completePickList(pickListId: string): Promise<void> {
  await supabaseAdmin
    .from("pick_lists")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", pickListId);
}

export async function createPickListForOrder(orderId: string, warehouseId: string): Promise<string> {
  const order = await getOrderById(orderId);
  if (!order?.items?.length) throw new Error("Order has no items");

  const { data: pl, error } = await supabaseAdmin
    .from("pick_lists")
    .insert({ order_id: orderId, warehouse_id: warehouseId, status: "open" })
    .select()
    .single();
  if (error) throw new Error(error.message);

  await supabaseAdmin.from("pick_list_items").insert(
    order.items.map((item) => ({
      pick_list_id: pl.id,
      product_id: item.productId,
      product_name: item.productName,
      qty_required: item.qty,
      qty_picked: 0,
      status: "pending",
    }))
  );

  return pl.id;
}

// ── Driver ────────────────────────────────────────────────────────────────────

export async function updateDriverLocation(
  driverId: string,
  lat: number,
  lng: number,
  heading?: number,
  speed?: number
): Promise<void> {
  await supabaseAdmin.from("driver_locations").upsert({
    driver_id: driverId,
    lat,
    lng,
    heading,
    speed,
    on_duty: true,
    updated_at: new Date().toISOString(),
  });
}

export async function getDriverLocation(driverId: string): Promise<{
  lat: number; lng: number; heading?: number; speed?: number; updatedAt: string; onDuty: boolean;
} | null> {
  const { data } = await supabaseAdmin.from("driver_locations").select("*").eq("driver_id", driverId).single();
  if (!data) return null;
  return {
    lat: Number(data.lat),
    lng: Number(data.lng),
    heading: data.heading ? Number(data.heading) : undefined,
    speed: data.speed ? Number(data.speed) : undefined,
    updatedAt: data.updated_at,
    onDuty: data.on_duty,
  };
}

export async function getDriverDeliveries(driverId: string): Promise<{
  id: string; orderId: string; orderNumber: string; status: string;
  retailerName: string; deliveryAddress: string; codAmount: number; codCollected?: number;
  routePosition: number;
}[]> {
  const { data } = await supabaseAdmin
    .from("deliveries")
    .select("*, order:orders(order_number, total, delivery_address, retailer:users!retailer_id(name, store_name))")
    .eq("driver_id", driverId)
    .not("status", "in", '("delivered","returned")')
    .order("route_position");
  return (data ?? []).map((d) => {
    const o = d.order as Record<string, unknown>;
    const retailer = o?.retailer as Record<string, unknown>;
    return {
      id: d.id,
      orderId: d.order_id,
      orderNumber: o?.order_number as string,
      status: d.status,
      retailerName: (retailer?.store_name ?? retailer?.name) as string,
      deliveryAddress: o?.delivery_address as string,
      codAmount: Number(d.cod_amount ?? 0),
      codCollected: d.cod_collected ? Number(d.cod_collected) : undefined,
      routePosition: Number(d.route_position ?? 0),
    };
  });
}

// ── Deliveries ────────────────────────────────────────────────────────────────

export async function createDelivery(delivery: {
  orderId: string;
  driverId: string;
  routePosition: number;
  codAmount: number;
}): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("deliveries")
    .insert({
      order_id: delivery.orderId,
      driver_id: delivery.driverId,
      route_position: delivery.routePosition,
      cod_amount: delivery.codAmount,
      status: "pending",
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function recordDeliveryProof(
  deliveryId: string,
  proof: {
    proofPhotoUrl?: string;
    signatureUrl?: string;
    recipientName?: string;
    codCollected?: number;
    lat?: number;
    lng?: number;
  }
): Promise<void> {
  await supabaseAdmin
    .from("deliveries")
    .update({
      proof_photo_url: proof.proofPhotoUrl,
      signature_url: proof.signatureUrl,
      recipient_name: proof.recipientName,
      cod_collected: proof.codCollected,
      lat: proof.lat,
      lng: proof.lng,
      status: "delivered",
      delivered_at: new Date().toISOString(),
    })
    .eq("id", deliveryId);
}

export async function recordDeliveryAttempt(
  deliveryId: string,
  reason: string,
  notes?: string
): Promise<void> {
  await supabaseAdmin.from("delivery_attempts").insert({
    delivery_id: deliveryId,
    reason,
    notes,
  });
  await supabaseAdmin
    .from("deliveries")
    .update({ status: "failed", attempted_at: new Date().toISOString() })
    .eq("id", deliveryId);
}

// ── Credit Applications ───────────────────────────────────────────────────────

export async function applyForCredit(retailerId: string, requestedLimit: number, requestedTerms: number): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("credit_applications")
    .insert({ retailer_id: retailerId, requested_limit: requestedLimit, requested_terms: requestedTerms })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function getCreditApplications(status?: string): Promise<{
  id: string; retailerId: string; retailerName: string; storeName?: string; requestedLimit: number;
  requestedTerms: number; status: string; createdAt: string;
}[]> {
  let q = supabaseAdmin
    .from("credit_applications")
    .select("*, retailer:users!retailer_id(name, store_name, phone)")
    .order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return (data ?? []).map((a) => {
    const r = a.retailer as Record<string, unknown>;
    return {
      id: a.id,
      retailerId: a.retailer_id,
      retailerName: r?.name as string,
      storeName: r?.store_name as string | undefined,
      requestedLimit: Number(a.requested_limit),
      requestedTerms: Number(a.requested_terms),
      status: a.status,
      createdAt: a.created_at,
    };
  });
}

export async function reviewCreditApplication(
  applicationId: string,
  reviewedBy: string,
  decision: "approved" | "rejected",
  approvedLimit?: number,
  approvedTerms?: number,
  notes?: string
): Promise<void> {
  const { data } = await supabaseAdmin.from("credit_applications").select("retailer_id").eq("id", applicationId).single();
  await supabaseAdmin.from("credit_applications").update({
    status: decision,
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
    approved_limit: approvedLimit,
    approved_terms: approvedTerms,
    notes,
  }).eq("id", applicationId);

  if (decision === "approved" && data?.retailer_id && approvedLimit) {
    await supabaseAdmin.from("users").update({
      credit_limit: approvedLimit,
      credit_terms: approvedTerms ?? 7,
    }).eq("id", data.retailer_id);
  }
}

// ── Admin Stats ───────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  // Use PHT (UTC+8) midnight as "start of today" so orders placed in the
  // Philippine morning aren't counted as yesterday due to UTC offset.
  const PHT_OFFSET_MS = 8 * 60 * 60 * 1000;
  const nowPHT = new Date(Date.now() + PHT_OFFSET_MS);
  nowPHT.setUTCHours(0, 0, 0, 0);
  const todayStart = new Date(nowPHT.getTime() - PHT_OFFSET_MS);

  const [allOrders, todayOrders, retailers] = await Promise.all([
    supabaseAdmin.from("orders").select("id, total, status"),
    supabaseAdmin.from("orders").select("id, total").gte("created_at", todayStart.toISOString()),
    supabaseAdmin.from("users").select("id").eq("role", "retailer").eq("status", "active"),
  ]);

  const orders = allOrders.data ?? [];
  const todayOrdData = todayOrders.data ?? [];

  return {
    totalOrders: orders.length,
    ordersToday: todayOrdData.length,
    revenueToday: todayOrdData.reduce((s, o) => s + Number(o.total), 0),
    revenueMonth: orders.reduce((s, o) => s + Number(o.total), 0),
    activeRetailers: retailers.data?.length ?? 0,
    newRetailersMonth: 0,
    pendingOrders: orders.filter((o) => o.status === "pending").length,
    processingOrders: orders.filter((o) => ["confirmed", "picking", "picked"].includes(o.status)).length,
    outForDelivery: orders.filter((o) => ["dispatched", "out_for_delivery"].includes(o.status)).length,
    lowStockItems: 0,
  };
}

// ── Push Subscriptions ────────────────────────────────────────────────────────

export async function savePushSubscription(
  userId: string,
  sub: { endpoint: string; keys: { auth: string; p256dh: string } }
): Promise<void> {
  await supabaseAdmin.from("push_subscriptions").upsert({
    user_id: userId,
    endpoint: sub.endpoint,
    auth: sub.keys.auth,
    p256dh: sub.keys.p256dh,
  }, { onConflict: "endpoint" });
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  await supabaseAdmin.from("push_subscriptions").delete().eq("endpoint", endpoint);
}
