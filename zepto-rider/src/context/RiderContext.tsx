import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { Rider } from '../types'

const STORAGE_KEY = 'zepto_rider'

function loadRider(): Rider | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Rider) : null
  } catch {
    return null
  }
}

interface RiderContextValue {
  rider: Rider | null
  setRider: (r: Rider) => void
  clearRider: () => void
}

const RiderContext = createContext<RiderContextValue | null>(null)

export function RiderProvider({ children }: { children: ReactNode }) {
  const [rider, setRiderState] = useState<Rider | null>(loadRider)

  const setRider = useCallback((r: Rider) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(r))
    setRiderState(r)
  }, [])

  const clearRider = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setRiderState(null)
  }, [])

  return (
    <RiderContext.Provider value={{ rider, setRider, clearRider }}>
      {children}
    </RiderContext.Provider>
  )
}

export function useRider() {
  const ctx = useContext(RiderContext)
  if (!ctx) throw new Error('useRider must be used inside RiderProvider')
  return ctx
}
