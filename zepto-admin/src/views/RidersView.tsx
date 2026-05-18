import { useEffect, useState } from 'react'
import { Pencil, X, Plus, Loader2, Bike } from 'lucide-react'
import { clsx } from 'clsx'
import type { Rider, Warehouse } from '../types'

interface RiderForm {
  name: string
  phone: string
  vehicleNumber: string
}

const EMPTY_FORM: RiderForm = { name: '', phone: '', vehicleNumber: '' }

function riderToForm(r: Rider): RiderForm {
  return { name: r.name, phone: r.phone ?? '', vehicleNumber: r.vehicleNumber ?? '' }
}

export function RidersView() {
  const [riders, setRiders] = useState<Rider[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [showInactive, setShowInactive] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Rider | null>(null)
  const [form, setForm] = useState<RiderForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [assigningId, setAssigningId] = useState<string | null>(null)

  async function fetchRiders() {
    setLoading(true)
    try {
      const res = await fetch(`/riders?includeInactive=${showInactive}`)
      setRiders(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch('/warehouses').then((r) => r.json()).then(setWarehouses)
  }, [])

  useEffect(() => { fetchRiders() }, [showInactive])

  function openAdd() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(r: Rider) {
    setEditing(r)
    setForm(riderToForm(r))
    setError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const body = {
        name: form.name,
        phone: form.phone || null,
        vehicleNumber: form.vehicleNumber || null,
      }
      const res = editing
        ? await fetch(`/riders/${editing.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/riders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      closeModal()
      await fetchRiders()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive(r: Rider) {
    const action = r.active ? 'deactivate' : 'activate'
    await fetch(`/riders/${r.id}/${action}`, { method: 'PATCH' })
    await fetchRiders()
  }

  async function handleAssignWarehouse(rider: Rider, warehouseId: string) {
    setAssigningId(rider.id)
    try {
      if (warehouseId === '') {
        await fetch(`/riders/${rider.id}/unassign-warehouse`, { method: 'POST' })
      } else {
        await fetch(`/riders/${rider.id}/assign-warehouse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ warehouseId }),
        })
      }
      await fetchRiders()
    } finally {
      setAssigningId(null)
    }
  }

  const activeWarehouses = warehouses.filter((w) => w.active)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Riders</h1>
          <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
            />
            Show inactive
          </label>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Rider
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Rider', 'Phone', 'Vehicle', 'Dark Store', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {riders.map((r) => (
                <tr key={r.id} className={clsx('hover:bg-violet-50', !r.active && 'opacity-50')}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <Bike className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="font-medium text-gray-800">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {r.phone ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {r.vehicleNumber ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      {assigningId === r.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                      ) : (
                        <select
                          value={r.warehouseId ?? ''}
                          onChange={(e) => handleAssignWarehouse(r, e.target.value)}
                          disabled={!r.active}
                          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300 disabled:cursor-not-allowed disabled:opacity-60 max-w-[180px]"
                        >
                          <option value="">— Unassigned —</option>
                          {activeWarehouses.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {r.active ? (
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">ACTIVE</span>
                    ) : (
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">INACTIVE</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(r)}
                        className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-violet-400 hover:text-violet-700 transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(r)}
                        className={clsx(
                          'flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                          r.active
                            ? 'border-red-200 text-red-500 hover:border-red-400 hover:text-red-700'
                            : 'border-green-200 text-green-600 hover:border-green-400 hover:text-green-700',
                        )}
                      >
                        <X className="h-3 w-3" />
                        {r.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {riders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    No riders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                {editing ? 'Edit Rider' : 'Add Rider'}
              </h2>
              <button onClick={closeModal} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Vehicle Number</label>
                <input
                  type="text"
                  value={form.vehicleNumber}
                  onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
                  placeholder="KA 01 AB 1234"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                />
              </div>

              {error && (
                <p className="text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={clsx(
                    'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors',
                    submitting ? 'bg-violet-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700',
                  )}
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editing ? 'Save Changes' : 'Create Rider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
