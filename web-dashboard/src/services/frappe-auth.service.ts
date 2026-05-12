import { AppApiError } from '@/types/api.types'
import { useAuthStore } from '@/stores/auth.store'
import type { UserProfile } from '@/types/auth.types'
import { resolveCapabilities } from '@/config/role-config'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_FRAPPE_URL ?? ''

interface FrappeLoginResult {
  message: string
  home_page?: string
  full_name?: string
  // Frappe v15 includes csrf_token directly in login response
  csrf_token?: string
}

interface FrappeUserPayload {
  name: string
  full_name: string
  email: string
  user_image?: string
  roles: Array<{ role: string } | string>
}

interface FrappeUserResult {
  data?: FrappeUserPayload
  message?: FrappeUserPayload
}

/** POST /api/method/login — session cookie set by browser, csrf_token in response body */
async function frappeLogin(usr: string, pwd: string): Promise<FrappeLoginResult> {
  const res = await fetch(`${BASE_URL}/api/method/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ usr, pwd }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>
    if (res.status === 401 || res.status === 403) {
      throw new AppApiError(res.status, 'Email atau kata sandi salah')
    }
    throw new AppApiError(res.status, String(body['message'] ?? 'Login gagal'))
  }

  return res.json() as Promise<FrappeLoginResult>
}

/** GET /api/method/frappe.auth.get_logged_user → current user email */
async function fetchCurrentUser(csrfToken: string): Promise<UserProfile> {
  const res = await fetch(`${BASE_URL}/api/method/frappe.auth.get_logged_user`, {
    method: 'GET',
    credentials: 'include',
  })
  if (!res.ok) throw new AppApiError(res.status, 'Gagal mengambil profil pengguna')
  const json = await res.json() as { message: string }
  const email = json.message

  // Fetch user doc with roles
  const rolesRes = await fetch(
    `${BASE_URL}/api/resource/User/${encodeURIComponent(email)}?fields=["full_name","user_image","roles"]`,
    {
      method: 'GET',
      credentials: 'include',
      headers: csrfToken ? { 'X-Frappe-CSRF-Token': csrfToken } : {},
    },
  )

  if (!rolesRes.ok) {
    return { id: email, name: email, email, role: 'user', roles: [], permissions: [] }
  }

  const rolesJson = await rolesRes.json() as FrappeUserResult
  console.debug('[frappe-auth] raw rolesJson keys:', Object.keys(rolesJson))
  console.debug('[frappe-auth] rolesJson:', JSON.stringify(rolesJson).slice(0, 500))
  const userData = rolesJson.data ?? rolesJson.message
  if (!userData) {
    console.warn('[frappe-auth] userData undefined — fallback to user')
    return { id: email, name: email, email, role: 'user', roles: [], permissions: [] }
  }
  const roles: string[] = Array.isArray(userData.roles)
    ? userData.roles.map((r) => (typeof r === 'string' ? r : r.role))
    : []

  console.debug('[frappe-auth] email:', email, 'roles:', roles)

  // Administrator user has empty roles table in Frappe — inject role explicitly
  if (email === 'Administrator' && !roles.includes('Administrator')) {
    roles.push('Administrator')
  }

  const caps = resolveCapabilities(roles)
  const primaryRole = caps.isSuperuser ? 'superuser' : 'user'

  console.debug('[frappe-auth] primaryRole:', primaryRole)
  return {
    id: email,
    name: userData.full_name ?? email,
    email,
    avatar: userData.user_image,
    role: primaryRole,
    roles,
    permissions: [],
  }
}

export const frappeAuthService = {
  login: async (usr: string, pwd: string): Promise<void> => {
    const { login, setCsrfToken } = useAuthStore.getState()

    // 1. Authenticate — csrf_token is in the login response body (Frappe v15)
    const loginResult = await frappeLogin(usr, pwd)
    const csrfToken = loginResult.csrf_token ?? ''
    if (csrfToken) setCsrfToken(csrfToken)

    // 2. Fetch user profile + roles (best-effort — never block login)
    let user: UserProfile
    try {
      console.debug('[frappe-auth] fetchCurrentUser start, csrfToken:', csrfToken ? 'present' : 'empty')
      user = await fetchCurrentUser(csrfToken)
      console.debug('[frappe-auth] fetchCurrentUser done, role:', user.role)
    } catch (err) {
      console.error('[frappe-auth] fetchCurrentUser FAILED:', err)
      user = { id: usr, name: loginResult.full_name ?? usr, email: usr, role: 'user', roles: [], permissions: [] }
    }

    // 3. Commit to auth store
    login({ token: '', refreshToken: '', user })
  },

  logout: async (): Promise<void> => {
    const { csrfToken, logout } = useAuthStore.getState()
    try {
      await fetch(`${BASE_URL}/api/method/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-Frappe-CSRF-Token': csrfToken } : {}),
        },
        credentials: 'include',
      })
    } finally {
      logout()
    }
  },
}
