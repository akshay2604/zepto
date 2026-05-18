import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ShoppingBag, Warehouse, UserX } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { useCart } from '../context/CartContext'
import type { User } from '../types'

export function CustomerSwitcherView() {
  const [customers, setCustomers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { user: activeUser, setUser } = useUser()
  const { clear } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/users')
      .then(r => r.json())
      .then((data: User[]) => setCustomers(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function shopAs(customer: User) {
    if (activeUser?.id !== customer.id) clear()
    setUser(customer)
    navigate('/shop')
  }

  const filtered = search.trim()
    ? customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search) ||
        (c.email ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : customers

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="mt-1 text-sm text-gray-500">Select a customer to shop as them.</p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone, or email…"
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Customer', 'Phone', 'Warehouse', ''].map((h) => (
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
              {filtered.map((c) => {
                const isActive = activeUser?.id === c.id
                return (
                  <tr
                    key={c.id}
                    className={isActive ? 'bg-indigo-50' : 'hover:bg-gray-50'}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{c.name}</p>
                          {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                        </div>
                        {isActive && (
                          <span className="ml-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            ACTIVE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.phone}</td>
                    <td className="px-4 py-3">
                      {c.warehouseName ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                          <Warehouse className="h-3 w-3" />
                          {c.warehouseName}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-300">
                          <UserX className="h-3 w-3" />
                          No warehouse
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => shopAs(c)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        Shop as
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                    {search ? 'No customers match your search' : 'No customers found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-400 text-center">
        Manage customers and warehouse assignments in{' '}
        <span className="font-medium text-gray-500">Zepto Admin → Customers</span>.
      </p>
    </div>
  )
}
