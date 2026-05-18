import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, BarChart2, Settings2, Shield, Warehouse, Package, Tag, Users, ShoppingBag } from 'lucide-react'
import { clsx } from 'clsx'

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/analytics', label: 'Analytics', Icon: BarChart2 },
  { to: '/catalog', label: 'Catalog', Icon: Tag },
  { to: '/warehouses', label: 'Warehouses', Icon: Warehouse },
  { to: '/customers', label: 'Customers', Icon: Users },
  { to: '/inventory', label: 'Inventory', Icon: Package },
  { to: '/orders', label: 'Orders', Icon: ShoppingBag },
  { to: '/simulator', label: 'Simulator', Icon: Settings2 },
]

export function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav className="sticky top-0 z-50 bg-violet-700 shadow-lg">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <div className="flex items-center gap-2 mr-4">
          <Shield className="h-6 w-6 text-violet-200" />
          <span className="text-xl font-bold text-white tracking-tight">Zepto Admin</span>
        </div>
        {NAV_LINKS.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className={clsx(
              'flex items-center gap-1.5 text-sm font-medium transition-colors',
              pathname === to ? 'text-white' : 'text-violet-200 hover:text-white',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
