import { useState } from 'react'
import { Bike, Plus, ChevronRight, Phone, Truck } from 'lucide-react'
import { clsx } from 'clsx'
import { useRiders } from '../hooks/useRiders'
import { useRider } from '../context/RiderContext'
import type { Rider } from '../types'

type Tab = 'select' | 'create'

export function RiderOnboardingView() {
  const { setRider } = useRider()
  const { riders, loading, createRider } = useRiders()
  const [tab, setTab] = useState<Tab>('select')

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [vehicleNumber, setVehicleNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const rider = await createRider({
        name: name.trim(),
        phone: phone.trim() || undefined,
        vehicleNumber: vehicleNumber.trim() || undefined,
      })
      setRider(rider)
    } catch {
      setError('Failed to create rider. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <Bike className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Zepto Rider</h1>
        <p className="mt-1 text-sm text-gray-500">Select your profile or create a new one to get started</p>
      </div>

      <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
        {(['select', 'create'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'flex-1 rounded-lg py-2 text-sm font-medium transition-all',
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {t === 'select' ? 'Select Profile' : 'New Rider'}
          </button>
        ))}
      </div>

      {tab === 'select' && (
        <div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : riders.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
              <p className="text-sm text-gray-500">No riders yet.</p>
              <button
                onClick={() => setTab('create')}
                className="mt-3 flex items-center gap-1 mx-auto text-sm font-medium text-emerald-600 hover:text-emerald-700"
              >
                <Plus className="h-4 w-4" />
                Create the first one
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {riders.map((r: Rider) => (
                <button
                  key={r.id}
                  onClick={() => setRider(r)}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm">
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-900">{r.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {r.phone && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="h-3 w-3" />
                          {r.phone}
                        </span>
                      )}
                      {r.warehouseName && (
                        <span className="text-xs text-emerald-600 font-medium truncate">
                          {r.warehouseName}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'create' && (
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
            <div className="relative">
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="KA 01 AB 1234"
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="mt-2 w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create & Start'}
          </button>
        </form>
      )}
    </div>
  )
}
