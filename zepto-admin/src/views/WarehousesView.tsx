import { useEffect, useState } from 'react'
import { Pencil, X, Plus, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import type { Warehouse } from '../types'

interface WarehouseForm {
  name: string
  address: string
  city: string
  pincode: string
  lat: string
  lng: string
}

const EMPTY_FORM: WarehouseForm = {
  name: '',
  address: '',
  city: '',
  pincode: '',
  lat: '',
  lng: '',
}

function warehouseToForm(w: Warehouse): WarehouseForm {
  return {
    name: w.name,
    address: w.address,
    city: w.city,
    pincode: w.pincode,
    lat: w.lat !== null ? String(w.lat) : '',
    lng: w.lng !== null ? String(w.lng) : '',
  }
}

export function WarehousesView() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [form, setForm] = useState<WarehouseForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function fetchWarehouses() {
    setLoading(true)
    try {
      const res = await fetch('/warehouses')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: Warehouse[] = await res.json()
      setWarehouses(data)
    } catch (e) {
      console.error('Failed to load warehouses', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWarehouses() }, [])

  function openAddModal() {
    setEditingWarehouse(null)
    setForm(EMPTY_FORM)
    setError(null)
    setModalOpen(true)
  }

  function openEditModal(w: Warehouse) {
    setEditingWarehouse(w)
    setForm(warehouseToForm(w))
    setError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingWarehouse(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (editingWarehouse) {
        // PATCH — only send non-empty fields
        const body: Record<string, unknown> = {}
        if (form.name)    body.name    = form.name
        if (form.address) body.address = form.address
        if (form.city)    body.city    = form.city
        if (form.pincode) body.pincode = form.pincode
        if (form.lat !== '') body.lat  = parseFloat(form.lat)
        if (form.lng !== '') body.lng  = parseFloat(form.lng)

        const res = await fetch(`/warehouses/${editingWarehouse.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      } else {
        const body: Record<string, unknown> = {
          name:    form.name,
          address: form.address,
          city:    form.city,
          pincode: form.pincode,
        }
        if (form.lat !== '') body.lat = parseFloat(form.lat)
        if (form.lng !== '') body.lng = parseFloat(form.lng)

        const res = await fetch('/warehouses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      }
      closeModal()
      await fetchWarehouses()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeactivate(w: Warehouse) {
    if (!window.confirm(`Deactivate warehouse "${w.name}"?`)) return
    setDeactivatingId(w.id)
    try {
      const res = await fetch(`/warehouses/${w.id}/deactivate`, { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await fetchWarehouses()
    } catch (e) {
      console.error('Failed to deactivate', e)
    } finally {
      setDeactivatingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Warehouse
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
                {['Name', 'City', 'Pincode', 'Lat / Lng', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {warehouses.map((w) => (
                <tr key={w.id} className="hover:bg-violet-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{w.name}</td>
                  <td className="px-4 py-3 text-gray-600">{w.city}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{w.pincode}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">
                    {w.lat !== null && w.lng !== null
                      ? `${w.lat}, ${w.lng}`
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {w.active ? (
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        INACTIVE
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(w)}
                        className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-violet-400 hover:text-violet-700 transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      {w.active && (
                        <button
                          onClick={() => handleDeactivate(w)}
                          disabled={deactivatingId === w.id}
                          className="flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-500 hover:border-red-400 hover:text-red-700 transition-colors disabled:opacity-50"
                        >
                          {deactivatingId === w.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {warehouses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    No warehouses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                {editingWarehouse ? 'Edit Warehouse' : 'Add Warehouse'}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  placeholder="e.g. South Delhi Hub"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none"
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    placeholder="e.g. Delhi"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    placeholder="110001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={form.lat}
                    onChange={(e) => setForm({ ...form, lat: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    placeholder="28.6139"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={form.lng}
                    onChange={(e) => setForm({ ...form, lng: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    placeholder="77.2090"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
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
                  {editingWarehouse ? 'Save Changes' : 'Create Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
