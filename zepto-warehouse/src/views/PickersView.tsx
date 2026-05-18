import { useEffect, useState } from 'react'
import { useWarehouse } from '../context/WarehouseContext'
import { Loader2, Plus, UserCheck, UserX } from 'lucide-react'
import type { Picker } from '../types'

interface AddForm {
  name: string
  phone: string
}

export function PickersView() {
  const { selected } = useWarehouse()
  const [pickers, setPickers] = useState<Picker[]>([])
  const [loading, setLoading] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<AddForm>({ name: '', phone: '' })
  const [addLoading, setAddLoading] = useState(false)
  const [showInactive, setShowInactive] = useState(false)

  useEffect(() => {
    if (!selected?.id) return
    setLoading(true)
    fetch(`/pickers?warehouseId=${selected.id}&includeInactive=true`)
      .then((r) => r.json())
      .then((data: Picker[]) => setPickers(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selected?.id])

  const visible = showInactive ? pickers : pickers.filter((p) => p.active)
  const activeCnt = pickers.filter((p) => p.active).length

  async function handleToggle(picker: Picker) {
    const path = picker.active ? 'deactivate' : 'activate'
    // optimistic update
    setPickers((prev) => prev.map((p) => p.id === picker.id ? { ...p, active: !p.active } : p))
    setTogglingId(picker.id)
    try {
      await fetch(`/pickers/${picker.id}/${path}`, { method: 'PATCH' })
    } catch {
      // revert on failure
      setPickers((prev) => prev.map((p) => p.id === picker.id ? { ...p, active: picker.active } : p))
    } finally {
      setTogglingId(null)
    }
  }

  async function handleAdd() {
    if (!selected?.id || !form.name.trim()) return
    setAddLoading(true)
    try {
      const res = await fetch('/pickers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warehouseId: selected.id, name: form.name.trim(), phone: form.phone.trim() || null }),
      })
      const created: Picker = await res.json()
      setPickers((prev) => [...prev, created])
      setForm({ name: '', phone: '' })
      setShowAdd(false)
    } finally {
      setAddLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pickers</h1>
          {selected && (
            <p className="text-sm text-gray-500 mt-0.5">{selected.name}</p>
          )}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Picker
        </button>
      </div>

      {/* KPI chips */}
      <div className="flex items-center gap-3 mb-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
          <UserCheck className="h-4 w-4" />
          {activeCnt} active
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-500">
          <UserX className="h-4 w-4" />
          {pickers.length - activeCnt} inactive
        </span>
        <label className="ml-auto flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Show inactive
        </label>
      </div>

      {/* Pickers table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : visible.length === 0 ? (
          <p className="py-12 text-center text-gray-400 text-sm">No pickers yet — add one above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Phone', 'Status', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((picker) => (
                <tr key={picker.id} className={picker.active ? 'hover:bg-blue-50 transition-colors' : 'opacity-50 hover:bg-gray-50 transition-colors'}>
                  <td className="px-5 py-3 font-medium text-gray-900">{picker.name}</td>
                  <td className="px-5 py-3 text-gray-500 font-mono text-xs">{picker.phone ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      picker.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {picker.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleToggle(picker)}
                      disabled={togglingId === picker.id}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-1 ml-auto ${
                        picker.active
                          ? 'text-red-600 bg-red-50 hover:bg-red-100'
                          : 'text-green-700 bg-green-50 hover:bg-green-100'
                      }`}
                    >
                      {togglingId === picker.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : picker.active ? <><UserX className="h-3 w-3" /> Deactivate</> : <><UserCheck className="h-3 w-3" /> Activate</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Picker Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-bold text-gray-900 mb-4">Add Picker</h2>
            <div className="flex flex-col gap-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91XXXXXXXXXX"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAdd(false); setForm({ name: '', phone: '' }) }}
                disabled={addLoading}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={addLoading || !form.name.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
