import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'

interface Props {
  open: boolean
  onClose: () => void
  onCheckout: () => void
}

export function CartDrawer({ open, onClose, onCheckout }: Props) {
  const { items, remove, updateQty, subtotal, clear } = useCart()

  const deliveryFee = subtotal >= 199 ? 0 : 25
  const total = subtotal + deliveryFee

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-indigo-600" />
            <h2 className="font-semibold text-gray-900">Your Cart</h2>
            {items.length > 0 && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                {items.length} items
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clear}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Clear all
              </button>
            )}
            <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
              <ShoppingBag className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Your cart is empty</p>
              <p className="text-xs mt-1">Browse the shop to add items</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map(item => (
                <li key={item.variant.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{item.productName}</p>
                    <p className="text-xs text-gray-500">{item.variant.packSize}</p>
                    <p className="mt-0.5 text-sm font-semibold text-indigo-600">
                      ₹{(item.variant.sellingPrice * item.qty).toFixed(0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(item.variant.id, item.qty - 1)}
                      className="rounded-md border p-1 hover:bg-gray-50"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.variant.id, item.qty + 1)}
                      className="rounded-md border p-1 hover:bg-gray-50"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => remove(item.variant.id)}
                      className="ml-1 rounded-md p-1 text-red-400 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Summary + checkout */}
        {items.length > 0 && (
          <div className="border-t bg-gray-50 px-4 py-4">
            <div className="space-y-1.5 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                  {deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}
                </span>
              </div>
              {deliveryFee > 0 && (
                <p className="text-xs text-gray-400">
                  Add ₹{(199 - subtotal).toFixed(0)} more for free delivery
                </p>
              )}
              <div className="flex justify-between border-t pt-2 text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>₹{total.toFixed(0)}</span>
              </div>
            </div>
            <button
              onClick={onCheckout}
              className="mt-3 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 active:scale-[0.98] transition-all"
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  )
}
