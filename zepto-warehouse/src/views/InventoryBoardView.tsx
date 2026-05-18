import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Search, Loader2, AlertTriangle, X } from 'lucide-react'
import { useInventoryLedger, type LedgerItem, type ManualMovementType } from '../hooks/useInventoryLedger'
import { useWarehouse } from '../context/WarehouseContext'

interface MovementModal {
  item: LedgerItem
  type: ManualMovementType
  qty: string
}

interface ThresholdEdit {
  variantId: string
  warehouseId: string
  value: string
}

const MOVEMENT_META: Record<ManualMovementType, { label: string; colorClass: string; sign: 1 | -1 | 0 }> = {
  INBOUND:    { label: 'Restock',   colorClass: 'bg-green-600 hover:bg-green-700',  sign:  1 },
  SPOILAGE:   { label: 'Spoilage',  colorClass: 'bg-red-500 hover:bg-red-600',      sign: -1 },
  ADJUSTMENT: { label: 'Adjust',    colorClass: 'bg-blue-500 hover:bg-blue-600',    sign:  0 },
}

export function InventoryBoardView() {
  const { selected } = useWarehouse()
  const { ledgers, applyMovement, updateThreshold } = useInventoryLedger(5000, selected?.id)
  const [search, setSearch] = useState('')
  const [movementModal, setMovementModal] = useState<MovementModal | null>(null)
  const [thresholdEdit, setThresholdEdit] = useState<ThresholdEdit | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const filtered = ledgers.filter((item) =>
    item.displayName.toLowerCase().includes(search.toLowerCase()) ||
    item.skuCode.toLowerCase().includes(search.toLowerCase()),
  )

  const lowStockItems = ledgers.filter((i) => i.lowStock)

  const top20 = [...ledgers]
    .sort((a, b) => b.qtyOnHand - a.qtyOnHand)
    .slice(0, 20)
    .map((item) => ({ name: item.displayName.slice(0, 18), qty: item.qtyOnHand }))

  async function handleMovementSubmit() {
    if (!movementModal) return
    const raw = parseInt(movementModal.qty, 10)
    if (isNaN(raw) || raw === 0) return
    const meta = MOVEMENT_META[movementModal.type]
    // For INBOUND force positive, SPOILAGE force negative, ADJUSTMENT use as-is
    const qtyDelta = meta.sign === 1 ? Math.abs(raw) : meta.sign === -1 ? -Math.abs(raw) : raw
    setSubmitting(true)
    try {
      await applyMovement(movementModal.item.warehouseId, movementModal.item.variantId, movementModal.type, qtyDelta)
      setMovementModal(null)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleThresholdSave() {
    if (!thresholdEdit) return
    const val = parseInt(thresholdEdit.value, 10)
    if (isNaN(val) || val < 1) return
    setSubmitting(true)
    try {
      await updateThreshold(thresholdEdit.warehouseId, thresholdEdit.variantId, val)
      setThresholdEdit(null)
    } finally {
      setSubmitting(false)
    }
  }

  const isEditingThreshold = (item: LedgerItem) =>
    thresholdEdit?.variantId === item.variantId && thresholdEdit?.warehouseId === item.warehouseId

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Inventory Board</h1>

      {/* Low stock alert panel */}
      {lowStockItems.length > 0 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-bold text-red-700">
              {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} below reorder threshold
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((item) => (
              <div key={item.variantId} className="flex items-center gap-2 rounded-lg bg-white border border-red-200 px-3 py-1.5 text-xs shadow-sm">
                <span className="font-medium text-gray-800">{item.displayName}</span>
                <span className="text-red-600 font-bold">{item.qtyOnHand} left</span>
                <button
                  onClick={() => setMovementModal({ item, type: 'INBOUND', qty: '' })}
                  className="ml-1 rounded px-2 py-0.5 bg-green-600 text-white font-semibold hover:bg-green-700"
                >
                  Restock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4 w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Filter by name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {/* Inventory table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['SKU', 'Display Name', 'Warehouse', 'On Hand', 'Reserved', 'Available', 'Threshold', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((item) => (
              <tr key={`${item.warehouseId}-${item.variantId}`} className={item.lowStock ? 'bg-red-50' : 'hover:bg-amber-50'}>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.skuCode}</td>
                <td className="px-4 py-3 font-medium text-gray-800">
                  {item.displayName}
                  {item.lowStock && (
                    <span className="ml-2 text-xs font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">LOW</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{item.warehouseName}</td>
                <td className="px-4 py-3 text-gray-700">{item.qtyOnHand}</td>
                <td className="px-4 py-3 text-gray-600">{item.qtyReserved}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{item.qtyAvailable}</td>

                {/* Inline threshold edit */}
                <td className="px-4 py-3">
                  {isEditingThreshold(item) ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        value={thresholdEdit!.value}
                        onChange={(e) => setThresholdEdit({ ...thresholdEdit!, value: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleThresholdSave(); if (e.key === 'Escape') setThresholdEdit(null) }}
                        className="w-16 rounded border border-gray-300 px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                        autoFocus
                      />
                      <button
                        onClick={handleThresholdSave}
                        disabled={submitting}
                        className="text-xs px-1.5 py-0.5 rounded bg-amber-500 text-white font-semibold hover:bg-amber-600 disabled:opacity-50"
                      >
                        {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                      </button>
                      <button onClick={() => setThresholdEdit(null)} className="text-gray-400 hover:text-gray-600">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setThresholdEdit({ variantId: item.variantId, warehouseId: item.warehouseId, value: String(item.reorderThreshold) })}
                      className="text-gray-600 hover:text-amber-700 hover:underline text-xs tabular-nums"
                      title="Click to edit threshold"
                    >
                      {item.reorderThreshold}
                    </button>
                  )}
                </td>

                {/* Movement action buttons */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {(['INBOUND', 'SPOILAGE', 'ADJUSTMENT'] as ManualMovementType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setMovementModal({ item, type, qty: '' })}
                        className={`text-xs px-2 py-1 rounded font-semibold text-white ${MOVEMENT_META[type].colorClass}`}
                      >
                        {MOVEMENT_META[type].label}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">No items found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bar chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Top 20 Variants by Stock</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={top20} layout="vertical" margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} width={120} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="qty" fill="#d97706" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stock Movement Modal */}
      {movementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-bold text-gray-900 mb-1">
              {MOVEMENT_META[movementModal.type].label}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {movementModal.item.displayName}
              <span className="ml-2 font-mono text-xs text-gray-400">{movementModal.item.skuCode}</span>
            </p>

            <div className="flex gap-2 mb-4">
              {(['INBOUND', 'SPOILAGE', 'ADJUSTMENT'] as ManualMovementType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setMovementModal({ ...movementModal, type })}
                  className={`flex-1 text-xs py-1.5 rounded-lg font-semibold border transition-colors ${
                    movementModal.type === type
                      ? 'text-white border-transparent ' + MOVEMENT_META[type].colorClass
                      : 'text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {MOVEMENT_META[type].label}
                </button>
              ))}
            </div>

            <div className="mb-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                {movementModal.type === 'ADJUSTMENT' ? 'Qty Delta (+ or -)' : 'Quantity'}
              </label>
              <input
                type="number"
                value={movementModal.qty}
                onChange={(e) => setMovementModal({ ...movementModal, qty: e.target.value })}
                placeholder={movementModal.type === 'ADJUSTMENT' ? 'e.g. -5 or +10' : 'e.g. 50'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-400 mb-5">
              Current on-hand: <span className="font-semibold text-gray-700">{movementModal.item.qtyOnHand}</span>
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setMovementModal(null)}
                disabled={submitting}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMovementSubmit}
                disabled={submitting || !movementModal.qty || movementModal.qty === '0'}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${MOVEMENT_META[movementModal.type].colorClass}`}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
