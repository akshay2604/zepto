import { useEffect, useState, useCallback } from 'react'
import { Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Order, OrderStatus } from '../types'

const STATUS_COLORS: Record<OrderStatus, string> = {
  PLACED:           'bg-yellow-100 text-yellow-700',
  PAYMENT_PENDING:  'bg-orange-100 text-orange-700',
  CONFIRMED:        'bg-blue-100 text-blue-700',
  PICKING:          'bg-indigo-100 text-indigo-700',
  PACKED:           'bg-violet-100 text-violet-700',
  OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-700',
  DELIVERED:        'bg-green-100 text-green-700',
  CANCELLED:        'bg-gray-100 text-gray-500',
}

interface PagedResponse {
  content: Order[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export function OrdersView() {
  const [data, setData] = useState<PagedResponse | null>(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchOrders = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/orders?page=${p}&size=20`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (e) {
      console.error('Failed to load orders', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders(page) }, [fetchOrders, page])

  async function handleDelete(order: Order) {
    if (!window.confirm(`Delete order #${order.id.slice(-8).toUpperCase()}? This cannot be undone.`)) return
    setDeletingId(order.id)
    try {
      const res = await fetch(`/orders/${order.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await fetchOrders(page)
    } catch (e) {
      console.error('Failed to delete order', e)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        {data && (
          <span className="text-sm text-gray-400">{data.totalElements.toLocaleString()} total</span>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Order ID', 'Customer', 'Warehouse', 'Status', 'Items', 'Amount', 'Payment', 'Placed At', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.content.map((order) => (
                  <tr key={order.id} className="hover:bg-violet-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">
                      #{order.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{order.user.name}</p>
                      <p className="text-xs text-gray-400">{order.user.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{order.warehouse.name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[order.status]}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{order.items.length}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">₹{Number(order.amountPayable).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {order.paymentStatus ? (
                        <span className={`text-xs font-semibold ${order.paymentStatus === 'SUCCESS' ? 'text-green-600' : order.paymentStatus === 'FAILED' ? 'text-red-500' : 'text-gray-400'}`}>
                          {order.paymentStatus}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(order.placedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(order)}
                        disabled={deletingId === order.id}
                        title="Delete order"
                        className="flex items-center justify-center rounded-md border border-red-200 p-1.5 text-red-400 hover:border-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
                      >
                        {deletingId === order.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                  </tr>
                ))}
                {data?.content.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                <span className="text-xs text-gray-400">
                  Page {data.page + 1} of {data.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => p - 1)}
                    disabled={data.page === 0}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={data.page === data.totalPages - 1}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
