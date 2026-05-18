import { useEffect, useRef, useState } from 'react'
import type { OrderEvent, OrderStatus } from '../types'

const MAX_ORDERS = 50
const IN_FLIGHT_STATUSES: OrderStatus[] = ['PLACED', 'CONFIRMED', 'PICKING', 'PACKED']

export function useOrderStream(warehouseId?: string | null) {
  const [orders, setOrders] = useState<OrderEvent[]>([])
  const mapRef = useRef(new Map<string, OrderEvent>())

  // Seed the map with current in-flight orders so orders placed before page load are visible
  useEffect(() => {
    if (!warehouseId) return
    const qs = new URLSearchParams({
      warehouseId,
      statuses: IN_FLIGHT_STATUSES.join(','),
      size: '100',
    })
    fetch(`/orders?${qs}`)
      .then((r) => r.json())
      .then((paged: { content: Array<{
        id: string
        status: OrderStatus
        user: { name: string }
        warehouse: { id: string; name: string }
        items: unknown[]
        amountPayable: number
        placedAt: string
      }> }) => {
        const map = mapRef.current
        for (const o of paged.content) {
          if (!map.has(o.id)) {
            map.set(o.id, {
              orderId: o.id,
              userName: o.user.name,
              status: o.status,
              amountPayable: o.amountPayable,
              itemCount: o.items.length,
              warehouseId: o.warehouse.id,
              warehouseName: o.warehouse.name,
              pickerName: null,
              timestamp: o.placedAt,
            })
          }
        }
        setOrders(Array.from(map.values()).reverse())
      })
      .catch(() => {})
  }, [warehouseId])

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

  return warehouseId ? orders.filter((o) => o.warehouseId === warehouseId) : orders
}
