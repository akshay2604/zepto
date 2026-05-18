import { useState } from 'react'
import { Bike, ShoppingBag, RefreshCw, Users, Loader2, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { useUser } from '../context/UserContext'
import { useOrderHistory } from '../hooks/useOrderHistory'
import { StatusBadge } from '../components/StatusBadge'
import { OrderDetailModal } from '../components/OrderDetailModal'
import type { OrderResponse } from '../types'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
}

export function HistoryView() {
  const { user } = useUser()
  const { orders, loading, error, refetch } = useOrderHistory(user?.id ?? null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  const onTheWayOrders = orders.filter(o => o.status === 'OUT_FOR_DELIVERY')

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-gray-400">
        <Users className="h-10 w-10 opacity-40" />
        <p className="text-sm">Select a customer to see their order history.</p>
        <Link
          to="/customers"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          Pick a customer →
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">

      {/* Page header */}
      <div className="mb-5 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Order History</h1>
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{user.name}</span>
            {orders.length > 0 && ` · ${orders.length} orders`}
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm hover:shadow-md transition-all disabled:opacity-50"
        >
          <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Rider on the way banner — shown for each live delivery */}
      {onTheWayOrders.map(o => (
        <button
          key={o.id}
          onClick={() => setSelectedOrderId(o.id)}
          className="relative mb-4 w-full overflow-hidden rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-left transition-transform hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="absolute inset-0 rounded-xl border-2 border-amber-300 animate-ping opacity-30" />
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <Bike className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-800">Rider is on the way!</p>
              <p className="text-xs text-amber-600 truncate">
                Order #{o.id.slice(-8).toUpperCase()} · ₹{Number(o.amountPayable).toFixed(0)}
              </p>
            </div>
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-amber-200 animate-pulse" />
          </div>
        </button>
      ))}

      {/* States */}
      {loading && orders.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading orders…
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-400">
          <ShoppingBag className="h-10 w-10 opacity-30" />
          <p className="text-sm">No orders yet.</p>
          <Link to="/shop" className="text-sm font-medium text-indigo-600 hover:underline">
            Start shopping →
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {orders.map(order => (
            <OrderRow
              key={order.id}
              order={order}
              onClick={() => setSelectedOrderId(order.id)}
            />
          ))}
        </ul>
      )}

      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  )
}

function OrderRow({ order, onClick }: { order: OrderResponse; onClick: () => void }) {
  const isOnTheWay = order.status === 'OUT_FOR_DELIVERY'

  return (
    <li>
      <button
        onClick={onClick}
        className={clsx(
          'w-full rounded-xl border bg-white px-4 py-3 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.99]',
          isOnTheWay ? 'border-amber-200 ring-1 ring-amber-200' : 'border-gray-100',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-gray-900">
                #{order.id.slice(-8).toUpperCase()}
              </span>
              <StatusBadge status={order.status} />
            </div>
            <p className="mt-1 text-xs text-gray-400">{formatDate(order.placedAt)}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">
                ₹{Number(order.amountPayable).toFixed(0)}
              </p>
              <p className="text-xs text-gray-400">{order.items.length} items</p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </div>
        </div>
      </button>
    </li>
  )
}
