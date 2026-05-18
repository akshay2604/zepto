import { Link, useLocation } from 'react-router-dom'
import { Bike, Clock, LogOut } from 'lucide-react'
import { clsx } from 'clsx'
import { useRider } from '../context/RiderContext'

export function Navbar() {
  const { pathname } = useLocation()
  const { rider, clearRider } = useRider()

  return (
    <nav className="sticky top-0 z-50 bg-emerald-600 shadow-lg">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Bike className="h-6 w-6 text-emerald-100" />
          <div>
            <span className="text-xl font-bold text-white tracking-tight">Zepto Rider</span>
            {rider && (
              <p className="text-xs text-emerald-200 leading-none mt-0.5">
                {rider.name}
                {rider.warehouseName ? ` · ${rider.warehouseName}` : ''}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/"
            className={clsx(
              'flex items-center gap-1.5 text-sm font-medium transition-colors',
              pathname === '/' ? 'text-white' : 'text-emerald-100 hover:text-white',
            )}
          >
            Active
          </Link>
          <Link
            to="/history"
            className={clsx(
              'flex items-center gap-1.5 text-sm font-medium transition-colors',
              pathname === '/history' ? 'text-white' : 'text-emerald-100 hover:text-white',
            )}
          >
            <Clock className="h-4 w-4" />
            History
          </Link>
          <button
            onClick={clearRider}
            title="Switch profile"
            className="flex items-center justify-center rounded-md p-1.5 text-emerald-200 hover:bg-emerald-700 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  )
}
