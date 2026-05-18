import { useState } from 'react'

export interface OnboardRequest {
  name: string
  address: string
  city: string
  pincode: string
  lat: number
  lng: number
  riderCount: number
  pickerCount: number
  customerCount: number
}

export interface OnboardResult {
  warehouse: { id: string; name: string }
  pickers: Array<{ id: string; name: string; zones: string[] }>
  riders: Array<{ id: string; name: string; vehicleNumber: string }>
  customers: Array<{ id: string; name: string }>
  inventoryVariantsSeeded: number
}

export interface PurgeResult {
  warehouseId: string
  warehouseName: string
  ordersDeleted: number
  batchesDeleted: number
  pickersDeleted: number
  ridersDeleted: number
  customersUnassigned: number
  inventoryLedgersDeleted: number
}

export function useDarkStore() {
  const [onboarding, setOnboarding] = useState(false)
  const [purging, setPurging] = useState(false)

  async function onboard(req: OnboardRequest): Promise<OnboardResult> {
    setOnboarding(true)
    try {
      const res = await fetch('/warehouses/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    } finally {
      setOnboarding(false)
    }
  }

  async function purge(warehouseId: string): Promise<PurgeResult> {
    setPurging(true)
    try {
      const res = await fetch(`/warehouses/${warehouseId}/purge`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      return res.json()
    } finally {
      setPurging(false)
    }
  }

  return { onboarding, purging, onboard, purge }
}
