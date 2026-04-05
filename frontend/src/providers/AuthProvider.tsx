'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import { User } from '@/types'
import { getUser, removeToken, setToken, setUser } from '@/lib/auth'

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = getUser()
    if (stored) {
      setUserState(stored)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((token: string, userData: User) => {
    setToken(token)
    setUser(userData)
    setUserState(userData)
  }, [])

  const logout = useCallback(() => {
    removeToken()
    setUserState(null)
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}
