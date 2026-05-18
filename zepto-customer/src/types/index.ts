// ── Catalog ───────────────────────────────────────────────────────────────────

export interface Warehouse {
  id: string
  name: string
  address: string
  city: string
  pincode: string
  lat: number
  lng: number
  active: boolean
}

export interface Variant {
  id: string
  skuCode: string
  displayName: string
  packSize: string
  unit: string
  mrp: number
  sellingPrice: number
  imageUrl: string | null
  available: boolean
  qtyAvailable: number | null   // null when no warehouse context
  inStock: boolean | null       // null when no warehouse context
}

export interface CatalogProduct {
  id: string
  name: string
  brand: string
  description: string | null
  categoryId: string
  categoryName: string
  active: boolean
  variants: Variant[]
}

export interface Category {
  id: string
  name: string
  parentId: string | null
}

// ── Cart ──────────────────────────────────────────────────────────────────────

export interface CartItem {
  variant: Variant
  productName: string
  qty: number
}

// ── User session ──────────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  phone: string
  email: string | null
  warehouseId: string | null
  warehouseName: string | null
}

// ── Orders ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'PLACED'
  | 'PAYMENT_PENDING'
  | 'CONFIRMED'
  | 'PICKING'
  | 'PACKED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'

export type MovementType =
  | 'INBOUND'
  | 'ORDER_RESERVE'
  | 'ORDER_PICK'
  | 'ORDER_CANCEL'
  | 'SPOILAGE'
  | 'ADJUSTMENT'

export interface OrderEvent {
  orderId: string
  userName: string
  status: OrderStatus
  amountPayable: number
  itemCount: number
  warehouseId: string
  warehouseName: string
  timestamp: string
}

export interface InventoryEvent {
  variantId: string
  sku: string
  displayName: string
  movementType: MovementType
  qtyDelta: number
  qtyOnHand: number
  qtyAvailable: number
  warehouseId: string
  warehouseName: string
  timestamp: string
}

export interface SimulatorStatus {
  paused: boolean
  totalOrders: number
  totalDelivered: number
  totalMovements: number
  activeEmitters: number
}

export interface InventoryStatusItem {
  variantId: string
  displayName: string
  sku: string
  qtyOnHand: number
  qtyReserved: number
  qtyAvailable: number
  lowStock: boolean
}

export interface TopVariant {
  variantId: string
  displayName: string
  sku: string
  totalQtySold: number
}

export interface MovementAudit {
  id: string
  variantName: string
  sku: string
  movementType: MovementType
  qtyDelta: number
  createdAt: string
}

export interface OrderFunnel {
  countByStatus: Record<string, number>
}

export interface AvgDelivery {
  avgDeliveryTimeSecs: number
  totalDelivered: number
}
