import { useInventoryStream } from '../hooks/useInventoryStream'
import { useWarehouse } from '../context/WarehouseContext'
import { MovementChip } from '../components/MovementChip'
import { MapPin, Clock } from 'lucide-react'

function relativeTime(timestamp: string) {
  const diffMs = Date.now() - new Date(timestamp).getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  if (diffSecs < 60) return `${diffSecs}s ago`
  const diffMins = Math.floor(diffSecs / 60)
  if (diffMins < 60) return `${diffMins}m ago`
  return `${Math.floor(diffMins / 60)}h ago`
}

export function MovementFeedView() {
  const { selected } = useWarehouse()
  const movements = useInventoryStream(selected?.id)

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Movement Feed</h1>
        <span className="flex items-center gap-1.5 text-sm text-green-600">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Live
        </span>
      </div>

      {movements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-gray-400">
          <span className="text-4xl mb-2">📦</span>
          <p>Waiting for inventory movements…</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Type', 'Item', 'Qty Delta', 'Warehouse', 'When'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movements.map((m, i) => (
                <tr key={`${m.variantId}-${m.timestamp}-${i}`} className="hover:bg-amber-50 transition-colors">
                  <td className="px-4 py-3"><MovementChip type={m.movementType} /></td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{m.displayName}</p>
                    <p className="text-xs text-gray-400 font-mono">{m.sku}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-bold text-base ${m.qtyDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {m.qtyDelta >= 0 ? '+' : ''}{m.qtyDelta}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-gray-500">
                      <MapPin className="h-3.5 w-3.5" />
                      {m.warehouseName}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-gray-400 text-xs">
                      <Clock className="h-3.5 w-3.5" />
                      {relativeTime(m.timestamp)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
