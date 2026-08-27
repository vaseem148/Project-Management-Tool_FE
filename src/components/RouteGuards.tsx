import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/store/auth'

interface RedirectState {
  from?: string
}

function AuthSplash() {
  return (
    <div className="grid-bg flex h-full min-h-screen w-full flex-col items-center justify-center gap-5">
      <div className="brand-gradient animate-float flex h-14 w-14 items-center justify-center rounded-2xl shadow-[var(--shadow-glow)]">
        <span className="text-xl font-extrabold tracking-tight text-white">N</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>Loading your workspace…</span>
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        Checking your session
      </span>
    </div>
  )
}

/** Gate for every authenticated route. Remembers where the user was headed. */
export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <AuthSplash />
  if (!isAuthenticated) {
    const from = location.pathname + location.search
    return <Navigate to="/login" replace state={{ from } satisfies RedirectState} />
  }
  return <Outlet />
}

/** Keeps signed-in users away from /login and /register. */
export function RedirectIfAuthed() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <AuthSplash />
  if (isAuthenticated) {
    const state = location.state as RedirectState | null
    const target = state?.from && !state.from.startsWith('/login') && !state.from.startsWith('/register') ? state.from : '/'
    return <Navigate to={target} replace />
  }
  return <Outlet />
}
