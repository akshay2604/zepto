import { useState, useEffect, useCallback } from 'react'
import { PickBatch, PickBatchItem } from '../types'

export function useBatches(warehouseId: string | undefined) {
  const [batches, setBatches] = useState<PickBatch[]>([])
  const [loading, setLoading] = useState(false)
  const [forming, setForming] = useState(false)

  const refresh = useCallback(async () => {
    if (!warehouseId) return
    setLoading(true)
    try {
      const res = await fetch(`/batches?warehouseId=${warehouseId}`)
      if (res.ok) setBatches(await res.json())
    } finally {
      setLoading(false)
    }
  }, [warehouseId])

  useEffect(() => { refresh() }, [refresh])

  const formBatches = useCallback(async () => {
    if (!warehouseId) return []
    setForming(true)
    try {
      const res = await fetch(`/batches/form?warehouseId=${warehouseId}`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to form batches')
      const created: PickBatch[] = await res.json()
      await refresh()
      return created
    } finally {
      setForming(false)
    }
  }, [warehouseId, refresh])

  const assignPicker = useCallback(async (batchId: string, pickerId: string) => {
    const res = await fetch(`/batches/${batchId}/assign-picker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pickerId }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body?.message ?? 'Failed to assign picker')
    }
    const updated: PickBatch = await res.json()
    setBatches(prev => prev.map(b => b.id === batchId ? updated : b))
    return updated
  }, [])

  const startBatch = useCallback(async (batchId: string) => {
    const res = await fetch(`/batches/${batchId}/start`, { method: 'POST' })
    if (!res.ok) throw new Error('Failed to start batch')
    const updated: PickBatch = await res.json()
    setBatches(prev => prev.map(b => b.id === batchId ? updated : b))
    return updated
  }, [])

  const completeBatch = useCallback(async (batchId: string) => {
    const res = await fetch(`/batches/${batchId}/complete`, { method: 'POST' })
    if (!res.ok) throw new Error('Failed to complete batch')
    const updated: PickBatch = await res.json()
    setBatches(prev => prev.map(b => b.id === batchId ? updated : b))
    return updated
  }, [])

  const pickItem = useCallback(async (batchId: string, itemId: string): Promise<PickBatchItem> => {
    const res = await fetch(`/batches/${batchId}/items/${itemId}/pick`, { method: 'POST' })
    if (!res.ok) throw new Error('Failed to pick item')
    return res.json()
  }, [])

  return { batches, loading, forming, refresh, formBatches, assignPicker, startBatch, completeBatch, pickItem }
}
