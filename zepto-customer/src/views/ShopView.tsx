import { useState, useMemo } from 'react'
import { ShoppingCart, Store, Loader2, Search, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCatalog } from '../hooks/useCatalog'
import { useWarehouses } from '../hooks/useWarehouses'
import { useUser } from '../context/UserContext'
import { useCart } from '../context/CartContext'
import { ProductCard } from '../components/ProductCard'
import { CartDrawer } from '../components/CartDrawer'
import { CheckoutModal } from '../components/CheckoutModal'

export function ShopView() {
  const { warehouses, loading: whLoading } = useWarehouses()
  const { user } = useUser()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Use the customer's assigned warehouse, else fall back to first active
  const activeWarehouse = useMemo(() => {
    if (user?.warehouseId) return warehouses.find(w => w.id === user.warehouseId) ?? null
    return warehouses[0] ?? null
  }, [warehouses, user])

  const { products, categories, loading } = useCatalog(
    activeWarehouse?.id ?? null,
    selectedCategory,
  )
  const { totalItems } = useCart()
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  // Client-side search across product name, brand, variant displayName and skuCode
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products
      .map(p => {
        const matchesProduct =
          p.name.toLowerCase().includes(q) ||
          (p.brand ?? '').toLowerCase().includes(q)
        const matchingVariants = p.variants.filter(
          v =>
            v.displayName.toLowerCase().includes(q) ||
            v.skuCode.toLowerCase().includes(q),
        )
        if (matchesProduct) return p
        if (matchingVariants.length > 0) return { ...p, variants: matchingVariants }
        return null
      })
      .filter(Boolean) as typeof products
  }, [products, search])

  if (whLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…
      </div>
    )
  }

  if (!activeWarehouse) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-400">
        <Store className="h-6 w-6" />
        <p className="text-sm">No warehouse assigned.</p>
        <Link
          to="/customers"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          Select a customer →
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Shop</h1>
          <p className="text-sm text-gray-500">
            {user ? (
              <>
                <span className="font-medium text-gray-700">{user.name}</span>
                {' · '}
              </>
            ) : null}
            Delivering from{' '}
            <span className="font-medium text-indigo-600">{activeWarehouse.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/customers"
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm hover:shadow-md transition-shadow"
          >
            <Users className="h-4 w-4" />
            Switch
          </Link>
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:shadow-md transition-shadow"
          >
            <ShoppingCart className="h-4 w-4" />
            Cart
            {totalItems > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products or SKUs…"
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
        />
      </div>

      {/* Category filter — hidden when searching */}
      {!search && (
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Product grid */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading products…
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-gray-400">
          {search ? `No results for "${search}"` : 'No products found'}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredProducts.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

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
    </div>
  )
}
