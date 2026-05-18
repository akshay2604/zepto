import { useState, useEffect } from 'react'
import { ScanLine, CheckCircle2, Circle, ChevronDown } from 'lucide-react'
import { useWarehouse } from '../context/WarehouseContext'
import { useBatches } from '../hooks/useBatches'
import type { PickBatch, PickBatchItem, Picker, ZoneType } from '../types'

const ZONE_COLORS: Record<ZoneType, { header: string; dot: string }> = {
  PRODUCE: { header: 'bg-green-50 border-green-200 text-green-800',  dot: 'bg-green-500' },
  CHILLED: { header: 'bg-cyan-50 border-cyan-200 text-cyan-800',    dot: 'bg-cyan-500' },
  FROZEN:  { header: 'bg-indigo-50 border-indigo-200 text-indigo-800', dot: 'bg-indigo-500' },
  AMBIENT: { header: 'bg-yellow-50 border-yellow-200 text-yellow-800', dot: 'bg-yellow-500' },
}

function groupByZone(items: PickBatchItem[]): [ZoneType, PickBatchItem[]][] {
  const order: ZoneType[] = ['PRODUCE', 'CHILLED', 'FROZEN', 'AMBIENT']
  const map = new Map<ZoneType, PickBatchItem[]>()
  for (const item of items) {
    if (!map.has(item.zoneType)) map.set(item.zoneType, [])
    map.get(item.zoneType)!.push(item)
  }
  return order.filter(z => map.has(z)).map(z => [z, map.get(z)!])
}

export function PickSessionView() {
  const { selected } = useWarehouse()
  const { batches, loading: batchLoading, completeBatch, pickItem, refresh } = useBatches(selected?.id)
  const [pickers, setPickers] = useState<Picker[]>([])
  const [selectedPicker, setSelectedPicker] = useState<string>('')
  const [selectedBatchId, setSelectedBatchId] = useState<string>('')
  const [localItems, setLocalItems] = useState<Map<string, boolean>>(new Map())
  const [completing, setCompleting] = useState(false)
  const [done, setDone] = useState(false)

  const activeBatches = batches.filter(b => b.status === 'ACTIVE')
  const activeBatch: PickBatch | undefined = activeBatches.find(b => b.id === selectedBatchId) ?? activeBatches[0]

  const items = activeBatch?.items ?? []
  const totalItems = items.length
  const pickedCount = items.filter(i => localItems.get(i.id) ?? i.picked).length
  const allPicked = totalItems > 0 && pickedCount === totalItems
  const progressPct = totalItems > 0 ? Math.round((pickedCount / totalItems) * 100) : 0

  useEffect(() => {
    if (!selected?.id) return
    fetch(`/pickers?warehouseId=${selected.id}`)
      .then(r => r.json())
      .then(setPickers)
      .catch(() => {})
  }, [selected?.id])

  // Reset local picked state when batch changes
  useEffect(() => {
    setLocalItems(new Map())
    setDone(false)
  }, [selectedBatchId, activeBatch?.id])

  const handlePickItem = async (item: PickBatchItem) => {
    if (localItems.get(item.id) || item.picked) return
    setLocalItems(prev => new Map(prev).set(item.id, true))
    try {
      await pickItem(activeBatch!.id, item.id)
    } catch {
      setLocalItems(prev => { const m = new Map(prev); m.delete(item.id); return m })
    }
  }

  const handleComplete = async () => {
    if (!activeBatch) return
    setCompleting(true)
    try {
      await completeBatch(activeBatch.id)
      setDone(true)
      await refresh()
    } finally {
      setCompleting(false)
    }
  }

  const grouped = groupByZone(items)

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <CheckCircle2 className="mx-auto text-green-500" size={56} />
          <h2 className="text-xl font-bold text-gray-900">Batch Complete!</h2>
          <p className="text-gray-500 text-sm">All orders have been packed and are ready for rider assignment.</p>
          <button
            onClick={() => { setDone(false); setSelectedBatchId('') }}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
          >
            Start Next Batch
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <ScanLine className="text-indigo-600" size={20} />
            <h1 className="text-base font-bold text-gray-900">Pick Session</h1>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Picker selector */}
            <div className="relative">
              <select
                className="w-full appearance-none text-sm border border-gray-200 rounded-xl px-3 py-2 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={selectedPicker}
                onChange={e => setSelectedPicker(e.target.value)}
              >
                <option value="">Select picker…</option>
                {pickers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
            </div>

            {/* Batch selector */}
            <div className="relative">
              <select
                className="w-full appearance-none text-sm border border-gray-200 rounded-xl px-3 py-2 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                value={selectedBatchId}
                onChange={e => setSelectedBatchId(e.target.value)}
              >
                <option value="">Select batch…</option>
                {activeBatches.map(b => (
                  <option key={b.id} value={b.id}>
                    #{b.id.slice(-8)} ({b.orderCount} orders)
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-3 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Progress */}
          {activeBatch && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>{pickedCount}/{totalItems} items picked</span>
                <span className="font-semibold text-indigo-600">{progressPct}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full px-4 py-4 space-y-3">
        {!selected ? (
          <p className="text-center py-12 text-gray-400 text-sm">Select a warehouse first.</p>
        ) : activeBatches.length === 0 && !batchLoading ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-gray-400 text-sm">No active batches.</p>
            <p className="text-gray-300 text-xs">Start a batch from the Batch Dashboard.</p>
          </div>
        ) : !activeBatch ? (
          <p className="text-center py-12 text-gray-400 text-sm">Select a batch above to begin.</p>
        ) : (
          <>
            {grouped.map(([zone, zoneItems]) => {
              const colors = ZONE_COLORS[zone]
              const zonePicked = zoneItems.filter(i => localItems.get(i.id) ?? i.picked).length
              return (
                <div key={zone} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                  <div className={`flex items-center justify-between px-4 py-2.5 border-b ${colors.header}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                      <span className="text-xs font-bold uppercase tracking-wide">{zone}</span>
                    </div>
                    <span className="text-xs text-gray-500">{zonePicked}/{zoneItems.length}</span>
                  </div>
                  <div className="bg-white divide-y divide-gray-50">
                    {zoneItems.map(item => {
                      const isPicked = localItems.get(item.id) ?? item.picked
                      return (
                        <button
                          key={item.id}
                          onClick={() => handlePickItem(item)}
                          disabled={isPicked}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            isPicked ? 'bg-gray-50 cursor-default' : 'hover:bg-indigo-50/50 active:bg-indigo-50'
                          }`}
                        >
                          {isPicked
                            ? <CheckCircle2 className="text-green-500 flex-shrink-0" size={18} />
                            : <Circle className="text-gray-300 flex-shrink-0" size={18} />
                          }
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isPicked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                              {item.displayName}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{item.sku}</p>
                          </div>
                          <span className={`text-sm font-bold flex-shrink-0 ${isPicked ? 'text-gray-300' : 'text-gray-600'}`}>
                            ×{item.qty}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            <div className="pb-8 pt-2">
              <button
                onClick={handleComplete}
                disabled={!allPicked || completing}
                className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
                  allPicked && !completing
                    ? 'bg-green-500 text-white shadow-lg shadow-green-200 hover:bg-green-600 active:scale-[0.98]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {completing ? 'Completing…' : allPicked ? 'Complete Batch ✓' : `${totalItems - pickedCount} items remaining`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
