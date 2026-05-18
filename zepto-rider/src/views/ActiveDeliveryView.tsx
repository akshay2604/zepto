import { useState } from 'react'
import { useOrderStream } from '../hooks/useOrderStream'
import { DeliveryCard } from '../components/DeliveryCard'
import { Loader2 } from 'lucide-react'

export function ActiveDeliveryView() {
  const orders = useOrderStream()
  const [delivering, setDelivering] = useState<string | null>(null)

  const active = orders.filter((o) => o.status === 'OUT_FOR_DELIVERY')

  async function handleMarkDelivered(orderId: string) {
    setDelivering(orderId)
    try {
      await fetch(`/orders/${orderId}/deliver`, { method: 'POST' })
    } finally {
      setDelivering(null)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Active Deliveries</h1>
        <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      {active.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-emerald-200 py-20 text-center">
          <Loader2 className="h-10 w-10 text-emerald-400 animate-spin mb-4" />
          <p className="text-lg font-semibold text-gray-600">No active deliveries</p>
          <p className="mt-1 text-sm text-gray-400">Waiting for orders to arrive…</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {active.map((order) => (
            <DeliveryCard
              key={order.orderId}
              order={order}
              onMarkDelivered={() => handleMarkDelivered(order.orderId)}
              delivering={delivering === order.orderId}
            />
          ))}
        </div>
      )}

      <div className="mt-6 rounded-xl bg-emerald-50 border border-emerald-100 p-4">
        <p className="text-xs text-emerald-600 font-semibold">
          {active.length} order{active.length !== 1 ? 's' : ''} out for delivery
        </p>
      </div>
    </div>
  )
}
