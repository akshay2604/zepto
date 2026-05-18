export type OrderStatus =
  | 'PLACED' | 'PAYMENT_PENDING' | 'CONFIRMED' | 'PICKING'
  | 'PACKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'

export type MovementType =
  | 'INBOUND' | 'ORDER_RESERVE' | 'ORDER_PICK'
  | 'ORDER_CANCEL' | 'SPOILAGE' | 'ADJUSTMENT'

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

export interface Warehouse {
  id: string
  name: string
  address: string
  city: string
  pincode: string
  lat: number | null
  lng: number | null
  active: boolean
}

export interface User {
  id: string
  name: string
  phone: string
  email: string | null
  createdAt: string
  active: boolean
  warehouseId: string | null
  warehouseName: string | null
}

export interface InventoryLedger {
  ledgerId: string
  warehouseId: string
  warehouseName: string
  variantId: string
  displayName: string
  skuCode: string
  qtyOnHand: number
  qtyReserved: number
  qtyAvailable: number
  reorderThreshold: number
  lowStock: boolean
}

export interface Category {
  id: string
  name: string
  parentId: string | null
}

export interface Variant {
  id: string
  skuCode: string
  displayName: string
  packSize: string | null
  unit: string | null
  mrp: number
  sellingPrice: number
  imageUrl: string | null
  available: boolean
  qtyAvailable: number | null
  inStock: boolean | null
}

export interface Order {
  id: string
  status: OrderStatus
  user: { id: string; name: string; phone: string }
  warehouse: { id: string; name: string; city: string }
  amountPayable: number
  paymentMethod: string | null
  paymentStatus: string | null
  items: unknown[]
  placedAt: string
}

export interface Product {
  id: string
  name: string
  brand: string | null
  description: string | null
  categoryId: string
  categoryName: string
  active: boolean
  variants: Variant[]
}
