import { useEffect, useState } from 'react'
import { Pencil, X, Plus, Loader2, UserX, Warehouse } from 'lucide-react'
import { clsx } from 'clsx'
import type { User, Warehouse as WarehouseType } from '../types'

interface UserForm {
  name: string
  phone: string
  email: string
  line1: string
  pincode: string
  city: string
}

interface AssignForm {
  warehouseId: string
}

const EMPTY_FORM: UserForm = { name: '', phone: '', email: '', line1: '', pincode: '', city: 'Bengaluru' }

function userToForm(u: User): UserForm {
  return { name: u.name, phone: u.phone, email: u.email ?? '', line1: '', pincode: '', city: 'Bengaluru' }
}

export function CustomersView() {
  const [users, setUsers] = useState<User[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([])
  const [loading, setLoading] = useState(true)

  // user create/edit modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form, setForm] = useState<UserForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // warehouse assignment modal
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [assigningUser, setAssigningUser] = useState<User | null>(null)
  const [assignForm, setAssignForm] = useState<AssignForm>({ warehouseId: '' })
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  const [deactivatingId, setDeactivatingId] = useState<string | null>(null)

  async function fetchAll() {
    setLoading(true)
    try {
      const [usersRes, warehousesRes] = await Promise.all([
        fetch('/users'),
        fetch('/warehouses'),
      ])
      if (!usersRes.ok || !warehousesRes.ok) throw new Error('Fetch failed')
      const [usersData, warehousesData] = await Promise.all([
        usersRes.json() as Promise<User[]>,
        warehousesRes.json() as Promise<WarehouseType[]>,
      ])
      setUsers(usersData)
      setWarehouses(warehousesData.filter((w) => w.active))
    } catch (e) {
      console.error('Failed to load data', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  // ── User modal ─────────────────────────────────────────────────────────────

  function openAddModal() {
    setEditingUser(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setModalOpen(true)
  }

  function openEditModal(u: User) {
    setEditingUser(u)
    setForm(userToForm(u))
    setFormError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingUser(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    try {
      if (editingUser) {
        const body: Record<string, unknown> = {}
        if (form.name)  body.name  = form.name
        if (form.email) body.email = form.email
        const res = await fetch(`/users/${editingUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      } else {
        const body: Record<string, unknown> = { name: form.name, phone: form.phone }
        if (form.email) body.email = form.email
        const res = await fetch('/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `HTTP ${res.status}`)
        }
        const newUser = await res.json() as { id: string }
        if (form.line1.trim()) {
          try {
            await fetch(`/users/${newUser.id}/addresses`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ label: 'Home', line1: form.line1, pincode: form.pincode, city: form.city, isDefault: true }),
            })
          } catch (addrErr) {
            console.error('Failed to save address (non-fatal)', addrErr)
          }
        }
      }
      closeModal()
      await fetchAll()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeactivate(u: User) {
    if (!window.confirm(`Deactivate "${u.name}"? They won't be able to place orders.`)) return
    setDeactivatingId(u.id)
    try {
      const res = await fetch(`/users/${u.id}/deactivate`, { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await fetchAll()
    } catch (e) {
      console.error('Failed to deactivate', e)
    } finally {
      setDeactivatingId(null)
    }
  }

  // ── Assign warehouse modal ─────────────────────────────────────────────────

  function openAssignModal(u: User) {
    setAssigningUser(u)
    setAssignForm({ warehouseId: u.warehouseId ?? '' })
    setAssignError(null)
    setAssignModalOpen(true)
  }

  function closeAssignModal() {
    setAssignModalOpen(false)
    setAssigningUser(null)
    setAssignForm({ warehouseId: '' })
    setAssignError(null)
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault()
    if (!assigningUser) return
    setAssigning(true)
    setAssignError(null)
    try {
      if (assignForm.warehouseId === '') {
        // unassign
        const res = await fetch(`/users/${assigningUser.id}/warehouse`, { method: 'DELETE' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      } else {
        const res = await fetch(`/users/${assigningUser.id}/warehouse`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ warehouseId: assignForm.warehouseId }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      }
      closeAssignModal()
      await fetchAll()
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setAssigning(false)
    }
  }

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Customer
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
                {['Name', 'Phone', 'Email', 'Warehouse', 'Status', 'Actions'].map((h) => (
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
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-violet-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{u.phone}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.email ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3">
                    {u.warehouseName ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                        <Warehouse className="h-3 w-3" />
                        {u.warehouseName}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.active ? (
                      <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">ACTIVE</span>
                    ) : (
                      <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">INACTIVE</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-violet-400 hover:text-violet-700 transition-colors"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => openAssignModal(u)}
                        className="flex items-center gap-1 rounded-md border border-violet-200 px-2.5 py-1 text-xs font-medium text-violet-600 hover:border-violet-400 hover:text-violet-700 transition-colors"
                      >
                        <Warehouse className="h-3 w-3" />
                        Assign
                      </button>
                      {u.active && (
                        <button
                          onClick={() => handleDeactivate(u)}
                          disabled={deactivatingId === u.id}
                          className="flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-500 hover:border-red-400 hover:text-red-700 transition-colors disabled:opacity-50"
                        >
                          {deactivatingId === u.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <UserX className="h-3 w-3" />
                          )}
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* User create / edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">
                {editingUser ? 'Edit Customer' : 'Add Customer'}
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
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Phone <span className="text-red-500">*</span>
                  {editingUser && <span className="ml-1 text-gray-400">(cannot be changed)</span>}
                </label>
                <input
                  required={!editingUser}
                  disabled={!!editingUser}
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={clsx(
                    'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500',
                    editingUser && 'bg-gray-50 text-gray-400 cursor-not-allowed',
                  )}
                  placeholder="+91XXXXXXXXXX"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  placeholder="rahul@example.com"
                />
              </div>

              {!editingUser && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      Delivery Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={form.line1}
                      onChange={(e) => setForm({ ...form, line1: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                      placeholder="12, 5th Cross, Koramangala"
                    />
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-gray-700">Pincode</label>
                      <input
                        type="text"
                        value={form.pincode}
                        onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                        placeholder="560034"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-gray-700">City</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                        placeholder="Bengaluru"
                      />
                    </div>
                  </div>
                </>
              )}

              {formError && (
                <p className="text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {formError}
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
                  {editingUser ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warehouse assignment modal */}
      {assignModalOpen && assigningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900">Assign Warehouse</h2>
              <button
                onClick={closeAssignModal}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAssign} className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-500">
                Assigning a warehouse to <span className="font-semibold text-gray-800">{assigningUser.name}</span> routes their orders to that dark store.
              </p>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Warehouse</label>
                <select
                  value={assignForm.warehouseId}
                  onChange={(e) => setAssignForm({ warehouseId: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 bg-white"
                >
                  <option value="">— Unassigned —</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} · {w.city}
                    </option>
                  ))}
                </select>
              </div>

              {assignError && (
                <p className="text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {assignError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeAssignModal}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className={clsx(
                    'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors',
                    assigning ? 'bg-violet-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700',
                  )}
                >
                  {assigning && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
