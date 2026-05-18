import type { OrderEvent } from '../types'
import { User, MapPin, IndianRupee, CheckCircle2 } from 'lucide-react'

interface DeliveryCardProps {
  order: OrderEvent
  onMarkDelivered: () => void
  delivering: boolean
}

export function DeliveryCard({ order, onMarkDelivered, delivering }: DeliveryCardProps) {
  const shortId = order.orderId.slice(-8).toUpperCase()

  return (
    <div className="rounded-2xl border-2 border-emerald-200 bg-white shadow-md p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-1">Order ID</p>
          <p className="text-2xl font-bold text-gray-900 font-mono">#{shortId}</p>
        </div>
        <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-700">
          Out for Delivery
        </span>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center gap-3 text-gray-700">
          <User className="h-5 w-5 text-emerald-500 shrink-0" />
          <span className="text-lg font-semibold">{order.userName}</span>
        </div>

        <div className="flex items-center gap-3 text-gray-600">
          <IndianRupee className="h-5 w-5 text-emerald-500 shrink-0" />
          <span className="text-lg font-medium">₹{order.amountPayable.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-3 text-gray-600">
          <MapPin className="h-5 w-5 text-emerald-500 shrink-0" />
          <span className="text-base">{order.warehouseName}</span>
        </div>
      </div>

      <button
        onClick={onMarkDelivered}
        disabled={delivering}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 text-base font-bold text-white transition-all active:scale-95 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <CheckCircle2 className="h-5 w-5" />
        {delivering ? 'Marking…' : 'Mark Delivered'}
      </button>
    </div>
  )
}
