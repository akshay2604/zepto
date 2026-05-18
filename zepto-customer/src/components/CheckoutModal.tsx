import { useState, FormEvent } from 'react'
import { X, CheckCircle, Loader2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useUser } from '../context/UserContext'
import type { Warehouse } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  warehouse: Warehouse | null
}

type Step = 'identity' | 'address' | 'payment' | 'done'

const PAYMENT_METHODS = ['UPI', 'CARD', 'WALLET', 'COD']

export function CheckoutModal({ open, onClose, warehouse }: Props) {
  const { items, subtotal, clear } = useCart()
  const { user, setUser } = useUser()

  const [step, setStep] = useState<Step>(user ? 'address' : 'identity')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [line1, setLine1] = useState('')
  const [pincode, setPincode] = useState(warehouse?.pincode ?? '')
  const [city, setCity] = useState(warehouse?.city ?? 'Bengaluru')
  const [paymentMethod, setPaymentMethod] = useState('UPI')

  if (!open) return null

  const deliveryFee = subtotal >= 199 ? 0 : 25
  const total = subtotal + deliveryFee

  async function resolveUser(): Promise<string> {
    // Try to find existing user by phone first
    const lookup = await fetch(`/users/by-phone/${encodeURIComponent(phone)}`)
    if (lookup.ok) {
      const existing = await lookup.json()
      setUser({ id: existing.id, name: existing.name, phone: existing.phone, email: existing.email,
        warehouseId: existing.warehouseId ?? null, warehouseName: existing.warehouseName ?? null })
      return existing.id
    }
    // Register new user
    const reg = await fetch('/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email: email || undefined }),
    })
    if (!reg.ok) {
      const err = await reg.json()
      throw new Error(err.detail ?? 'Registration failed')
    }
    const newUser = await reg.json()
    setUser({ id: newUser.id, name: newUser.name, phone: newUser.phone, email: newUser.email,
      warehouseId: newUser.warehouseId ?? null, warehouseName: newUser.warehouseName ?? null })
    return newUser.id
  }

  async function handleIdentitySubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!phone.match(/^\+91\d{10}$/)) {
      setError('Phone must be in format +91XXXXXXXXXX')
      return
    }
    setStep('address')
  }

  async function handleAddressSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!line1.trim()) { setError('Address is required'); return }
    setStep('payment')
  }

  async function handlePlaceOrder(e: FormEvent) {
    e.preventDefault()
    if (!warehouse) return
    setLoading(true)
    setError(null)

    try {
      const userId = user?.id ?? (await resolveUser())

      // Add address
      const addrRes = await fetch(`/users/${userId}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: 'Home', line1, pincode, city, isDefault: true }),
      })
      if (!addrRes.ok) throw new Error('Failed to save address')
      const addr = await addrRes.json()

      // Place order
      const orderRes = await fetch('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          addressId: addr.id,
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
    setStep(user ? 'address' : 'identity')
    setError(null)
    setLine1('')
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
              {step === 'identity' && 'Who are you?'}
              {step === 'address' && 'Delivery address'}
              {step === 'payment' && 'Payment & confirm'}
              {step === 'done' && 'Order placed!'}
            </h2>
            <button onClick={handleClose} className="rounded-lg p-1 hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="px-5 py-5">
            {/* Step: identity */}
            {step === 'identity' && (
              <form onSubmit={handleIdentitySubmit} className="space-y-3">
                <Field label="Name" value={name} onChange={setName} placeholder="Akshay Mathur" required />
                <Field label="Phone" value={phone} onChange={setPhone} placeholder="+91XXXXXXXXXX" required />
                <Field label="Email (optional)" value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button type="submit" className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
                  Continue →
                </button>
              </form>
            )}

            {/* Step: address */}
            {step === 'address' && (
              <form onSubmit={handleAddressSubmit} className="space-y-3">
                {user && <p className="text-sm text-gray-500">Ordering as <span className="font-medium text-gray-700">{user.name}</span></p>}
                <Field label="Address" value={line1} onChange={setLine1} placeholder="12, 5th Cross, Koramangala" required />
                <div className="flex gap-3">
                  <Field label="Pincode" value={pincode} onChange={setPincode} placeholder="560034" />
                  <Field label="City" value={city} onChange={setCity} placeholder="Bengaluru" />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <button type="submit" className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
                  Continue →
                </button>
              </form>
            )}

            {/* Step: payment */}
            {step === 'payment' && (
              <form onSubmit={handlePlaceOrder} className="space-y-4">
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-70"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {loading ? 'Placing order…' : `Place order · ₹${total.toFixed(0)}`}
                </button>
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

function Field({
  label, value, onChange, placeholder, required, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; required?: boolean; type?: string
}) {
  return (
    <div className="flex-1">
      <label className="mb-1 block text-xs font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
      />
    </div>
  )
}
