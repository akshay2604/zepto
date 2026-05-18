import { useOrderStream } from '../hooks/useOrderStream'
import { useAnalytics } from '../hooks/useAnalytics'
import { OrderCard } from '../components/OrderCard'
import { OrderStepper } from '../components/OrderStepper'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export function LiveFeedView() {
  const orders = useOrderStream()
  const { orderFunnel } = useAnalytics()

  const funnelData = Object.entries(orderFunnel.countByStatus).map(([status, count]) => ({
    status: status.replace(/_/g, ' '),
    count,
  }))

  const latestOrder = orders[0]

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left panel — order cards */}
        <div className="flex flex-col gap-4 lg:w-3/5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Live Orders</h2>
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 py-16 text-gray-400">
              <span className="text-4xl mb-2">📦</span>
              <p>Waiting for orders…</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto max-h-[70vh] pr-1">
              {orders.map((order) => (
                <OrderCard key={order.orderId} order={order} />
              ))}
            </div>
          )}

          {latestOrder && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-indigo-500">
                Latest Order Progress
              </p>
              <OrderStepper status={latestOrder.status} />
            </div>
          )}
        </div>

        {/* Right panel — funnel chart */}
        <div className="lg:w-2/5">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Order Funnel</h2>
            {funnelData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-gray-400">
                Loading analytics…
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={funnelData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    angle={-40}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    cursor={{ fill: '#eef2ff' }}
                  />
                  <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
