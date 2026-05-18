import { useEffect, useRef, useState } from 'react'
import type { InventoryEvent } from '../types'

const MAX_ITEMS = 100

export function useInventoryStream(warehouseId?: string | null) {
  const [items, setItems] = useState<InventoryEvent[]>([])
  const mapRef = useRef(new Map<string, InventoryEvent>())

  useEffect(() => {
    const es = new EventSource('/stream/inventory')

    es.addEventListener('inventory-update', (e: MessageEvent) => {
      const event: InventoryEvent = JSON.parse(e.data)
      const map = mapRef.current

      if (!map.has(event.variantId) && map.size >= MAX_ITEMS) {
        const oldestKey = map.keys().next().value
        if (oldestKey) map.delete(oldestKey)
      }

      map.set(event.variantId, event)
      setItems(Array.from(map.values()).reverse())
    })

    es.onerror = () => es.close()
    return () => es.close()
  }, [])

  return warehouseId ? items.filter((i) => i.warehouseId === warehouseId) : items
}
