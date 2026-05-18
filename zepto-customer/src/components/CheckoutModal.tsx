import { useState, useEffect, FormEvent } from 'react'
import { X, CheckCircle, Loader2, Users, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'
import type { Warehouse } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  warehouse: Warehouse | null
}

type Step = 'payment' | 'done'

interface Address {
  id: string
  line1: string
  city: string
  pincode: string
  isDefault: boolean
}

const PAYMENT_METHODS = ['UPI', 'CARD', 'WALLET', 'COD']

export function CheckoutModal({ open, onClose, warehouse }: Props) {
  const { items, subtotal, clear } = useCart()
  const { user } = useUser()

  const [step, setStep] = useState<Step>('payment')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null)

  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null)
  const [addressLoading, setAddressLoading] = useState(false)

  const [paymentMethod, setPaymentMethod] = useState('UPI')

  // Fetch default address when modal opens and user is set
  useEffect(() => {
    if (!open || !user) return
    setAddressLoading(true)
    fetch(`/users/${user.id}/addresses`)
      .then(r => r.json())
      .then((addrs: Address[]) => {
        const def = addrs.find(a => a.isDefault) ?? null
        setDefaultAddress(def)
      })
      .catch(() => setDefaultAddress(null))
      .finally(() => setAddressLoading(false))
  }, [open, user])

  if (!open) return null

  const deliveryFee = subtotal >= 199 ? 0 : 25
  const total = subtotal + deliveryFee

  async function handlePlaceOrder(e: FormEvent) {
    e.preventDefault()
    if (!warehouse || !defaultAddress) return
    setLoading(true)
    setError(null)

    try {
      const userId = user!.id

      // Place order
      const orderRes = await fetch('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          addressId: defaultAddress.id,
          warehouseId: warehouse.id,
          paymentMethod,
          items: items.map(i => ({ variantId: i.variant.id, qty: i.qty })),
        }),
      })
      if (!orderRes.ok) {
        const err = await orderRes.json()
        throw new Error(err.detail ?? 'Order placement failed')
      }
      const order = await orderRes.json()

      // Simulate payment gateway callback — moves order PLACED → CONFIRMED
      await fetch('/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          status: 'SUCCESS',
          gatewayTxnId: `SIM-${Date.now()}`,
        }),
      })

      setPlacedOrderId(order.id)
      setStep('done')
      clear()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    setStep('payment')
    setError(null)
    setPlacedOrderId(null)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="font-semibold text-gray-900">
              {step === 'payment' && 'Payment & confirm'}
              {step === 'done' && 'Order placed!'}
            </h2>
            <button onClick={handleClose} className="rounded-lg p-1 hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="px-5 py-5">
            {/* No user selected guard */}
            {!user && (
              <div className="flex flex-col items-center gap-3 py-6 text-center text-gray-500">
                <Users className="h-8 w-8 opacity-40" />
                <p className="text-sm">Please select a customer before checking out.</p>
                <Link to="/customers" onClick={handleClose} className="text-sm font-medium text-indigo-600 hover:underline">
                  Pick a customer →
                </Link>
              </div>
            )}

            {/* Step: payment */}
            {user && step === 'payment' && (
              <form onSubmit={handlePlaceOrder} className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Ordering as <span className="font-medium text-gray-700">{user.name}</span> · {user.phone}</p>
                  {addressLoading ? (
                    <p className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading address…
                    </p>
                  ) : defaultAddress ? (
                    <p className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="h-3 w-3 shrink-0 text-gray-400" />
                      {defaultAddress.line1}, {defaultAddress.city}
                    </p>
                  ) : (
                    <p className="text-xs text-red-500">No default address on file. Please contact the admin to set one up.</p>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">Payment method</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                          paymentMethod === m
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Order summary */}
                <div className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
                  {items.map(i => (
                    <div key={i.variant.id} className="flex justify-between text-gray-600">
                      <span className="truncate">{i.productName} {i.variant.packSize} ×{i.qty}</span>
                      <span>₹{(i.variant.sellingPrice * i.qty).toFixed(0)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-gray-500 border-t pt-1">
                    <span>Delivery</span>
                    <span>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee}`}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900 border-t pt-1">
                    <span>Total</span>
                    <span>₹{total.toFixed(0)}</span>
                  </div>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}
                {defaultAddress && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {loading ? 'Placing order…' : `Place order · ₹${total.toFixed(0)}`}
                  </button>
                )}
              </form>
            )}

            {/* Step: done */}
            {step === 'done' && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900">Order placed!</h3>
                <p className="text-sm text-gray-500">
                  Order ID: <span className="font-mono text-xs">{placedOrderId?.slice(-8)}</span>
                </p>
                <p className="text-sm text-gray-500">Track it on the Live Feed.</p>
                <button
                  onClick={handleClose}
                  className="mt-2 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Back to shop
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
