import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { User } from '../types'

const STORAGE_KEY = 'zepto_user'

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

interface UserContextValue {
  user: User | null
  setUser: (u: User) => void
  clearUser: () => void
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(loadUser)

  const setUser = useCallback((u: User) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    setUserState(u)
  }, [])

  const clearUser = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUserState(null)
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser, clearUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside UserProvider')
  return ctx
}
