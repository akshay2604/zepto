import { clsx } from 'clsx'
import type { OrderStatus } from '../types'

const STATUS_STYLES: Record<OrderStatus, string> = {
  PLACED: 'bg-gray-100 text-gray-700',
  PAYMENT_PENDING: 'bg-gray-200 text-gray-800',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PICKING: 'bg-yellow-100 text-yellow-700',
  PACKED: 'bg-orange-100 text-orange-700',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        STATUS_STYLES[status],
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}
