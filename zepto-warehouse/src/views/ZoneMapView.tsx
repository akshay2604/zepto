import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layers, RefreshCw, ArrowRight } from 'lucide-react'
import { useWarehouse } from '../context/WarehouseContext'
import { useZones } from '../hooks/useZones'
import { useBatches } from '../hooks/useBatches'
import { useOrderStream } from '../hooks/useOrderStream'
import { WarehouseFloorPlan } from '../components/WarehouseFloorPlan'
import type { ZoneType } from '../types'

const ZONE_COLORS: Record<ZoneType, string> = {
  PRODUCE: 'bg-green-100 text-green-800 border-green-300',
  CHILLED: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  FROZEN:  'bg-indigo-100 text-indigo-800 border-indigo-300',
  AMBIENT: 'bg-yellow-100 text-yellow-800 border-yellow-300',
}

const ZONE_DOT: Record<ZoneType, string> = {
  PRODUCE: 'bg-green-500',
  CHILLED: 'bg-cyan-500',
  FROZEN:  'bg-indigo-500',
  AMBIENT: 'bg-yellow-500',
}

export function ZoneMapView() {
  const { selected } = useWarehouse()
  const { zones, loading: zonesLoading, refresh: refreshZones } = useZones(selected?.id)
  const { formBatches, forming } = useBatches(selected?.id)
  const allOrders = useOrderStream(selected?.id)
  const navigate = useNavigate()
  const [hoveredZone, setHoveredZone] = useState<ZoneType | null>(null)
  const [selectedZone, setSelectedZone] = useState<ZoneType | null>(null)
  const [orderZoneMap, setOrderZoneMap] = useState<Map<string, ZoneType[]>>(new Map())

  const confirmedOrders = allOrders.filter(o => o.status === 'CONFIRMED')

  // Derive which zones each confirmed order touches by category inference via backend zone counts
  // We show zone chips per order based on zones that have >0 counts, approximated via
  // the zone data. For a richer view, we resolve per-order zone sets from the items.
  useEffect(() => {
    if (!selected?.id || confirmedOrders.length === 0) return
    const buildMap = async () => {
      const map = new Map<string, ZoneType[]>()
      // We batch-fetch order details to get item categories
      await Promise.all(
        confirmedOrders.map(async (order) => {
          try {
            const res = await fetch(`/orders/${order.orderId}`)
            if (!res.ok) return
            const detail = await res.json()
            const zoneset = new Set<ZoneType>()
            for (const item of (detail.items ?? [])) {
              const z = resolveZone(item.categoryName ?? '')
              zoneset.add(z)
            }
            map.set(order.orderId, [...zoneset].sort())
          } catch { /* skip */ }
        })
      )
      setOrderZoneMap(new Map(map))
    }
    buildMap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmedOrders.length, selected?.id])

  const handleFormBatches = async () => {
    await formBatches()
    navigate('/batches')
  }

  const filteredOrders = selectedZone
    ? confirmedOrders.filter(o => orderZoneMap.get(o.orderId)?.includes(selectedZone))
    : confirmedOrders

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="text-indigo-600" size={22} />
          <h1 className="text-xl font-bold text-gray-900">Warehouse Floor Plan</h1>
          {selected && (
            <span className="text-sm text-gray-500">{selected.name}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { refreshZones() }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw size={14} className={zonesLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleFormBatches}
            disabled={forming || confirmedOrders.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {forming ? 'Forming…' : 'Form Batches'}
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {!selected ? (
        <div className="text-center py-16 text-gray-400">Select a warehouse to view the floor plan.</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Floor plan */}
          <div className="xl:col-span-2 space-y-3">
            <WarehouseFloorPlan
              zones={zones}
              hoveredZone={hoveredZone}
              onZoneHover={setHoveredZone}
              onZoneClick={z => setSelectedZone(prev => prev === z ? null : z)}
            />
            <div className="flex flex-wrap gap-2">
              {(['PRODUCE', 'CHILLED', 'FROZEN', 'AMBIENT'] as ZoneType[]).map(z => (
                <button
                  key={z}
                  onClick={() => setSelectedZone(prev => prev === z ? null : z)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    selectedZone === z ? ZONE_COLORS[z] + ' ring-2 ring-offset-1' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${ZONE_DOT[z]}`} />
                  {z}
                </button>
              ))}
              {selectedZone && (
                <button
                  onClick={() => setSelectedZone(null)}
                  className="px-3 py-1 rounded-full text-xs text-gray-500 border border-gray-200 hover:bg-gray-50"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>

          {/* Orders sidebar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                {selectedZone ? `${selectedZone} Orders` : 'Confirmed Orders'}
              </h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {filteredOrders.length}
              </span>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
                No confirmed orders
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {filteredOrders.map(order => {
                  const zones = orderZoneMap.get(order.orderId) ?? []
                  return (
                    <div
                      key={order.orderId}
                      className="p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono text-gray-500">
                          #{order.orderId.slice(-8)}
                        </span>
                        <span className="text-xs text-gray-400">{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="text-sm font-medium text-gray-800 mb-2">{order.userName}</div>
                      <div className="flex flex-wrap gap-1">
                        {zones.length > 0 ? zones.map(z => (
                          <span key={z} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ZONE_COLORS[z]}`}>
                            {z}
                          </span>
                        )) : (
                          <span className="text-[10px] text-gray-400">Loading zones…</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function resolveZone(categoryName: string): ZoneType {
  const lower = categoryName.toLowerCase()
  if (['frozen', 'ice cream', 'freeze'].some(k => lower.includes(k))) return 'FROZEN'
  if (['dairy', 'milk', 'curd', 'yogurt', 'cheese', 'butter', 'eggs', 'chilled', 'cold'].some(k => lower.includes(k))) return 'CHILLED'
  if (['fruits', 'vegetables', 'produce', 'fresh'].some(k => lower.includes(k))) return 'PRODUCE'
  return 'AMBIENT'
}
