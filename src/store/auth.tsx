import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, apiError, TOKEN_KEY } from '@/lib/api'
import type { AuthResponse, User } from '@/types'

export interface RegisterPayload {
  email: string
  full_name: string
  password: string
  job_title?: string
}

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  refresh: () => void
}

/**
 * Fired by `useUpdateProfile` so the shell (avatar, name, initials) reflects a
 * profile edit without the page having to call `refresh()` itself.
 */
export const USER_UPDATED_EVENT = 'pmt:user-updated'

const AuthContext = createContext<AuthContextValue | null>(null)

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function writeToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* ignore storage failures — the session simply won't survive a reload */
  }
}

function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

function firstName(fullName?: string | null) {
  return fullName?.trim().split(/\s+/)[0] ?? 'there'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(readToken()))
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const hydrate = useCallback(async () => {
    if (!readToken()) {
      setUser(null)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const { data } = await api.get<User>('/auth/me')
      setUser(data)
    } catch {
      clearToken()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    const onUserUpdated = (event: Event) => {
      const detail = (event as CustomEvent<User>).detail
      if (detail && typeof detail.id === 'number') setUser(detail)
    }
    window.addEventListener(USER_UPDATED_EVENT, onUserUpdated)
    return () => window.removeEventListener(USER_UPDATED_EVENT, onUserUpdated)
  }, [])

  const adopt = useCallback(
    (data: AuthResponse) => {
      writeToken(data.access_token)
      queryClient.clear()
      setUser(data.user)
      setIsLoading(false)
    },
    [queryClient],
  )

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const { data } = await api.post<AuthResponse>('/auth/login', { email, password })
        adopt(data)
        toast.success(`Welcome back, ${firstName(data.user.full_name)}`)
      } catch (error) {
        throw new Error(apiError(error, 'Unable to sign in'))
      }
    },
    [adopt],
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      try {
        const body = {
          email: payload.email,
          full_name: payload.full_name,
          password: payload.password,
          job_title: payload.job_title?.trim() || undefined,
        }
        const { data } = await api.post<AuthResponse>('/auth/register', body)
        adopt(data)
        toast.success(`Welcome to Nexus PM, ${firstName(data.user.full_name)}`)
      } catch (error) {
        throw new Error(apiError(error, 'Unable to create your account'))
      }
    },
    [adopt],
  )

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
    setIsLoading(false)
    queryClient.clear()
    navigate('/login', { replace: true })
    toast.success('Signed out')
  }, [navigate, queryClient])

  const refresh = useCallback(() => {
    void hydrate()
  }, [hydrate])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: Boolean(user), isLoading, login, register, logout, refresh }),
    [user, isLoading, login, register, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
