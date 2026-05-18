import { useEffect, useRef, useState } from 'react'
import type { OrderEvent } from '../types'

const MAX_ORDERS = 50

export function useOrderStream() {
  const [orders, setOrders] = useState<OrderEvent[]>([])
  const mapRef = useRef(new Map<string, OrderEvent>())

  useEffect(() => {
    const es = new EventSource('/stream/orders')

    es.addEventListener('order-update', (e: MessageEvent) => {
      const event: OrderEvent = JSON.parse(e.data)
      const map = mapRef.current

      if (!map.has(event.orderId) && map.size >= MAX_ORDERS) {
        const oldestKey = map.keys().next().value
        if (oldestKey) map.delete(oldestKey)
      }

      map.set(event.orderId, event)
      setOrders(Array.from(map.values()).reverse())
    })

    es.onerror = () => es.close()
    return () => es.close()
  }, [])

  return orders
}
