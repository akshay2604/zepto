import { useState } from 'react'

export function useSimulator() {
  const [loading, setLoading] = useState(false)

  async function triggerAdvance() {
    setLoading(true)
    try {
      const res = await fetch('/orders?size=1&page=0')
      const page = await res.json()
      const orders: Array<{ id: string; status: string }> = page.content ?? []
      const order = orders.find((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED')
      if (!order) return

      const { id, status } = order

      if (status === 'PLACED' || status === 'PAYMENT_PENDING') {
        await fetch(`/orders/${id}/confirm`, { method: 'POST' })
      } else if (status === 'CONFIRMED') {
        await fetch(`/orders/${id}/start-picking`, { method: 'POST' })
      } else if (status === 'PICKING') {
        await fetch(`/orders/${id}/pack`, { method: 'POST' })
      } else if (status === 'PACKED') {
        const riderName = `Rider ${Math.floor(Math.random() * 900) + 100}`
        const riderPhone = `+91${String(9000000000 + Math.floor(Math.random() * 999999999))}`
        await fetch(`/orders/${id}/assign-rider`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ riderName, riderPhone }),
        })
        await fetch(`/orders/${id}/out-for-delivery`, { method: 'POST' })
      } else if (status === 'OUT_FOR_DELIVERY') {
        await fetch(`/orders/${id}/deliver`, { method: 'POST' })
      }
    } catch {
      // backend not ready
    } finally {
      setLoading(false)
    }
  }

  async function triggerOrder() {
    setLoading(true)
    try {
      // 1. Get first user
      const usersRes = await fetch('/users')
      const users = await usersRes.json()
      const user = Array.isArray(users) ? users[0] : users.content?.[0]
      if (!user) return

      // 2. Get first address
      const addrRes = await fetch(`/users/${user.id}/addresses`)
      const addresses = await addrRes.json()
      const address = Array.isArray(addresses) ? addresses[0] : addresses.content?.[0]
      if (!address) return

      // 3. Get inventory, group by warehouseId, find warehouse with available stock
      const invRes = await fetch('/inventory')
      const ledgers: Array<{
        warehouseId: string
        variantId: string
        qtyAvailable: number
      }> = await invRes.json()

      const byWarehouse = ledgers.reduce<Record<string, typeof ledgers>>((acc, l) => {
        if (!acc[l.warehouseId]) acc[l.warehouseId] = []
        acc[l.warehouseId].push(l)
        return acc
      }, {})

      const warehouseIds = Object.keys(byWarehouse).filter((wId) =>
        byWarehouse[wId].some((l) => l.qtyAvailable > 0),
      )
      if (warehouseIds.length === 0) return

      const warehouseId = warehouseIds[Math.floor(Math.random() * warehouseIds.length)]
      const available = byWarehouse[warehouseId].filter((l) => l.qtyAvailable > 0)

      // 4. Pick 1-3 random variants
      const shuffled = available.sort(() => Math.random() - 0.5)
      const picked = shuffled.slice(0, Math.min(3, shuffled.length))
      const items = picked.map((l) => ({ variantId: l.variantId, qty: 1 }))

      // 5. Place order
      await fetch('/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          addressId: address.id,
          warehouseId,
          paymentMethod: 'UPI',
          items,
        }),
      })
    } catch {
      // backend not ready
    } finally {
      setLoading(false)
    }
  }

  async function triggerRestock() {
    setLoading(true)
    try {
      const invRes = await fetch('/inventory')
      const ledgers: Array<{
        warehouseId: string
        variantId: string
        lowStock: boolean
      }> = await invRes.json()

      const lowStock = ledgers.filter((l) => l.lowStock)
      if (lowStock.length === 0) return

      const entry = lowStock[Math.floor(Math.random() * lowStock.length)]

      await fetch('/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouseId: entry.warehouseId,
          variantId: entry.variantId,
          movementType: 'INBOUND',
          qtyDelta: 100,
        }),
      })
    } catch {
      // backend not ready
    } finally {
      setLoading(false)
    }
  }

  async function triggerPayment() {
    setLoading(true)
    try {
      // Find the oldest PLACED order
      const res = await fetch('/orders?status=PLACED&size=1&page=0')
      const page = await res.json()
      const orders: Array<{ id: string }> = page.content ?? []
      if (orders.length === 0) return

      await fetch('/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orders[0].id,
          status: 'SUCCESS',
          gatewayTxnId: `SIM-${Date.now()}`,
        }),
      })
    } catch {
      // backend not ready
    } finally {
      setLoading(false)
    }
  }

  return { loading, triggerAdvance, triggerOrder, triggerRestock, triggerPayment }
}
