import { AppApiError } from '@/types/api.types'
import { useAuthStore } from '@/stores/auth.store'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function getCsrfToken(): string {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('csrf_token='))
    ?.split('=')[1] ?? ''
}

function parseFrappeError(body: Record<string, unknown>): string {
  // Frappe wraps messages as stringified JSON in _server_messages
  const raw = body['_server_messages']
  if (typeof raw === 'string') {
    try {
      const msgs = JSON.parse(raw) as Array<{ message?: string } | string>
      const first = msgs[0]
      if (typeof first === 'string') {
        const inner = JSON.parse(first) as { message?: string }
        return inner.message ?? 'Terjadi kesalahan'
      }
      if (typeof first === 'object' && first?.message) return first.message
    } catch {
      // fall through
    }
  }
  if (typeof body['message'] === 'string') return body['message']
  if (typeof body['exc_type'] === 'string') return body['exc_type']
  return 'Terjadi kesalahan'
}

async function request<T>(path: string, config?: RequestInit): Promise<T> {
  const method = (config?.method ?? 'GET').toUpperCase()
  const isFormData = config?.body instanceof FormData
  const headers: Record<string, string> = isFormData
    ? {}
    : { 'Content-Type': 'application/json' }

  if (MUTATION_METHODS.has(method)) {
    const csrf = getCsrfToken()
    if (csrf) headers['X-Frappe-CSRF-Token'] = csrf
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...config,
    credentials: 'include',
    headers: { ...headers, ...config?.headers },
  })

  if (response.status === 401) {
    useAuthStore.getState().logout()
    throw new AppApiError(401, 'Sesi telah berakhir, silakan login kembali')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as Record<string, unknown>
    throw new AppApiError(response.status, parseFrappeError(body))
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  if (!text) return undefined as T

  const json = JSON.parse(text) as Record<string, unknown>
  // Frappe wraps successful responses in { message: <data> }
  return ('message' in json && Object.keys(json).length <= 3
    ? json['message']
    : json) as T
}

// ─── Standard API client ──────────────────────────────────────────────────────

export const apiClient = {
  get: <T>(path: string) =>
    request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),

  postForm: <T>(path: string, body: FormData) =>
    request<T>(path, { method: 'POST', body }),

  download: async (path: string, filename: string) => {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      credentials: 'include',
    })

    if (response.status === 401) {
      useAuthStore.getState().logout()
      throw new AppApiError(401, 'Sesi telah berakhir, silakan login kembali')
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as Record<string, unknown>
      throw new AppApiError(response.status, parseFrappeError(body))
    }

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },
}
