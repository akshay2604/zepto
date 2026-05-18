import { useCallback, useEffect, useState } from 'react'

export interface LedgerItem {
  ledgerId: string
  warehouseId: string
  warehouseName: string
  variantId: string
  displayName: string
  skuCode: string
  qtyOnHand: number
  qtyReserved: number
  qtyAvailable: number
  reorderThreshold: number
  lowStock: boolean
}

export type ManualMovementType = 'INBOUND' | 'SPOILAGE' | 'ADJUSTMENT'

export function useInventoryLedger(intervalMs = 5000, warehouseId?: string | null) {
  const [ledgers, setLedgers] = useState<LedgerItem[]>([])

  const fetchLedgers = useCallback(async () => {
    try {
      const data = await fetch('/inventory').then((r) => r.json())
      setLedgers(data)
    } catch {
      // backend not ready
    }
  }, [])

  useEffect(() => {
    fetchLedgers()
    const id = setInterval(fetchLedgers, intervalMs)
    return () => clearInterval(id)
  }, [fetchLedgers, intervalMs])

  async function applyMovement(
    wId: string,
    variantId: string,
    movementType: ManualMovementType,
    qtyDelta: number,
  ) {
    await fetch('/inventory/movements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ warehouseId: wId, variantId, movementType, qtyDelta }),
    })
    await fetchLedgers()
  }

  async function updateThreshold(wId: string, variantId: string, reorderThreshold: number) {
    await fetch(`/inventory/${wId}/${variantId}/threshold`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reorderThreshold }),
    })
    await fetchLedgers()
  }

  const filtered = warehouseId ? ledgers.filter((l) => l.warehouseId === warehouseId) : ledgers

  return { ledgers: filtered, applyMovement, updateThreshold }
}
