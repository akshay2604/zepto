import { useEffect, useState } from 'react'
import type { InventoryStatusItem, TopVariant, MovementAudit, OrderFunnel, AvgDelivery } from '../types'

interface AnalyticsData {
  inventoryStatus: InventoryStatusItem[]
  orderFunnel: OrderFunnel
  avgDelivery: AvgDelivery
  topVariants: TopVariant[]
  movementAudit: MovementAudit[]
}

const DEFAULT: AnalyticsData = {
  inventoryStatus: [],
  orderFunnel: { countByStatus: {} },
  avgDelivery: { avgDeliveryTimeSecs: 0, totalDelivered: 0 },
  topVariants: [],
  movementAudit: [],
}

export function useAnalytics(intervalMs = 5000, warehouseId?: string | null) {
  const [data, setData] = useState<AnalyticsData>(DEFAULT)

  useEffect(() => {
    const qs = warehouseId ? `?warehouseId=${warehouseId}` : ''

    async function fetchAll() {
      try {
        const [inventoryStatus, orderFunnel, avgDelivery, topVariants, movementAudit] =
          await Promise.all([
            fetch(`/analytics/inventory-status${qs}`).then((r) => r.json()),
            fetch(`/analytics/order-funnel${qs}`).then((r) => r.json()),
            fetch(`/analytics/avg-delivery-time${qs}`).then((r) => r.json()),
            fetch(`/analytics/top-variants${qs}`).then((r) => r.json()),
            fetch(`/analytics/movement-audit${qs}`).then((r) => r.json()),
          ])
        setData({ inventoryStatus, orderFunnel, avgDelivery, topVariants, movementAudit })
      } catch {
        // backend not ready
      }
    }

    fetchAll()
    const id = setInterval(fetchAll, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs, warehouseId])

  return data
}
