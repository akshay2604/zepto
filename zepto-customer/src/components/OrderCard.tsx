import type { OrderEvent } from '../types'
import { StatusBadge } from './StatusBadge'
import { ShoppingBag, MapPin, User, Clock } from 'lucide-react'

function relativeTime(timestamp: string) {
  const diffMs = Date.now() - new Date(timestamp).getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  if (diffSecs < 60) return `${diffSecs}s ago`
  const diffMins = Math.floor(diffSecs / 60)
  if (diffMins < 60) return `${diffMins}m ago`
  return `${Math.floor(diffMins / 60)}h ago`
}

export function OrderCard({ order }: { order: OrderEvent }) {
  const shortId = order.orderId.slice(-8).toUpperCase()

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-sm font-semibold text-gray-900">#{shortId}</span>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <User className="h-3.5 w-3.5" />
            <span>{order.userName}</span>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <ShoppingBag className="h-3.5 w-3.5" />
          <span>{order.itemCount} items</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium text-gray-800">₹{order.amountPayable.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          <span>{order.warehouseName}</span>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <Clock className="h-3.5 w-3.5" />
          <span>{relativeTime(order.timestamp)}</span>
        </div>
      </div>
    </div>
  )
}
