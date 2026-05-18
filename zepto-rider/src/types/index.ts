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
