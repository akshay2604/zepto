import { useAnalytics } from '../hooks/useAnalytics'
import { KpiCard } from '../components/KpiCard'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

export function DashboardView() {
  const { orderFunnel, avgDelivery, topVariants, movementAudit, systemStatus } = useAnalytics()

  const funnelData = Object.entries(orderFunnel.countByStatus).map(([status, count]) => ({
    status: status.replace(/_/g, ' '),
    count,
  }))

  const topFiveVariants = topVariants.slice(0, 5).map((v) => ({
    name: v.displayName.slice(0, 20),
    sold: v.totalQtySold,
  }))

  const avgMins = (avgDelivery.avgDeliveryTimeSecs / 60).toFixed(1)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* KPI cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Total Orders" value={systemStatus.totalOrders} accent="text-violet-600" />
        <KpiCard label="Delivered" value={systemStatus.totalDelivered} accent="text-green-600" />
        <KpiCard
          label="Avg Delivery Time"
          value={`${avgMins} min`}
          sub={`${avgDelivery.totalDelivered} delivered`}
          accent="text-blue-600"
        />
        <KpiCard label="Active SSE Clients" value={systemStatus.activeEmitters} accent="text-orange-600" />
      </div>

      {/* Charts */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Order Funnel</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={funnelData} margin={{ top: 5, right: 10, left: 0, bottom: 55 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="status" tick={{ fontSize: 10, fill: '#6b7280' }} angle={-40} textAnchor="end" />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Top 5 Variants</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topFiveVariants} layout="vertical" margin={{ top: 5, right: 20, left: 110, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} width={110} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="sold" fill="#a78bfa" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Movement audit */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Movement Audit (last 20)</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Item', 'SKU', 'Type', 'Qty Delta', 'Created At'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {movementAudit.slice(0, 20).map((m) => (
              <tr key={m.id} className="hover:bg-violet-50">
                <td className="px-4 py-2.5 font-medium text-gray-800">{m.variantName}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{m.sku}</td>
                <td className="px-4 py-2.5">
                  <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
                    {m.movementType.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className={`px-4 py-2.5 font-bold ${m.qtyDelta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {m.qtyDelta >= 0 ? '+' : ''}{m.qtyDelta}
                </td>
                <td className="px-4 py-2.5 text-gray-400 text-xs">{new Date(m.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {movementAudit.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">No data yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
