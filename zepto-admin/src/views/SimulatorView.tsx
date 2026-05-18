import { useAnalytics } from '../hooks/useAnalytics'
import { useSimulator } from '../hooks/useSimulator'
import { ShoppingCart, TrendingUp, RefreshCw, CreditCard, Loader2 } from 'lucide-react'

export function SimulatorView() {
  const { systemStatus } = useAnalytics()
  const { loading, triggerOrder, triggerAdvance, triggerRestock, triggerPayment } = useSimulator()

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">Simulator Control</h1>

      {/* Manual trigger buttons */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          {
            label: 'Place Test Order',
            description: 'Picks a real user + address + warehouse with available stock and places a new order.',
            Icon: ShoppingCart,
            color: 'bg-violet-600 hover:bg-violet-700',
            action: triggerOrder,
          },
          {
            label: 'Advance Order',
            description: 'Picks the oldest actionable order and moves it one status step forward.',
            Icon: TrendingUp,
            color: 'bg-blue-600 hover:bg-blue-700',
            action: triggerAdvance,
          },
          {
            label: 'Restock',
            description: 'Triggers an inventory restock movement (+100 units) for a random low-stock variant.',
            Icon: RefreshCw,
            color: 'bg-amber-600 hover:bg-amber-700',
            action: triggerRestock,
          },
          {
            label: 'Simulate Payment',
            description: 'Fires a SUCCESS webhook for the oldest PLACED order, advancing it to CONFIRMED.',
            Icon: CreditCard,
            color: 'bg-green-600 hover:bg-green-700',
            action: triggerPayment,
          },
        ].map(({ label, description, Icon, color, action }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <button
              onClick={action}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors ${color} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
              {label}
            </button>
            <p className="mt-3 text-xs text-gray-500 leading-relaxed">{description}</p>
          </div>
        ))}
      </div>

      {/* Live stats */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">Live Stats</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Orders', value: systemStatus.totalOrders },
            { label: 'Total Delivered', value: systemStatus.totalDelivered },
            { label: 'Total Movements', value: systemStatus.totalMovements },
            { label: 'Active Clients', value: systemStatus.activeEmitters },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-violet-50 p-4">
              <p className="text-xs text-violet-500">{label}</p>
              <p className="text-2xl font-bold text-violet-800 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
