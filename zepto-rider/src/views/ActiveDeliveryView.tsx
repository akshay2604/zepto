import { useState } from 'react'
import { useOrderStream } from '../hooks/useOrderStream'
import { useRider } from '../context/RiderContext'
import { DeliveryCard } from '../components/DeliveryCard'
import type { OrderEvent } from '../types/index'

type Lane = {
  key: string
  label: string
  statuses: OrderEvent['status'][]
}

const LANES: Lane[] = [
  { key: 'picking',     label: 'Being Picked',      statuses: ['PICKING'] },
  { key: 'packed',      label: 'Ready',              statuses: ['PACKED'] },
  { key: 'outForDelivery', label: 'In Flight',       statuses: ['OUT_FOR_DELIVERY'] },
  { key: 'delivered',   label: 'Done',               statuses: ['DELIVERED'] },
]

export function ActiveDeliveryView() {
  const orders = useOrderStream()
  const { rider } = useRider()
  const [delivering, setDelivering] = useState<string | null>(null)

  async function handleMarkDelivered(orderId: string) {
    setDelivering(orderId)
    try {
      await fetch(`/orders/${orderId}/deliver`, { method: 'POST' })
    } finally {
      setDelivering(null)
    }
  }

  const warehouseOrders = rider?.warehouseId
    ? orders.filter((o) => o.warehouseId === rider.warehouseId)
    : []

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Deliveries</h1>
        <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>

      {!rider?.warehouseId ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No dark store assigned — contact your admin
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {LANES.map((lane) => {
            const laneOrders = warehouseOrders.filter((o) =>
              (lane.statuses as string[]).includes(o.status)
            )
            return (
              <div key={lane.key} className="flex flex-col gap-3">
                {/* Lane header */}
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-700">{lane.label}</h2>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                    {laneOrders.length}
                  </span>
                </div>

                {/* Lane cards */}
                {laneOrders.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Nothing here</p>
                ) : (
                  laneOrders.map((order) => {
                    if (order.status === 'OUT_FOR_DELIVERY') {
                      return (
                        <DeliveryCard
                          key={order.orderId}
                          order={order}
                          onMarkDelivered={() => handleMarkDelivered(order.orderId)}
                          delivering={delivering === order.orderId}
                        />
                      )
                    }

                    if (order.status === 'DELIVERED') {
                      return (
                        <div
                          key={order.orderId}
                          className="rounded-xl border border-gray-100 bg-gray-50 p-3 opacity-70"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs text-gray-500 uppercase">
                              {order.orderId.slice(-8).toUpperCase()}
                            </span>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              Delivered
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{order.userName}</p>
                        </div>
                      )
                    }

                    // PICKING or PACKED — compact card
                    const statusColor =
                      order.status === 'PICKING'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'

                    return (
                      <div
                        key={order.orderId}
                        className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs text-gray-500 uppercase">
                            {order.orderId.slice(-8).toUpperCase()}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}
                          >
                            {order.status === 'PICKING' ? 'Picking' : 'Packed'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-gray-800">{order.userName}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )
                  })
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
