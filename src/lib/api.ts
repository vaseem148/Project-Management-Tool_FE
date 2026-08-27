import axios, { AxiosError } from 'axios'

export const TOKEN_KEY = 'pmt.token'

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const path = window.location.pathname
    if (error.response?.status === 401 && !path.startsWith('/login') && !path.startsWith('/register')) {
      localStorage.removeItem(TOKEN_KEY)
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

/** Pull a readable message out of an axios/FastAPI error. */
export function apiError(error: unknown, fallback = 'Something went wrong'): string {
  const err = error as AxiosError<{ detail?: unknown }>
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const first = detail[0] as { msg?: string } | undefined
    if (first?.msg) return first.msg
  }
  return err?.message || fallback
}
