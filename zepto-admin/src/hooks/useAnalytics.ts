import { useEffect, useState } from 'react'
import type { InventoryStatusItem, TopVariant, MovementAudit, OrderFunnel, AvgDelivery, SimulatorStatus } from '../types'

interface AnalyticsData {
  inventoryStatus: InventoryStatusItem[]
  orderFunnel: OrderFunnel
  avgDelivery: AvgDelivery
  topVariants: TopVariant[]
  movementAudit: MovementAudit[]
  systemStatus: SimulatorStatus
}

const DEFAULT: AnalyticsData = {
  inventoryStatus: [],
  orderFunnel: { countByStatus: {} },
  avgDelivery: { avgDeliveryTimeSecs: 0, totalDelivered: 0 },
  topVariants: [],
  movementAudit: [],
  systemStatus: { paused: false, totalOrders: 0, totalDelivered: 0, totalMovements: 0, activeEmitters: 0 },
}

export function useAnalytics(intervalMs = 5000) {
  const [data, setData] = useState<AnalyticsData>(DEFAULT)

  useEffect(() => {
    async function fetchAll() {
      try {
        const [inventoryStatus, orderFunnel, avgDelivery, topVariants, movementAudit, systemStatus] =
          await Promise.all([
            fetch('/analytics/inventory-status').then((r) => r.json()),
            fetch('/analytics/order-funnel').then((r) => r.json()),
            fetch('/analytics/avg-delivery-time').then((r) => r.json()),
            fetch('/analytics/top-variants').then((r) => r.json()),
            fetch('/analytics/movement-audit').then((r) => r.json()),
            fetch('/system/status').then((r) => r.json()),
          ])
        setData({ inventoryStatus, orderFunnel, avgDelivery, topVariants, movementAudit, systemStatus })
      } catch {
        // backend not ready
      }
    }

    fetchAll()
    const id = setInterval(fetchAll, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return data
}
