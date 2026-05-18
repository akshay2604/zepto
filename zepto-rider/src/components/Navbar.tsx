import { Link, useLocation } from 'react-router-dom'
import { Bike, Clock } from 'lucide-react'
import { clsx } from 'clsx'

export function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="sticky top-0 z-50 bg-emerald-600 shadow-lg">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Bike className="h-6 w-6 text-emerald-100" />
          <span className="text-xl font-bold text-white tracking-tight">Zepto Rider</span>
        </div>
        <div className="flex gap-3">
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
        </div>
      </div>
    </nav>
  )
}
