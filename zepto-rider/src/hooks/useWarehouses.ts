import { useState, useEffect } from 'react'
import type { Warehouse } from '../types'

export function useWarehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/warehouses')
      .then((r) => r.json())
      .then(setWarehouses)
      .finally(() => setLoading(false))
  }, [])

  return { warehouses, loading }
}
