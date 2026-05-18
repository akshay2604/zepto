import { useState, useEffect, useCallback } from 'react'
import { Zone } from '../types'

export function useZones(warehouseId: string | undefined) {
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async () => {
    if (!warehouseId) return
    setLoading(true)
    try {
      const res = await window.fetch(`/zones?warehouseId=${warehouseId}`)
      if (res.ok) setZones(await res.json())
    } finally {
      setLoading(false)
    }
  }, [warehouseId])

  useEffect(() => { fetch() }, [fetch])

  return { zones, loading, refresh: fetch }
}
