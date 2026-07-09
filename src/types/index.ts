// ─── User & Auth ─────────────────────────────────────────────────────────────

export type UserRole = "retailer" | "admin" | "warehouse" | "delivery" | "super_admin";

export interface User {
  id: string;
  phone: string;
  email?: string;
  name: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export interface Store {
  id: string;
  ownerId: string;
  name: string;
  barangay: string;
  city: string;
  province: string;
  address: string;
  landmark?: string;
  lat?: number;
  lng?: number;
  phone: string;
  imageUrl?: string;
  isVerified: boolean;
  createdAt: string;
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export type SubscriptionStatus = "active" | "expired" | "pending_payment" | "cancelled";

export interface Subscription {
  id: string;
  userId: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  amountPaid: number;
  paymentMethod: string;
  referenceNumber: string;
}

// ─── Product & Category ───────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  description?: string;
  productCount: number;
  isActive: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  categoryId: string;
  category?: Category;
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  unit: string;       // e.g., "piece", "box", "case"
  unitSize?: string;  // e.g., "330ml", "1kg"
  imageUrl?: string;
  images?: string[];
  price: number;
  srp?: number;       // Suggested retail price
  sku: string;
  barcode?: string;
  minOrderQty: number;
  maxOrderQty?: number;
  isActive: boolean;
  isFeatured: boolean;
  tags?: string[];
  stock: number;
  lowStockThreshold: number;
  createdAt: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
}

// ─── Order ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "picking"
  | "packed"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "failed_delivery"
  | "returned";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentMethod = "gcash" | "maya" | "cod" | "bank_transfer" | "credit";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  fulfilledQty?: number;
  status: "pending" | "picked" | "partial" | "unavailable";
}

export interface Order {
  id: string;
  orderNumber: string;
  storeId: string;
  store?: Store;
  userId: string;
  user?: User;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryAddress: string;
  deliveryDate?: string;
  notes?: string;
  fulfillmentEvents: FulfillmentEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface FulfillmentEvent {
  id: string;
  orderId: string;
  status: OrderStatus;
  note?: string;
  performedBy?: string;
  createdAt: string;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export interface StockMovement {
  id: string;
  productId: string;
  product?: Product;
  type: "in" | "out" | "adjustment" | "reserved" | "released";
  quantity: number;
  reference?: string;  // order id or purchase order
  note?: string;
  performedBy: string;
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export type NotificationType =
  | "order_confirmed"
  | "order_picked"
  | "order_packed"
  | "order_out_for_delivery"
  | "order_delivered"
  | "order_failed"
  | "low_stock"
  | "subscription_expiring"
  | "payment_received"
  | "system";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  orderId?: string;
  createdAt: string;
}

// ─── Support ──────────────────────────────────────────────────────────────────

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";

export interface SupportTicket {
  id: string;
  userId: string;
  user?: User;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface AdminStats {
  totalOrders: number;
  ordersToday: number;
  revenueToday: number;
  revenueMonth: number;
  activeRetailers: number;
  newRetailersMonth: number;
  pendingOrders: number;
  processingOrders: number;
  outForDelivery: number;
  lowStockItems: number;
}

export interface RetailerDashboardData {
  recentOrders: Order[];
  frequentProducts: Product[];
  unreadNotifications: number;
  subscriptionStatus: SubscriptionStatus;
  subscriptionDaysLeft?: number;
}

// ─── Supplier ─────────────────────────────────────────────────────────────────
export type SupplierStatus = "active" | "inactive" | "pending";

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  status: SupplierStatus;
  paymentTerms: string; // e.g. "30 days NET"
  leadTimeDays: number;
  totalPurchases: number;
  lastOrderDate: string;
  categories: string[];
  createdAt: string;
}

// ─── Driver ───────────────────────────────────────────────────────────────────
export type DriverStatus = "active" | "on_route" | "off_duty" | "inactive";
export type VehicleType = "motorcycle" | "van" | "tricycle" | "truck";

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  vehicleType: VehicleType;
  vehiclePlate: string;
  status: DriverStatus;
  rating: number;
  deliveriesTotal: number;
  deliveriesToday: number;
  currentRouteId?: string;
  avatarInitials: string;
  createdAt: string;
}

// ─── Route ────────────────────────────────────────────────────────────────────
export type RouteStatus = "planned" | "active" | "completed" | "cancelled";

export interface Route {
  id: string;
  name: string;
  driverId?: string;
  driver?: Driver;
  status: RouteStatus;
  stops: number;
  completedStops: number;
  distance: string;
  estimatedDuration: string;
  orderIds: string[];
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

// ─── Purchase Order ───────────────────────────────────────────────────────────
export type PurchaseOrderStatus = "draft" | "sent" | "confirmed" | "received" | "partial" | "cancelled";

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  productName: string;
  sku: string;
  orderedQty: number;
  receivedQty: number;
  unitCost: number;
  totalCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier?: Supplier;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  total: number;
  notes?: string;
  expectedDate: string;
  receivedDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Promotion ────────────────────────────────────────────────────────────────
export type DiscountType = "percentage" | "fixed";
export type PromotionStatus = "active" | "scheduled" | "ended" | "draft";

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  minimumOrder?: number;
  productIds?: string[];
  categoryIds?: string[];
  startDate: string;
  endDate: string;
  status: PromotionStatus;
  usageCount: number;
  maxUsage?: number;
  createdAt: string;
}

// ─── Warehouse ────────────────────────────────────────────────────────────────
export interface WarehouseBin {
  id: string;
  aisle: string;
  shelf: string;
  bin: string;
  productId?: string;
  productName?: string;
  capacity: number;
  currentStock: number;
}

export interface PickListItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  pickedQty: number;
  bin: string;
  status: "pending" | "picked" | "partial";
}

export interface PickList {
  id: string;
  orderId: string;
  orderNumber: string;
  status: "open" | "in_progress" | "completed";
  assignedTo?: string;
  items: PickListItem[];
  createdAt: string;
  completedAt?: string;
}

export interface GoodsReceipt {
  id: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierName: string;
  items: { productName: string; sku: string; expectedQty: number; receivedQty: number; }[];
  status: "pending" | "in_progress" | "completed";
  receivedAt?: string;
  createdAt: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export interface RetailerAnalytics {
  totalSpentThisYear: number;
  totalOrdersThisYear: number;
  averageOrderValue: number;
  savingsVsMarket: number;
  monthlySpending: { month: string; amount: number; }[];
  topProducts: { productId: string; name: string; orderCount: number; totalSpent: number; }[];
}

// ─── Loyalty ──────────────────────────────────────────────────────────────────
export interface LoyaltyPoint {
  id: string;
  userId: string;
  type: "earned" | "redeemed" | "expired";
  points: number;
  description: string;
  orderId?: string;
  createdAt: string;
}
