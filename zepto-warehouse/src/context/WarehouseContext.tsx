import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Warehouse } from '../types'

interface WarehouseContextValue {
  warehouses: Warehouse[]
  selected: Warehouse | null
  setSelected: (w: Warehouse) => void
  loading: boolean
}

const WarehouseContext = createContext<WarehouseContextValue | null>(null)

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selected, setSelected] = useState<Warehouse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/warehouses')
      .then((r) => r.json())
      .then((data: Warehouse[]) => {
        setWarehouses(data)
        const firstActive = data.find((w) => w.active) ?? data[0] ?? null
        setSelected(firstActive)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <WarehouseContext.Provider value={{ warehouses, selected, setSelected, loading }}>
      {children}
    </WarehouseContext.Provider>
  )
}

export function useWarehouse() {
  const ctx = useContext(WarehouseContext)
  if (!ctx) throw new Error('useWarehouse must be inside WarehouseProvider')
  return ctx
}
