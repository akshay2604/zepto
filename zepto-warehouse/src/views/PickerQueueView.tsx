import { useEffect, useState } from 'react'
import { useOrderStream } from '../hooks/useOrderStream'
import { useAnalytics } from '../hooks/useAnalytics'
import { useWarehouse } from '../context/WarehouseContext'
import { StatusBadge } from '../components/StatusBadge'
import { Loader2, X } from 'lucide-react'
import type { OrderStatus, Picker } from '../types'

const IN_FLIGHT: OrderStatus[] = ['PLACED', 'CONFIRMED', 'PICKING', 'PACKED']

interface RiderModal {
  orderId: string
  riderName: string
  riderPhone: string
}

interface PickerModal {
  orderId: string
  pickerId: string
}

export function PickerQueueView() {
  const { selected } = useWarehouse()
  const orders = useOrderStream(selected?.id)
  const { orderFunnel, avgDelivery } = useAnalytics(5000, selected?.id)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [riderModal, setRiderModal] = useState<RiderModal | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [pickerModal, setPickerModal] = useState<PickerModal | null>(null)
  const [pickers, setPickers] = useState<Picker[]>([])
  const [pickerLoading, setPickerLoading] = useState(false)

  const inFlight = orders.filter((o) => IN_FLIGHT.includes(o.status))

  const inQueue = (orderFunnel.countByStatus['CONFIRMED'] ?? 0) + (orderFunnel.countByStatus['PICKING'] ?? 0)
  const packed = orderFunnel.countByStatus['PACKED'] ?? 0

  useEffect(() => {
    if (!selected?.id) return
    fetch(`/pickers?warehouseId=${selected.id}`)
      .then((r) => r.json())
      .then((data: Picker[]) => setPickers(data))
      .catch(() => {})
  }, [selected?.id])

  async function handleAction(orderId: string, path: string) {
    setLoadingAction(orderId + path)
    try {
      await fetch(`/orders/${orderId}/${path}`, { method: 'POST' })
    } finally {
      setLoadingAction(null)
    }
  }

  async function handleAssignPicker() {
    if (!pickerModal || !pickerModal.pickerId) return
    setPickerLoading(true)
    try {
      await fetch(`/orders/${pickerModal.orderId}/assign-picker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickerId: pickerModal.pickerId }),
      })
      setPickerModal(null)
    } finally {
      setPickerLoading(false)
    }
  }

  async function handleAssignRider() {
    if (!riderModal) return
    setModalLoading(true)
    try {
      await fetch(`/orders/${riderModal.orderId}/assign-rider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riderName: riderModal.riderName, riderPhone: riderModal.riderPhone }),
      })
      setRiderModal(null)
    } finally {
      setModalLoading(false)
    }
  }

  function getActionButton(orderId: string, status: OrderStatus) {
    const isLoading = (path: string) => loadingAction === orderId + path
    const spinner = <Loader2 className="h-3 w-3 animate-spin" />

    if (status === 'PLACED') {
      const loading = isLoading('confirm')
      return (
        <button
          disabled={loading}
          onClick={() => handleAction(orderId, 'confirm')}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? spinner : 'Confirm'}
        </button>
      )
    }
    if (status === 'CONFIRMED') {
      return (
        <button
          onClick={() => setPickerModal({ orderId, pickerId: pickers[0]?.id ?? '' })}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 flex items-center gap-1"
        >
          Assign Picker
        </button>
      )
    }
    if (status === 'PICKING') {
      const loading = isLoading('pack')
      return (
        <button
          disabled={loading}
          onClick={() => handleAction(orderId, 'pack')}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? spinner : 'Pack'}
        </button>
      )
    }
    if (status === 'PACKED') {
      return (
        <button
          onClick={() => setRiderModal({ orderId, riderName: '', riderPhone: '' })}
          className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white bg-violet-600 hover:bg-violet-700 flex items-center gap-1"
        >
          Assign Rider
        </button>
      )
    }
    return null
  }

  function getCancelButton(orderId: string, status: OrderStatus) {
    if (status === 'CANCELLED' || status === 'DELIVERED') return null
    const loading = loadingAction === orderId + 'cancel'
    return (
      <button
        disabled={loading}
        onClick={() => handleAction(orderId, 'cancel')}
        className="text-xs p-1.5 rounded-lg font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 flex items-center"
        title="Cancel order"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
      </button>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Picker Queue</h1>

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: 'In Queue', value: inQueue, color: 'text-yellow-600' },
          { label: 'Packed', value: packed, color: 'text-orange-600' },
          { label: 'Delivered Today', value: avgDelivery.totalDelivered, color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Orders table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Order ID', 'Customer', 'Status', 'Picker', 'Items', 'Amount', 'Warehouse', 'Action', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inFlight.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                  No in-flight orders right now
                </td>
              </tr>
            ) : (
              inFlight.map((order) => (
                <tr key={order.orderId} className="hover:bg-amber-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-gray-700">#{order.orderId.slice(-8).toUpperCase()}</td>
                  <td className="px-4 py-3 text-gray-700">{order.userName}</td>
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 text-gray-600">
                    {order.pickerName
                      ? <span className="inline-flex items-center gap-1 text-blue-700 font-medium">{order.pickerName}</span>
                      : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{order.itemCount}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">₹{order.amountPayable.toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-600">{order.warehouseName}</td>
                  <td className="px-4 py-3">{getActionButton(order.orderId, order.status)}</td>
                  <td className="px-4 py-3">{getCancelButton(order.orderId, order.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Picker Assignment Modal */}
      {pickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-bold text-gray-900 mb-4">Assign Picker</h2>
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Select Picker</label>
              {pickers.length === 0 ? (
                <p className="text-sm text-gray-400">No pickers available for this warehouse.</p>
              ) : (
                <select
                  value={pickerModal.pickerId}
                  onChange={(e) => setPickerModal({ ...pickerModal, pickerId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {pickers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPickerModal(null)}
                disabled={pickerLoading}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignPicker}
                disabled={pickerLoading || !pickerModal.pickerId}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {pickerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rider Assignment Modal */}
      {riderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-bold text-gray-900 mb-4">Assign Rider</h2>
            <div className="flex flex-col gap-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Rider Name</label>
                <input
                  type="text"
                  value={riderModal.riderName}
                  onChange={(e) => setRiderModal({ ...riderModal, riderName: e.target.value })}
                  placeholder="Enter rider name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Rider Phone</label>
                <input
                  type="text"
                  value={riderModal.riderPhone}
                  onChange={(e) => setRiderModal({ ...riderModal, riderPhone: e.target.value })}
                  placeholder="+91XXXXXXXXXX"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRiderModal(null)}
                disabled={modalLoading}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignRider}
                disabled={modalLoading || !riderModal.riderName || !riderModal.riderPhone}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {modalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
