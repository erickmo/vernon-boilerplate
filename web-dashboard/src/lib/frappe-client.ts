import { AppApiError } from '@/types/api.types'
import { useAuthStore } from '@/stores/auth.store'

// Empty string = same origin (Vite proxy forwards /api/* to Frappe in dev)
// Set VITE_FRAPPE_URL in .env.local to override for non-proxied setups
const BASE_URL = import.meta.env.VITE_FRAPPE_URL ?? ''

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function parseFrappeError(body: Record<string, unknown>): string {
  try {
    const msgs = body['_server_messages']
    if (typeof msgs === 'string') {
      const parsed = JSON.parse(msgs) as Array<{ message?: string } | string>
      if (Array.isArray(parsed) && parsed.length > 0) {
        const first = parsed[0]
        if (typeof first === 'string') return first
        if (typeof first === 'object' && first !== null && typeof first.message === 'string') {
          return first.message
        }
      }
    }
  } catch {
    // ignore
  }
  if (typeof body['exception'] === 'string') return body['exception'].split(':').pop()?.trim() ?? 'Terjadi kesalahan'
  if (typeof body['message'] === 'string') return body['message']
  return 'Terjadi kesalahan'
}

async function frappeRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? 'GET'
  const isWrite = WRITE_METHODS.has(method.toUpperCase())
  const { csrfToken, logout } = useAuthStore.getState()

  const headers: Record<string, string> = {}
  if (!(init?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  if (isWrite && csrfToken) {
    headers['X-Frappe-CSRF-Token'] = csrfToken
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    method,
    headers: { ...headers, ...(init?.headers as Record<string, string>) },
    credentials: 'include',
  })

  if (res.status === 401) {
    logout()
    throw new AppApiError(401, 'Sesi telah berakhir, silakan login kembali')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>
    const message = parseFrappeError(body)
    throw new AppApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T

  const text = await res.text()
  if (!text) return undefined as T

  const json = JSON.parse(text) as Record<string, unknown>
  // Custom endpoints return { message: <value> }
  // Resource endpoints return { data: <value> }
  if ('message' in json) return json['message'] as T
  if ('data' in json) return json['data'] as T
  return json as T
}

export const frappeClient = {
  get: <T>(path: string) =>
    frappeRequest<T>(path, { method: 'GET' }),

  post: <T>(path: string, body?: unknown) =>
    frappeRequest<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body: unknown) =>
    frappeRequest<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  delete: <T>(path: string) =>
    frappeRequest<T>(path, { method: 'DELETE' }),

  /** Call a Frappe whitelisted method. POST /api/method/<dotted.path> */
  method: <T>(dotPath: string, params?: Record<string, unknown>) =>
    frappeRequest<T>(`/api/method/${dotPath}`, {
      method: 'POST',
      body: params !== undefined ? JSON.stringify(params) : '{}',
    }),

  /** Read from Frappe Resource API. GET /api/resource/<DocType> */
  resource: <T>(doctype: string, params?: Record<string, unknown>) => {
    const qs = params ? '?' + new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)])
      )
    ).toString() : ''
    return frappeRequest<T>(`/api/resource/${encodeURIComponent(doctype)}${qs}`, { method: 'GET' })
  },
}
