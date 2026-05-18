import { useEffect, useState } from 'react'
import { RefreshCw, Loader2, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'
import type { Warehouse, InventoryLedger, MovementType } from '../types'

const MOVEMENT_TYPES: MovementType[] = ['INBOUND', 'SPOILAGE', 'ADJUSTMENT']

export function InventoryManagementView() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('')
  const [ledgers, setLedgers] = useState<InventoryLedger[]>([])
  const [loading, setLoading] = useState(false)
  const [warehousesLoading, setWarehousesLoading] = useState(true)
  const [rowLoading, setRowLoading] = useState<Record<string, boolean>>({})
  const [lowStockFilter, setLowStockFilter] = useState(false)
  const [movementType, setMovementType] = useState<MovementType>('INBOUND')

  // Per-row add-stock qty inputs, keyed by ledgerId
  const [addQty, setAddQty] = useState<Record<string, number>>({})
  // Per-row threshold inputs, keyed by ledgerId
  const [thresholdVal, setThresholdVal] = useState<Record<string, number>>({})

  async function fetchWarehouses() {
    setWarehousesLoading(true)
    try {
      const res = await fetch('/warehouses')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: Warehouse[] = await res.json()
      const active = data.filter((w) => w.active)
      setWarehouses(active)
      if (active.length > 0 && !selectedWarehouseId) {
        setSelectedWarehouseId(active[0].id)
      }
    } catch (e) {
      console.error('Failed to load warehouses', e)
    } finally {
      setWarehousesLoading(false)
    }
  }

  async function fetchLedgers(warehouseId: string) {
    if (!warehouseId) return
    setLoading(true)
    try {
      const res = await fetch(`/inventory?warehouseId=${warehouseId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: InventoryLedger[] = await res.json()
      setLedgers(data)
      // Seed input defaults from current values
      const qtyDefaults: Record<string, number> = {}
      const threshDefaults: Record<string, number> = {}
      for (const l of data) {
        qtyDefaults[l.ledgerId] = 50
        threshDefaults[l.ledgerId] = l.reorderThreshold
      }
      setAddQty(qtyDefaults)
      setThresholdVal(threshDefaults)
    } catch (e) {
      console.error('Failed to load inventory', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWarehouses() }, [])

  useEffect(() => {
    if (selectedWarehouseId) fetchLedgers(selectedWarehouseId)
  }, [selectedWarehouseId])

  async function handleAddStock(ledger: InventoryLedger) {
    const absQty = addQty[ledger.ledgerId] ?? 50
    // SPOILAGE removes stock — negate; INBOUND/ADJUSTMENT use value as-is
    const qtyDelta = movementType === 'SPOILAGE' ? -absQty : absQty
    setRowLoading((prev) => ({ ...prev, [ledger.ledgerId]: true }))
    try {
      const res = await fetch('/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouseId: ledger.warehouseId,
          variantId: ledger.variantId,
          movementType,
          qtyDelta,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setLedgers((prev) =>
        prev.map((l) => {
          if (l.ledgerId !== ledger.ledgerId) return l
          const newOnHand = l.qtyOnHand + qtyDelta
          const newAvailable = l.qtyAvailable + qtyDelta
          return {
            ...l,
            qtyOnHand: newOnHand,
            qtyAvailable: newAvailable,
            lowStock: newAvailable <= l.reorderThreshold,
          }
        }),
      )
    } catch (e) {
      console.error('Add stock failed', e)
    } finally {
      setRowLoading((prev) => ({ ...prev, [ledger.ledgerId]: false }))
    }
  }

  async function handleSetThreshold(ledger: InventoryLedger) {
    const threshold = thresholdVal[ledger.ledgerId] ?? ledger.reorderThreshold
    setRowLoading((prev) => ({ ...prev, [ledger.ledgerId]: true }))
    try {
      const res = await fetch(`/inventory/${ledger.warehouseId}/${ledger.variantId}/threshold`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorderThreshold: threshold }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setLedgers((prev) =>
        prev.map((l) => {
          if (l.ledgerId !== ledger.ledgerId) return l
          return {
            ...l,
            reorderThreshold: threshold,
            lowStock: l.qtyAvailable <= threshold,
          }
        }),
      )
    } catch (e) {
      console.error('Set threshold failed', e)
    } finally {
      setRowLoading((prev) => ({ ...prev, [ledger.ledgerId]: false }))
    }
  }

  const sorted = [...ledgers].sort((a, b) => {
    if (a.lowStock && !b.lowStock) return -1
    if (!a.lowStock && b.lowStock) return 1
    return 0
  })
  const displayed = lowStockFilter ? sorted.filter((l) => l.lowStock) : sorted
  const lowCount = ledgers.filter((l) => l.lowStock).length

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Inventory Management</h1>

      {/* Warehouse selector */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Warehouse</label>
          {warehousesLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
          ) : (
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — {w.city}
                </option>
              ))}
              {warehouses.length === 0 && (
                <option disabled>No active warehouses</option>
              )}
            </select>
          )}
        </div>

        <button
          onClick={() => fetchLedgers(selectedWarehouseId)}
          disabled={loading || !selectedWarehouseId}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={clsx('h-3.5 w-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Movement type selector */}
      <div className="mb-5 flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Movement type:</span>
        {MOVEMENT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setMovementType(t)}
            className={clsx(
              'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
              movementType === t
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-violet-100 hover:text-violet-700',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Summary bar */}
      {!loading && ledgers.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
          <span className="text-sm text-gray-700">
            <span className="font-semibold text-gray-900">{ledgers.length}</span> items
          </span>
          <span className="text-sm">
            <span
              className={clsx(
                'font-semibold',
                lowCount > 0 ? 'text-red-600' : 'text-green-600',
              )}
            >
              {lowCount}
            </span>
            <span className="text-gray-600"> low stock</span>
            {lowCount > 0 && <AlertTriangle className="inline ml-1 h-3.5 w-3.5 text-red-500" />}
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-600 select-none">
            <input
              type="checkbox"
              checked={lowStockFilter}
              onChange={(e) => setLowStockFilter(e.target.checked)}
              className="accent-violet-600"
            />
            Low stock only
          </label>
        </div>
      )}

      {/* Inventory table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['SKU', 'Name', 'On Hand', 'Reserved', 'Available', 'Threshold', 'Status', 'Movement Qty', 'Set Threshold'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map((l) => {
                  const busy = rowLoading[l.ledgerId] ?? false
                  return (
                    <tr
                      key={l.ledgerId}
                      className={clsx(l.lowStock ? 'bg-red-50' : 'hover:bg-violet-50')}
                    >
                      <td className="px-3 py-2.5 font-mono text-xs text-gray-400 whitespace-nowrap">
                        {l.skuCode}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-800 max-w-[160px] truncate">
                        {l.displayName}
                      </td>
                      <td className="px-3 py-2.5 text-gray-700">{l.qtyOnHand}</td>
                      <td className="px-3 py-2.5 text-gray-600">{l.qtyReserved}</td>
                      <td className="px-3 py-2.5 font-semibold text-gray-900">{l.qtyAvailable}</td>
                      <td className="px-3 py-2.5 text-gray-500">{l.reorderThreshold}</td>
                      <td className="px-3 py-2.5">
                        {l.lowStock ? (
                          <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                            LOW
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                            OK
                          </span>
                        )}
                      </td>

                      {/* Add Stock */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            value={addQty[l.ledgerId] ?? 50}
                            onChange={(e) =>
                              setAddQty((prev) => ({
                                ...prev,
                                [l.ledgerId]: parseInt(e.target.value) || 1,
                              }))
                            }
                            className="w-16 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                          />
                          <button
                            onClick={() => handleAddStock(l)}
                            disabled={busy}
                            className="flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-50"
                          >
                            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                            Add
                          </button>
                        </div>
                      </td>

                      {/* Set Threshold */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            value={thresholdVal[l.ledgerId] ?? l.reorderThreshold}
                            onChange={(e) =>
                              setThresholdVal((prev) => ({
                                ...prev,
                                [l.ledgerId]: parseInt(e.target.value) || 0,
                              }))
                            }
                            className="w-16 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-800 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                          />
                          <button
                            onClick={() => handleSetThreshold(l)}
                            disabled={busy}
                            className="flex items-center gap-1 rounded-md border border-violet-300 px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-50 transition-colors disabled:opacity-50"
                          >
                            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                            Set
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {displayed.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                      {!selectedWarehouseId
                        ? 'Select a warehouse to view inventory'
                        : lowStockFilter
                        ? 'No low-stock items'
                        : 'No inventory data'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
