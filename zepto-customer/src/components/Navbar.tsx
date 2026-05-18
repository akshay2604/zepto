import { Link, useLocation } from 'react-router-dom'
import { Zap, ShoppingCart, Users, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'
import { useState } from 'react'
import { CartDrawer } from './CartDrawer'
import { CheckoutModal } from './CheckoutModal'
import { useWarehouses } from '../hooks/useWarehouses'

const LINKS = [
  { to: '/', label: 'Live Feed' },
  { to: '/shop', label: 'Shop' },
  { to: '/history', label: 'History' },
]

export function Navbar() {
  const { pathname } = useLocation()
  const { totalItems } = useCart()
  const { user } = useUser()
  const { warehouses } = useWarehouses()
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const activeWarehouse = user?.warehouseId
    ? warehouses.find(w => w.id === user.warehouseId) ?? null
    : warehouses[0] ?? null

  return (
    <>
      <nav className="sticky top-0 z-50 bg-indigo-600 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-300" />
            <span className="text-xl font-bold text-white tracking-tight">Zepto</span>
          </div>

          <div className="flex items-center gap-5">
            {LINKS.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={clsx(
                  'text-sm font-medium transition-colors',
                  pathname === l.to ? 'text-white' : 'text-indigo-200 hover:text-white',
                )}
              >
                {l.label}
              </Link>
            ))}

            {/* Customer switcher chip */}
            <Link
              to="/customers"
              className={clsx(
                'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                pathname === '/customers'
                  ? 'border-white bg-white/20 text-white'
                  : 'border-indigo-400 text-indigo-100 hover:bg-indigo-500 hover:text-white',
              )}
            >
              <Users className="h-3.5 w-3.5" />
              {user ? (
                <>
                  {user.name.split(' ')[0]}
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </>
              ) : (
                'Pick customer'
              )}
            </Link>

            <button
              onClick={() => setCartOpen(true)}
              className="relative rounded-lg p-1.5 text-indigo-200 hover:bg-indigo-500 hover:text-white transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-indigo-900">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => { setCartOpen(false); setCheckoutOpen(true) }}
      />
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        warehouse={activeWarehouse}
      />
    </>
  )
}
