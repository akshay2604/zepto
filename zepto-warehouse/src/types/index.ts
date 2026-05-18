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
  zones: ZoneType[]
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

export type ZoneType = 'AMBIENT' | 'CHILLED' | 'FROZEN' | 'PRODUCE'

export interface Zone {
  id: string
  warehouseId: string
  name: string
  zoneType: ZoneType
  displayOrder: number
  x: number
  y: number
  w: number
  h: number
  orderCount: number
}

export type BatchStatus = 'PENDING' | 'ACTIVE' | 'COMPLETE'

export interface PickBatchItem {
  id: string
  orderId: string
  orderItemId: string
  variantId: string
  displayName: string
  sku: string
  zoneType: ZoneType
  qty: number
  picked: boolean
  pickedAt: string | null
  sortOrder: number
}

export interface PickBatch {
  id: string
  warehouseId: string
  pickerId: string | null
  pickerName: string | null
  status: BatchStatus
  orderCount: number
  zonesCovered: ZoneType[]
  createdAt: string
  completedAt: string | null
  orderIds: string[]
  items: PickBatchItem[]
}
