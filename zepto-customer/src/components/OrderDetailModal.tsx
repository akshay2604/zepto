import { useEffect, useState } from 'react'
import { X, Bike, MapPin, CreditCard, Package, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'
import type { OrderResponse, DeliveryResponse, OrderStatus } from '../types'
import { OrderStepper } from './OrderStepper'
import { StatusBadge } from './StatusBadge'

const STEPPER_STATUSES: OrderStatus[] = [
  'PLACED', 'CONFIRMED', 'PICKING', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED',
]

interface Props {
  orderId: string
  onClose: () => void
}

export function OrderDetailModal({ orderId, onClose }: Props) {
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [delivery, setDelivery] = useState<DeliveryResponse | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/orders/${orderId}`)
      if (!res.ok) throw new Error()
      const data: OrderResponse = await res.json()
      setOrder(data)

      if (
        data.status === 'OUT_FOR_DELIVERY' ||
        data.status === 'DELIVERED'
      ) {
        const dRes = await fetch(`/orders/${orderId}/delivery`)
        if (dRes.ok) setDelivery(await dRes.json())
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [orderId])

  const shortId = orderId.slice(-8).toUpperCase()
  const isOnTheWay = order?.status === 'OUT_FOR_DELIVERY'
  const isCancelled = order?.status === 'CANCELLED'
  const showStepper = order && STEPPER_STATUSES.includes(order.status as OrderStatus)

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">

          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4">
            <div>
              <h2 className="font-mono text-base font-bold text-gray-900">#{shortId}</h2>
              {order && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(order.placedAt).toLocaleString('en-IN', {
                    dateStyle: 'medium', timeStyle: 'short',
                  })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {order && <StatusBadge status={order.status} />}
              <button
                onClick={load}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {loading && !order ? (
            <div className="flex h-48 items-center justify-center text-gray-400 text-sm">
              Loading…
            </div>
          ) : order ? (
            <div className="px-5 py-4 space-y-5">

              {/* Rider on the way banner */}
              {isOnTheWay && (
                <div className="relative overflow-hidden rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                  <div className="absolute inset-0 rounded-xl border-2 border-amber-400 animate-ping opacity-20" />
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                      <Bike className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-800">Rider is on the way!</p>
                      {delivery && (
                        <p className="text-xs text-amber-600 mt-0.5">
                          {delivery.riderName} · {delivery.riderPhone}
                        </p>
                      )}
                    </div>
                    <span className="ml-auto flex h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-amber-200 animate-pulse" />
                  </div>
                </div>
              )}

              {/* Cancelled state */}
              {isCancelled && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
                  This order was cancelled.
                </div>
              )}

              {/* Stepper */}
              {showStepper && !isCancelled && (
                <div className="overflow-x-auto">
                  <OrderStepper status={order.status as OrderStatus} />
                </div>
              )}

              {/* Items */}
              <div>
                <div className="flex items-center gap-1.5 mb-2 text-sm font-semibold text-gray-700">
                  <Package className="h-4 w-4" />
                  Items ({order.items.length})
                </div>
                <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 overflow-hidden">
                  {order.items.map(item => (
                    <li key={item.variantId} className="flex items-center justify-between px-3 py-2.5 text-sm bg-white">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.displayName}</p>
                        <p className="text-xs text-gray-400">{item.categoryName} · {item.sku}</p>
                      </div>
                      <div className="ml-4 shrink-0 text-right">
                        <p className="text-xs text-gray-500">×{item.qty}</p>
                        <p className="font-semibold text-gray-800">₹{Number(item.lineTotal).toFixed(0)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Address */}
              <div className="flex gap-2 rounded-xl bg-gray-50 px-3 py-3 text-sm">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
                <div className="text-gray-600">
                  <p>{order.address.line1}</p>
                  {order.address.line2 && <p>{order.address.line2}</p>}
                  <p>{order.address.city} — {order.address.pincode}</p>
                </div>
              </div>

              {/* Payment summary */}
              <div className="rounded-xl bg-gray-50 px-3 py-3 text-sm space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-gray-700 mb-2">
                  <CreditCard className="h-4 w-4" />
                  Payment
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>MRP total</span>
                  <span>₹{Number(order.totalMrp).toFixed(0)}</span>
                </div>
                {Number(order.totalDiscount) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>−₹{Number(order.totalDiscount).toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>Delivery</span>
                  <span className={clsx(Number(order.deliveryFee) === 0 && 'text-green-600')}>
                    {Number(order.deliveryFee) === 0 ? 'Free' : `₹${Number(order.deliveryFee).toFixed(0)}`}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1.5 font-bold text-gray-900">
                  <span>Total</span>
                  <span>₹{Number(order.amountPayable).toFixed(0)}</span>
                </div>
                <p className="text-xs text-gray-400 pt-0.5">
                  {order.paymentMethod} · {order.paymentStatus}
                </p>
              </div>

              {/* Delivery time if delivered */}
              {order.status === 'DELIVERED' && delivery?.deliveryTimeSecs && (
                <p className="text-center text-xs text-gray-400">
                  Delivered in {Math.round(delivery.deliveryTimeSecs / 60)} min
                  {delivery.riderName ? ` by ${delivery.riderName}` : ''}
                </p>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-red-500">Failed to load order.</div>
          )}
        </div>
      </div>
    </>
  )
}
