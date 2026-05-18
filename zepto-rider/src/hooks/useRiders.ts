import { useState, useEffect, useCallback } from 'react'
import type { Rider } from '../types'

export function useRiders() {
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(true)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/riders')
      setRiders(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  async function createRider(payload: {
    name: string
    phone?: string
    vehicleNumber?: string
  }): Promise<Rider> {
    const res = await fetch('/riders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const created: Rider = await res.json()
    setRiders((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
    return created
  }

  return { riders, loading, createRider }
}
