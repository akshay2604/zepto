import { useEffect, useState } from 'react'
import type { Warehouse } from '../types'

export function useWarehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/warehouses')
      .then(r => r.json())
      .then((data: Warehouse[]) => setWarehouses(data.filter(w => w.active)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const defaultWarehouse = warehouses[0] ?? null

  return { warehouses, defaultWarehouse, loading }
}
