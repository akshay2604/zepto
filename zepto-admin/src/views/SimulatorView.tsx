import { useEffect, useState } from 'react'
import { useAnalytics } from '../hooks/useAnalytics'
import { useSimulator } from '../hooks/useSimulator'
import { useDarkStore, type OnboardResult, type PurgeResult } from '../hooks/useDarkStore'
import {
  ShoppingCart, TrendingUp, RefreshCw, CreditCard, Loader2,
  Store, Trash2, ChevronDown, X, CheckCircle2, AlertTriangle,
} from 'lucide-react'

// ── Preset Bengaluru dark store locations ─────────────────────────────────────
const PRESETS = [
  { label: 'Koramangala',  name: 'Zepto Dark Store — Koramangala',  address: 'No. 12, 5th Block, Koramangala',          city: 'Bengaluru', pincode: '560034', lat: 12.9279, lng: 77.6271 },
  { label: 'Indiranagar',  name: 'Zepto Dark Store — Indiranagar',  address: 'No. 47, 12th Main Road, Indiranagar',     city: 'Bengaluru', pincode: '560038', lat: 12.9786, lng: 77.6408 },
  { label: 'HSR Layout',   name: 'Zepto Dark Store — HSR Layout',   address: 'No. 8, 27th Main, Sector 2, HSR Layout',  city: 'Bengaluru', pincode: '560102', lat: 12.9122, lng: 77.6443 },
  { label: 'Whitefield',   name: 'Zepto Dark Store — Whitefield',   address: 'No. 3, ITPL Main Road, Whitefield',       city: 'Bengaluru', pincode: '560066', lat: 12.9696, lng: 77.7501 },
  { label: 'Marathahalli', name: 'Zepto Dark Store — Marathahalli', address: 'No. 22, Outer Ring Road, Marathahalli',   city: 'Bengaluru', pincode: '560037', lat: 12.9591, lng: 77.6974 },
  { label: 'Electronic City', name: 'Zepto Dark Store — Electronic City', address: 'No. 7, Phase 1, Electronic City', city: 'Bengaluru', pincode: '560100', lat: 12.8399, lng: 77.6770 },
  { label: 'Jayanagar',    name: 'Zepto Dark Store — Jayanagar',    address: 'No. 33, 4th Block, Jayanagar',            city: 'Bengaluru', pincode: '560041', lat: 12.9250, lng: 77.5938 },
  { label: 'Malleshwaram', name: 'Zepto Dark Store — Malleshwaram', address: '11th Cross, Malleshwaram',                city: 'Bengaluru', pincode: '560003', lat: 13.0031, lng: 77.5653 },
  { label: 'Custom',       name: '', address: '', city: 'Bengaluru', pincode: '', lat: 12.9716, lng: 77.5946 },
]

interface Warehouse { id: string; name: string; active: boolean }

