import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Warehouse, List, Package, Activity, Users, ChevronDown, MapPin, Check } from 'lucide-react'
import { clsx } from 'clsx'
import { useWarehouse } from '../context/WarehouseContext'

const NAV_LINKS = [
  { to: '/picker',    label: 'Picker Queue', Icon: List },
  { to: '/pickers',   label: 'Pickers',      Icon: Users },
  { to: '/inventory', label: 'Inventory',    Icon: Package },
  { to: '/movements', label: 'Movements',    Icon: Activity },
]

export function Navbar() {
  const { pathname } = useLocation()
  const { warehouses, selected, setSelected, loading } = useWarehouse()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  return (
    <nav className="sticky top-0 z-50 bg-amber-600 shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <div className="flex items-center gap-2 mr-4">
          <Warehouse className="h-6 w-6 text-white" />
          <span className="text-xl font-bold text-white tracking-tight">Zepto Warehouse</span>
        </div>

        {NAV_LINKS.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className={clsx(
              'flex items-center gap-1.5 text-sm font-medium transition-colors',
              pathname === to ? 'text-white' : 'text-amber-100 hover:text-white',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}

        {/* Warehouse switcher */}
        <div className="relative ml-auto" ref={dropdownRef}>
          <button
            onClick={() => setOpen((o) => !o)}
            disabled={loading}
            className="flex items-center gap-2.5 rounded-lg bg-amber-700/50 hover:bg-amber-700 px-3 py-1.5 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <span className="text-sm text-amber-100">Loading…</span>
            ) : selected ? (
              <>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white leading-tight">{selected.name}</p>
                  <p className="text-xs text-amber-200 leading-tight">
                    {[selected.city, selected.pincode].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className={clsx(
                  'h-2 w-2 rounded-full shrink-0',
                  selected.active ? 'bg-green-400' : 'bg-red-400',
                )} />
              </>
            ) : (
              <span className="text-sm text-amber-100">Select warehouse</span>
            )}
            <ChevronDown className={clsx(
              'h-4 w-4 text-amber-200 transition-transform duration-150 shrink-0',
              open && 'rotate-180',
            )} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl bg-white shadow-xl border border-gray-100 overflow-hidden">
              {/* Selected warehouse metadata card */}
              {selected && (
                <div className="bg-amber-50 border-b border-amber-100 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{selected.name}</p>
                      {selected.address && (
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{selected.address}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                        {(selected.city || selected.pincode) && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {[selected.city, selected.pincode].filter(Boolean).join(' · ')}
                          </span>
                        )}
                        {selected.lat != null && selected.lng != null && (
                          <span className="text-xs text-gray-400 font-mono tabular-nums">
                            {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={clsx(
                      'shrink-0 mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full',
                      selected.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700',
                    )}>
                      {selected.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              )}

              {/* Warehouse list */}
              <ul className="max-h-60 overflow-y-auto py-1">
                {warehouses.map((w) => (
                  <li key={w.id}>
                    <button
                      onClick={() => { setSelected(w); setOpen(false) }}
                      className={clsx(
                        'w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors',
                        w.id === selected?.id ? 'bg-amber-50' : 'hover:bg-gray-50',
                      )}
                    >
                      <span className={clsx(
                        'mt-0.5 h-2 w-2 rounded-full shrink-0',
                        w.active ? 'bg-green-400' : 'bg-red-400',
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={clsx(
                          'text-sm font-medium truncate',
                          w.id === selected?.id ? 'text-amber-700' : 'text-gray-800',
                        )}>
                          {w.name}
                        </p>
                        {(w.city || w.pincode) && (
                          <p className="text-xs text-gray-400 truncate">
                            {[w.city, w.pincode].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                      {w.id === selected?.id && (
                        <Check className="h-4 w-4 text-amber-600 shrink-0" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
