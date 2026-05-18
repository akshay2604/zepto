import { useState } from 'react'
import { PackageSearch, Play, X, RefreshCw, Eye } from 'lucide-react'
import { useWarehouse } from '../context/WarehouseContext'
import { useBatches } from '../hooks/useBatches'
import type { PickBatch, PickBatchItem, Picker, ZoneType, BatchStatus } from '../types'

const ZONE_CHIP: Record<ZoneType, string> = {
  PRODUCE: 'bg-green-100 text-green-700 border-green-200',
  CHILLED: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  FROZEN:  'bg-indigo-100 text-indigo-700 border-indigo-200',
  AMBIENT: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

const ZONE_HEADER: Record<ZoneType, string> = {
  PRODUCE: 'bg-green-50 border-green-200 text-green-800',
  CHILLED: 'bg-cyan-50 border-cyan-200 text-cyan-800',
  FROZEN:  'bg-indigo-50 border-indigo-200 text-indigo-800',
  AMBIENT: 'bg-yellow-50 border-yellow-200 text-yellow-800',
}

const STATUS_STYLE: Record<BatchStatus, string> = {
  PENDING:  'bg-gray-100 text-gray-600',
  ACTIVE:   'bg-blue-100 text-blue-700',
  COMPLETE: 'bg-green-100 text-green-700',
}

function groupByZone(items: PickBatchItem[]) {
  const map = new Map<ZoneType, PickBatchItem[]>()
  for (const item of items) {
    if (!map.has(item.zoneType)) map.set(item.zoneType, [])
    map.get(item.zoneType)!.push(item)
  }
  return map
}

export function BatchDashboardView() {
  const { selected } = useWarehouse()
  const { batches, loading, refresh, assignPicker, startBatch } = useBatches(selected?.id)
  const [pickers, setPickers] = useState<Picker[]>([])
  const [, setPickersLoaded] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [detailBatch, setDetailBatch] = useState<PickBatch | null>(null)

  const pending  = batches.filter(b => b.status === 'PENDING').length
  const active   = batches.filter(b => b.status === 'ACTIVE').length
  const complete = batches.filter(b => b.status === 'COMPLETE').length

  const loadEligiblePickers = async (batchZones: ZoneType[]) => {
    if (!selected?.id) return
    const zonesParam = batchZones.length > 0
      ? `&zones=${batchZones.join(',')}`
      : ''
    const res = await fetch(`/pickers/eligible?warehouseId=${selected.id}${zonesParam}`)
    if (res.ok) setPickers(await res.json())
    setPickersLoaded(true)
  }

  const handleAssign = async (batchId: string, pickerId: string) => {
    setLoadingAction(`assign-${batchId}`)
    try {
      await assignPicker(batchId, pickerId)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to assign picker'
      alert(msg)
    } finally {
      setLoadingAction(null)
    }
  }

  const handleStart = async (batchId: string) => {
    setLoadingAction(`start-${batchId}`)
    try { await startBatch(batchId) }
    finally { setLoadingAction(null) }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PackageSearch className="text-indigo-600" size={22} />
          <h1 className="text-xl font-bold text-gray-900">Batch Dashboard</h1>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending', value: pending,  color: 'text-gray-700 bg-gray-50 border-gray-200' },
          { label: 'Active',  value: active,   color: 'text-blue-700 bg-blue-50 border-blue-200' },
          { label: 'Done',    value: complete, color: 'text-green-700 bg-green-50 border-green-200' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`flex flex-col items-center py-4 rounded-xl border ${color}`}>
            <span className="text-3xl font-bold">{value}</span>
            <span className="text-xs font-medium mt-1">{label}</span>
          </div>
        ))}
      </div>

      {!selected ? (
        <div className="text-center py-16 text-gray-400">Select a warehouse to view batches.</div>
      ) : batches.length === 0 && !loading ? (
        <div className="text-center py-16 text-gray-400 border border-dashed border-gray-200 rounded-xl">
          No batches yet — go to Floor Plan to form batches from confirmed orders.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                {['Batch', 'Orders', 'Zones', 'Picker', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {batches.map(batch => (
                <tr key={batch.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    #{batch.id.slice(-8)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {batch.orderCount}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {batch.zonesCovered.map(z => (
                        <span key={z} className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${ZONE_CHIP[z]}`}>
                          {z[0]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {batch.status === 'COMPLETE' ? (
                      <span className="text-gray-400 text-xs">{batch.pickerName ?? '—'}</span>
                    ) : (
                      <select
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 min-w-[140px]"
                        value={batch.pickerId ?? ''}
                        onFocus={() => loadEligiblePickers(batch.zonesCovered)}
                        onChange={e => e.target.value && handleAssign(batch.id, e.target.value)}
                        disabled={!!loadingAction}
                      >
                        <option value="">{batch.pickerName ?? 'Assign eligible picker…'}</option>
                        {pickers.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLE[batch.status]}`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {batch.status === 'PENDING' && (
                        <button
                          onClick={() => handleStart(batch.id)}
                          disabled={!!loadingAction}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Play size={11} />
                          Start
                        </button>
                      )}
                      {(batch.status === 'ACTIVE' || batch.status === 'COMPLETE') && (
                        <button
                          onClick={() => setDetailBatch(batch)}
                          className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50"
                        >
                          <Eye size={11} />
                          View
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pick list slide-in */}
      {detailBatch && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setDetailBatch(null)} />
          <div className="relative w-full max-w-md bg-white shadow-2xl overflow-y-auto flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">Pick List — #{detailBatch.id.slice(-8)}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {detailBatch.orderCount} orders · {detailBatch.items.length} items
                  {detailBatch.pickerName && ` · ${detailBatch.pickerName}`}
                </div>
              </div>
              <button onClick={() => setDetailBatch(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 p-4 space-y-4">
              {[...groupByZone(detailBatch.items)].map(([zone, items]) => (
                <div key={zone}>
                  <div className={`px-3 py-1.5 rounded-t-lg border text-xs font-semibold uppercase tracking-wide ${ZONE_HEADER[zone]}`}>
                    {zone}
                  </div>
                  <div className="border border-t-0 rounded-b-lg divide-y divide-gray-50 overflow-hidden">
                    {items.map(item => (
                      <div key={item.id} className={`flex items-center justify-between px-3 py-2.5 ${item.picked ? 'bg-gray-50' : 'bg-white'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${item.picked ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                            {item.picked && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                          </div>
                          <span className={`text-sm ${item.picked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {item.displayName}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">×{item.qty}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
