import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import type { CartItem, Variant } from '../types'

const CART_KEY = 'zepto_cart'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

interface CartContextValue {
  items: CartItem[]
  add: (variant: Variant, productName: string) => void
  remove: (variantId: string) => void
  updateQty: (variantId: string, qty: number) => void
  clear: () => void
  totalItems: number
  subtotal: number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items])

  const add = useCallback((variant: Variant, productName: string) => {
    setItems(prev => {
      const existing = prev.find(i => i.variant.id === variant.id)
      if (existing) {
        return prev.map(i =>
          i.variant.id === variant.id ? { ...i, qty: i.qty + 1 } : i,
        )
      }
      return [...prev, { variant, productName, qty: 1 }]
    })
  }, [])

  const remove = useCallback((variantId: string) => {
    setItems(prev => prev.filter(i => i.variant.id !== variantId))
  }, [])

  const updateQty = useCallback((variantId: string, qty: number) => {
    if (qty <= 0) {
      setItems(prev => prev.filter(i => i.variant.id !== variantId))
    } else {
      setItems(prev =>
        prev.map(i => (i.variant.id === variantId ? { ...i, qty } : i)),
      )
    }
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const totalItems = items.reduce((s, i) => s + i.qty, 0)
  const subtotal = items.reduce((s, i) => s + i.variant.sellingPrice * i.qty, 0)

  return (
    <CartContext.Provider value={{ items, add, remove, updateQty, clear, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
