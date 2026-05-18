import { useEffect, useState } from 'react'
import { useWarehouse } from '../context/WarehouseContext'
import { Loader2, Plus, UserCheck, UserX, Pencil, Check, X } from 'lucide-react'
import type { Picker, ZoneType } from '../types'

const ALL_ZONES: ZoneType[] = ['PRODUCE', 'CHILLED', 'FROZEN', 'AMBIENT']

const ZONE_STYLE: Record<ZoneType, string> = {
  PRODUCE: 'bg-green-100 text-green-700 border-green-200',
  CHILLED: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  FROZEN:  'bg-indigo-100 text-indigo-700 border-indigo-200',
  AMBIENT: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

const ZONE_ICON: Record<ZoneType, string> = {
  PRODUCE: '🌿',
  CHILLED: '❄️',
  FROZEN:  '🧊',
  AMBIENT: '📦',
}

function ZoneChip({ zone, selected, onClick }: { zone: ZoneType; selected: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
        selected
          ? ZONE_STYLE[zone] + ' ring-1 ring-offset-1 ring-current'
          : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300'
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span>{ZONE_ICON[zone]}</span>
      {zone}
    </button>
  )
}

interface AddForm { name: string; phone: string }

export function PickersView() {
  const { selected } = useWarehouse()
  const [pickers, setPickers] = useState<Picker[]>([])
  const [loading, setLoading] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  // Add picker — 2-step modal
  const [addStep, setAddStep] = useState<0 | 1 | 2>(0) // 0=closed, 1=details, 2=zones
  const [form, setForm] = useState<AddForm>({ name: '', phone: '' })
  const [newPicker, setNewPicker] = useState<Picker | null>(null)
  const [selectedZones, setSelectedZones] = useState<Set<ZoneType>>(new Set())
  const [addLoading, setAddLoading] = useState(false)

  // Zone edit for existing pickers
  const [editingZoneFor, setEditingZoneFor] = useState<string | null>(null)
  const [editZones, setEditZones] = useState<Set<ZoneType>>(new Set())
  const [zoneEditLoading, setZoneEditLoading] = useState(false)

  useEffect(() => {
    if (!selected?.id) return
    setLoading(true)
    fetch(`/pickers?warehouseId=${selected.id}&includeInactive=true`)
      .then(r => r.json())
      .then((data: Picker[]) => setPickers(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selected?.id])

  const visible = showInactive ? pickers : pickers.filter(p => p.active)
  const activeCnt = pickers.filter(p => p.active).length

  async function handleToggle(picker: Picker) {
    const path = picker.active ? 'deactivate' : 'activate'
    setPickers(prev => prev.map(p => p.id === picker.id ? { ...p, active: !p.active } : p))
    setTogglingId(picker.id)
    try {
      const res = await fetch(`/pickers/${picker.id}/${path}`, { method: 'PATCH' })
      if (res.ok) {
        const updated: Picker = await res.json()
        setPickers(prev => prev.map(p => p.id === picker.id ? updated : p))
      }
    } catch {
      setPickers(prev => prev.map(p => p.id === picker.id ? { ...p, active: picker.active } : p))
    } finally {
      setTogglingId(null)
    }
  }

  // Step 1 — create picker
  async function handleCreatePicker() {
    if (!selected?.id || !form.name.trim()) return
    setAddLoading(true)
    try {
      const res = await fetch('/pickers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warehouseId: selected.id, name: form.name.trim(), phone: form.phone.trim() || null }),
      })
      if (!res.ok) return
      const created: Picker = await res.json()
      setNewPicker(created)
      setSelectedZones(new Set())
      setAddStep(2)
    } finally {
      setAddLoading(false)
    }
  }

  // Step 2 — assign zones
  async function handleAssignZones() {
    if (!newPicker) return
    setAddLoading(true)
    try {
      let finalPicker = newPicker
      if (selectedZones.size > 0) {
        const res = await fetch(`/pickers/${newPicker.id}/zones`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zones: [...selectedZones] }),
        })
        if (res.ok) finalPicker = await res.json()
      }
      setPickers(prev => [...prev, finalPicker])
      closeAddModal()
    } finally {
      setAddLoading(false)
    }
  }

  function closeAddModal() {
    setAddStep(0)
    setForm({ name: '', phone: '' })
    setNewPicker(null)
    setSelectedZones(new Set())
  }

  function toggleZone(zone: ZoneType, set: Set<ZoneType>, setter: (s: Set<ZoneType>) => void) {
    const next = new Set(set)
    next.has(zone) ? next.delete(zone) : next.add(zone)
    setter(next)
  }

  // Zone edit for existing picker
  function startEditZones(picker: Picker) {
    setEditingZoneFor(picker.id)
    setEditZones(new Set(picker.zones))
  }

  async function saveZoneEdit(picker: Picker) {
    setZoneEditLoading(true)
    try {
      const res = await fetch(`/pickers/${picker.id}/zones`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zones: [...editZones] }),
      })
      if (res.ok) {
        const updated: Picker = await res.json()
        setPickers(prev => prev.map(p => p.id === picker.id ? updated : p))
      }
    } finally {
      setZoneEditLoading(false)
      setEditingZoneFor(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pickers</h1>
          {selected && <p className="text-sm text-gray-500 mt-0.5">{selected.name}</p>}
        </div>
        <button
          onClick={() => setAddStep(1)}
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
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded" />
          Show inactive
        </label>
      </div>

      {/* Pickers list */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : visible.length === 0 ? (
          <p className="py-12 text-center text-gray-400 text-sm">No pickers yet — add one above.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {visible.map(picker => {
              const isEditingZones = editingZoneFor === picker.id
              return (
                <div
                  key={picker.id}
                  className={`px-5 py-4 transition-colors ${picker.active ? 'hover:bg-blue-50/40' : 'opacity-60'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{picker.name}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${picker.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {picker.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {picker.phone && (
                        <p className="text-xs text-gray-400 font-mono mb-2">{picker.phone}</p>
                      )}

                      {/* Zone row */}
                      {isEditingZones ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1.5">
                            {ALL_ZONES.map(z => (
                              <ZoneChip
                                key={z}
                                zone={z}
                                selected={editZones.has(z)}
                                onClick={() => toggleZone(z, editZones, setEditZones)}
                              />
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveZoneEdit(picker)}
                              disabled={zoneEditLoading}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                              {zoneEditLoading ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                              Save zones
                            </button>
                            <button
                              onClick={() => setEditingZoneFor(null)}
                              className="flex items-center gap-1 px-3 py-1 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50"
                            >
                              <X size={11} /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {picker.zones.length > 0
                            ? picker.zones.map(z => <ZoneChip key={z} zone={z} selected />)
                            : <span className="text-xs text-gray-400 italic">No zones assigned</span>
                          }
                          <button
                            onClick={() => startEditZones(picker)}
                            className="ml-1 p-1 text-gray-300 hover:text-gray-500 rounded transition-colors"
                            title="Edit zones"
                          >
                            <Pencil size={12} />
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleToggle(picker)}
                      disabled={togglingId === picker.id || isEditingZones}
                      className={`flex-shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-50 ${
                        picker.active
                          ? 'text-red-600 bg-red-50 hover:bg-red-100'
                          : 'text-green-700 bg-green-50 hover:bg-green-100'
                      }`}
                    >
                      {togglingId === picker.id
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : picker.active
                          ? <><UserX className="h-3 w-3" /> Deactivate</>
                          : <><UserCheck className="h-3 w-3" /> Activate</>
                      }
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Add Picker Modal — Step 1: Details ── */}
      {addStep === 1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
              <h2 className="text-base font-bold text-gray-900">Picker Details</h2>
            </div>
            <p className="text-xs text-gray-400 mb-4 ml-8">You'll assign zones in the next step.</p>
            <div className="flex flex-col gap-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && form.name.trim() && handleCreatePicker()}
                  placeholder="Full name"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91XXXXXXXXXX"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={closeAddModal}
                disabled={addLoading}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePicker}
                disabled={addLoading || !form.name.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Next →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Picker Modal — Step 2: Zone Assignment ── */}
      {addStep === 2 && newPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
              <h2 className="text-base font-bold text-gray-900">Assign Zones</h2>
            </div>
            <p className="text-xs text-gray-400 mb-1 ml-8">
              Which zones is <span className="font-semibold text-gray-600">{newPicker.name}</span> certified for?
            </p>
            <p className="text-xs text-gray-300 mb-5 ml-8">You can change this later from the pickers list.</p>

            <div className="space-y-2 mb-6">
              {ALL_ZONES.map(zone => {
                const isSelected = selectedZones.has(zone)
                return (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => toggleZone(zone, selectedZones, setSelectedZones)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? ZONE_STYLE[zone].replace('text-', 'border-').replace('bg-', 'bg-') + ' border-current shadow-sm'
                        : 'border-gray-100 hover:border-gray-200 bg-gray-50'
                    }`}
                  >
                    <span className="text-xl">{ZONE_ICON[zone]}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${isSelected ? '' : 'text-gray-500'}`}>{zone}</p>
                      <p className="text-[10px] text-gray-400">{ZONE_DESC[zone]}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-current border-current' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleAssignZones()}
                disabled={addLoading}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Skip
              </button>
              <button
                onClick={() => handleAssignZones()}
                disabled={addLoading || selectedZones.size === 0}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Assign ${selectedZones.size > 0 ? selectedZones.size : ''} Zone${selectedZones.size !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const ZONE_DESC: Record<ZoneType, string> = {
  PRODUCE:  'Fresh fruits, vegetables, greens',
  CHILLED:  'Dairy, eggs, butter, cold drinks',
  FROZEN:   'Ice cream, frozen foods (PPE required)',
  AMBIENT:  'Packaged goods, dry grocery, beverages',
}