// ── Onboard modal ─────────────────────────────────────────────────────────────
function OnboardModal({ onClose, onDone }: { onClose: () => void; onDone: (r: OnboardResult) => void }) {
  const { onboarding, onboard } = useDarkStore()
  const [preset, setPreset] = useState(0)
  const [form, setForm] = useState({ ...PRESETS[0], riderCount: 5, pickerCount: 3, customerCount: 10 })
  const [error, setError] = useState('')

  function applyPreset(idx: number) {
    const p = PRESETS[idx]
    setPreset(idx)
    setForm(f => ({ ...f, ...p }))
  }

  async function submit() {
    setError('')
    try {
      const result = await onboard({
        name: form.name,
        address: form.address,
        city: form.city,
        pincode: form.pincode,
        lat: form.lat,
        lng: form.lng,
        riderCount: form.riderCount,
        pickerCount: form.pickerCount,
        customerCount: form.customerCount,
      })
      onDone(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Onboard Dark Store</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {/* Preset selector */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">Location preset</label>
            <div className="relative">
              <select
                value={preset}
                onChange={e => applyPreset(Number(e.target.value))}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {PRESETS.map((p, i) => (
                  <option key={i} value={i}>{p.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Store name */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">Store name</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="Zepto Dark Store — Location"
            />
          </div>

          {/* Address */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">Address</label>
            <input
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* City / Pincode / Lat / Lng */}
          <div className="grid grid-cols-2 gap-3">
            {([
              ['city', 'City'],
              ['pincode', 'Pincode'],
              ['lat', 'Latitude'],
              ['lng', 'Longitude'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">{label}</label>
                <input
                  value={String(form[key as keyof typeof form])}
                  onChange={e => setForm(f => ({ ...f, [key]: key === 'lat' || key === 'lng' ? Number(e.target.value) : e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            ))}
          </div>

          {/* Counts */}
          <div className="rounded-xl bg-violet-50 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-violet-600">Simulation defaults</p>
            <div className="grid grid-cols-3 gap-4">
              {([
                ['pickerCount', 'Pickers', 1, 10],
                ['riderCount', 'Riders', 1, 20],
                ['customerCount', 'Customers', 1, 50],
              ] as const).map(([key, label, min, max]) => (
                <div key={key} className="text-center">
                  <label className="mb-1 block text-xs text-violet-700">{label}</label>
                  <input
                    type="number"
                    min={min}
                    max={max}
                    value={form[key as keyof typeof form] as number}
                    onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={onboarding || !form.name || !form.address || !form.pincode}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {onboarding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
            {onboarding ? 'Onboarding…' : 'Onboard Store'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Purge modal ───────────────────────────────────────────────────────────────
function PurgeModal({ onClose, onDone }: { onClose: () => void; onDone: (r: PurgeResult) => void }) {
  const { purging, purge } = useDarkStore()
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selected, setSelected] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/warehouses')
      .then(r => r.json())
      .then((data: Warehouse[]) => {
        setWarehouses(data.filter(w => w.active))
      })
      .catch(() => {})
  }, [])

  async function submit() {
    if (!selected || !confirmed) return
    setError('')
    try {
      const result = await purge(selected)
      onDone(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    }
  }

  const selectedWarehouse = warehouses.find(w => w.id === selected)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Purge Dark Store</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700">
            <strong>Destructive operation.</strong> This permanently deletes all orders, batches, inventory,
            pickers, riders and zones for the selected store. Customers are unassigned but not deleted.
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">Select store to purge</label>
            <div className="relative">
              <select
                value={selected}
                onChange={e => { setSelected(e.target.value); setConfirmed(false) }}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">— choose a dark store —</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {selected && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-red-600"
              />
              <span className="text-xs text-red-700">
                I understand that <strong>{selectedWarehouse?.name}</strong> and all associated data will be
                permanently deleted and cannot be recovered.
              </span>
            </label>
          )}

          {error && <p className="rounded-lg bg-red-100 px-3 py-2 text-xs text-red-700">{error}</p>}
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={purging || !selected || !confirmed}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {purging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            {purging ? 'Purging…' : 'Purge Store'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Onboard result card ───────────────────────────────────────────────────────
function OnboardResultCard({ result, onDismiss }: { result: OnboardResult; onDismiss: () => void }) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <p className="text-sm font-semibold text-green-800">Dark store onboarded</p>
        </div>
        <button onClick={onDismiss} className="text-green-400 hover:text-green-600"><X className="h-4 w-4" /></button>
      </div>
      <p className="mb-3 text-xs font-medium text-green-700">{result.warehouse.name}</p>
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Pickers', value: result.pickers.length },
          { label: 'Riders', value: result.riders.length },
          { label: 'Customers', value: result.customers.length },
          { label: 'SKUs seeded', value: result.inventoryVariantsSeeded },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-white px-3 py-2 text-center shadow-sm">
            <p className="text-lg font-bold text-green-700">{value}</p>
            <p className="text-xs text-green-600">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Purge result card ─────────────────────────────────────────────────────────
function PurgeResultCard({ result, onDismiss }: { result: PurgeResult; onDismiss: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <p className="text-sm font-semibold text-red-800">Dark store purged</p>
        </div>
        <button onClick={onDismiss} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
      </div>
      <p className="mb-3 text-xs font-medium text-red-700">{result.warehouseName}</p>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Orders', value: result.ordersDeleted },
          { label: 'Batches', value: result.batchesDeleted },
          { label: 'Inventory rows', value: result.inventoryLedgersDeleted },
          { label: 'Pickers', value: result.pickersDeleted },
          { label: 'Riders', value: result.ridersDeleted },
          { label: 'Customers unassigned', value: result.customersUnassigned },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-white px-3 py-2 text-center shadow-sm">
            <p className="text-lg font-bold text-red-600">{value}</p>
            <p className="text-xs text-red-500">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────
export function SimulatorView() {
  const { systemStatus } = useAnalytics()
  const { loading, triggerOrder, triggerAdvance, triggerRestock, triggerPayment } = useSimulator()

  const [showOnboard, setShowOnboard] = useState(false)
  const [showPurge, setShowPurge] = useState(false)
  const [onboardResult, setOnboardResult] = useState<OnboardResult | null>(null)
  const [purgeResult, setPurgeResult] = useState<PurgeResult | null>(null)

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

      {/* Dark Store Management */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-gray-900">Dark Store Management</h2>
        <p className="mb-5 text-xs text-gray-500">
          Onboard a new dark store with seeded pickers, riders, customers and inventory — or hard-purge an existing one.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-violet-100 bg-violet-50 p-5">
            <button
              onClick={() => { setOnboardResult(null); setShowOnboard(true) }}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 transition-colors"
            >
              <Store className="h-4 w-4" />
              Onboard Dark Store
            </button>
            <p className="mt-3 text-xs text-violet-700 leading-relaxed">
              Creates a new warehouse with zones, pickers (auto-assigned to zones), riders, customers with addresses,
              and full inventory from the master catalog.
            </p>
          </div>

          <div className="rounded-xl border border-red-100 bg-red-50 p-5">
            <button
              onClick={() => { setPurgeResult(null); setShowPurge(true) }}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Purge Dark Store
            </button>
            <p className="mt-3 text-xs text-red-700 leading-relaxed">
              Hard-deletes a dark store and all associated data: orders, batches, inventory, pickers, riders, zones.
              Customers are unassigned (not deleted).
            </p>
          </div>
        </div>

        {onboardResult && (
          <div className="mt-4">
            <OnboardResultCard result={onboardResult} onDismiss={() => setOnboardResult(null)} />
          </div>
        )}
        {purgeResult && (
          <div className="mt-4">
            <PurgeResultCard result={purgeResult} onDismiss={() => setPurgeResult(null)} />
          </div>
        )}
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

      {showOnboard && (
        <OnboardModal
          onClose={() => setShowOnboard(false)}
          onDone={result => { setShowOnboard(false); setOnboardResult(result) }}
        />
      )}

      {showPurge && (
        <PurgeModal
          onClose={() => setShowPurge(false)}
          onDone={result => { setShowPurge(false); setPurgeResult(result) }}
        />
      )}
    </div>
  )
}
