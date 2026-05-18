import { useState, useEffect, useCallback } from 'react'
import type { OrderResponse, PagedResponse } from '../types'

export function useOrderHistory(userId: string | null) {
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!userId) { setOrders([]); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/orders?userId=${userId}&size=50`)
      if (!res.ok) throw new Error('Failed to load orders')
      const data: PagedResponse<OrderResponse> = await res.json()
      setOrders(data.content)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { refetch() }, [refetch])

  return { orders, loading, error, refetch }
}
