import { useState } from 'react'
import { ShoppingCart, Tag, Plus, Minus } from 'lucide-react'
import { clsx } from 'clsx'
import type { CatalogProduct, Variant } from '../types'
import { useCart } from '../context/CartContext'

interface Props {
  product: CatalogProduct
}

export function ProductCard({ product }: Props) {
  const { add, items, updateQty } = useCart()
  const [selectedVariant, setSelectedVariant] = useState<Variant>(product.variants[0])

  if (!selectedVariant) return null

  const cartItem = items.find(i => i.variant.id === selectedVariant.id)
  const qtyInCart = cartItem?.qty ?? 0

  const discount = Math.round(
    ((selectedVariant.mrp - selectedVariant.sellingPrice) / selectedVariant.mrp) * 100,
  )
  const outOfStock = selectedVariant.inStock === false

  function handleAdd() {
    if (outOfStock) return
    add(selectedVariant, product.name)
  }

  return (
    <div className="flex flex-col rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Product image */}
      <div className="relative bg-gray-50">
        {selectedVariant.imageUrl ? (
          <img
            src={selectedVariant.imageUrl}
            alt={product.name}
            className="h-36 w-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="flex h-36 items-center justify-center text-gray-200">
            <ShoppingCart className="h-10 w-10" />
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 rounded bg-green-500 px-1.5 py-0.5 text-xs font-bold text-white shadow">
            {discount}% off
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3">
        {/* Header */}
        <div className="mb-2">
          <h3 className="font-semibold text-gray-900 leading-snug text-sm">{product.name}</h3>
          <p className="mt-0.5 text-xs text-gray-500 flex items-center gap-1">
            <Tag className="h-3 w-3" /> {product.brand} · {product.categoryName}
          </p>
        </div>

        {/* Variant selector */}
        {product.variants.length > 1 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {product.variants.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVariant(v)}
                className={clsx(
                  'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                  selectedVariant.id === v.id
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400',
                  v.inStock === false && 'opacity-40',
                )}
              >
                {v.packSize}
              </button>
            ))}
          </div>
        )}

        {/* Price row */}
        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            <span className="text-lg font-bold text-gray-900">
              ₹{selectedVariant.sellingPrice.toFixed(0)}
            </span>
            {discount > 0 && (
              <span className="ml-1.5 text-xs text-gray-400 line-through">
                ₹{selectedVariant.mrp.toFixed(0)}
              </span>
            )}
            <p className="text-xs text-gray-400">{selectedVariant.packSize}</p>
          </div>

          <div className="flex flex-col items-end gap-1">
            {selectedVariant.inStock !== null && (
              <span
                className={clsx(
                  'text-xs font-medium',
                  outOfStock ? 'text-red-500' : 'text-green-600',
                )}
              >
                {outOfStock ? 'Out of stock' : `${selectedVariant.qtyAvailable} left`}
              </span>
            )}
            {qtyInCart > 0 ? (
              <div className="flex items-center rounded-lg overflow-hidden border border-indigo-200">
                <button
                  onClick={() => updateQty(selectedVariant.id, qtyInCart - 1)}
                  className="flex h-8 w-8 items-center justify-center bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-95 transition-all"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-7 text-center text-sm font-bold text-indigo-700 select-none">
                  {qtyInCart}
                </span>
                <button
                  onClick={handleAdd}
                  className="flex h-8 w-8 items-center justify-center bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAdd}
                disabled={outOfStock}
                className={clsx(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                  outOfStock
                    ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95',
                )}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                Add
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
