import { useAnalytics } from '../hooks/useAnalytics'
import { KpiCard } from '../components/KpiCard'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

export function AnalyticsView() {
  const { inventoryStatus, topVariants, avgDelivery } = useAnalytics()

  const sortedInventory = [...inventoryStatus].sort((a, b) => {
    if (a.lowStock && !b.lowStock) return -1
    if (!a.lowStock && b.lowStock) return 1
    return 0
  })

  const variantData = topVariants.map((v) => ({
    name: v.displayName.slice(0, 20),
    sold: v.totalQtySold,
  }))

  const avgMins = (avgDelivery.avgDeliveryTimeSecs / 60).toFixed(1)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Analytics</h1>

      {/* Avg delivery KPI */}
      <div className="mb-8 grid grid-cols-2 gap-4 max-w-sm">
        <KpiCard label="Avg Delivery Time" value={`${avgMins} min`} accent="text-violet-600" />
        <KpiCard label="Total Delivered" value={avgDelivery.totalDelivered} accent="text-green-600" />
      </div>

      {/* Top variants chart */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Top Variants Leaderboard</h2>
        {variantData.length === 0 ? (
          <p className="py-10 text-center text-gray-400">Loading…</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(variantData.length * 32, 200)}>
            <BarChart data={variantData} layout="vertical" margin={{ top: 5, right: 20, left: 130, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} width={130} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="sold" fill="#7c3aed" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Full inventory table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Full Inventory Status</h2>
          <p className="text-xs text-gray-400 mt-0.5">Low stock rows shown first</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['SKU', 'Display Name', 'On Hand', 'Reserved', 'Available', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedInventory.map((item) => (
              <tr key={item.variantId} className={item.lowStock ? 'bg-red-50' : 'hover:bg-violet-50'}>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{item.sku}</td>
                <td className="px-4 py-2.5 font-medium text-gray-800">{item.displayName}</td>
                <td className="px-4 py-2.5 text-gray-700">{item.qtyOnHand}</td>
                <td className="px-4 py-2.5 text-gray-600">{item.qtyReserved}</td>
                <td className="px-4 py-2.5 font-semibold text-gray-900">{item.qtyAvailable}</td>
                <td className="px-4 py-2.5">
                  {item.lowStock ? (
                    <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">LOW STOCK</span>
                  ) : (
                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">OK</span>
                  )}
                </td>
              </tr>
            ))}
            {sortedInventory.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">Loading…</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
