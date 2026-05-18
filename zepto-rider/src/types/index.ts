export type OrderStatus =
  | 'PLACED' | 'PAYMENT_PENDING' | 'CONFIRMED' | 'PICKING'
  | 'PACKED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'

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

export interface Rider {
  id: string
  name: string
  phone: string | null
  vehicleNumber: string | null
  active: boolean
  warehouseId: string | null
  warehouseName: string | null
}

export interface Warehouse {
  id: string
  name: string
  city: string
  address: string
  pincode: string
  active: boolean
}
