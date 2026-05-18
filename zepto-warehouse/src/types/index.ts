export interface Warehouse {
  id: string
  name: string
  address: string | null
  city: string | null
  pincode: string | null
  lat: number | null
  lng: number | null
  active: boolean
}

export type OrderStatus =
  | 'PLACED' | 'PAYMENT_PENDING' | 'CONFIRMED' | 'PICKING'
  | 'PACKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'

export type MovementType =
  | 'INBOUND' | 'ORDER_RESERVE' | 'ORDER_PICK'
  | 'ORDER_CANCEL' | 'SPOILAGE' | 'ADJUSTMENT'

export interface Picker {
  id: string
  name: string
  phone: string | null
  active: boolean
}

export interface OrderEvent {
  orderId: string
  userName: string
  status: OrderStatus
  amountPayable: number
  itemCount: number
  warehouseId: string
  warehouseName: string
  pickerName: string | null
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
