import type { Company, CompanyGroup, LoginRequest, LoginResponse, UserProfile } from '@/types/auth.types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

interface FrappeLoginResult {
  full_name: string
  message: string
  home_page: string
}

interface FrappeLembaga {
  name: string
  nama: string
  jenjang: string
}

interface FrappeInstitution {
  name: string
  display_name: string
  type: 'sekolah' | 'koperasi'
  logo: string
  lembaga: FrappeLembaga[]
}

interface FrappeTenantGroup {
  id: string
  name: string
  logo: string
  institutions: FrappeInstitution[]
}

interface FrappeUserDoc {
  name: string
  full_name: string
  email: string
  user_image?: string
  roles?: Array<{ role: string }>
}

async function fetchFrappeJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { credentials: 'include' })
  if (!res.ok) throw new Error(`${res.status} ${path}`)
  const json = await res.json() as Record<string, unknown>
  return (json['message'] ?? json) as T
}

export const authService = {
  login: async (body: LoginRequest): Promise<LoginResponse> => {
    const params = new URLSearchParams({
      usr: body.usr,
      pwd: body.pwd,
      ...(body.remember ? { remember: '1' } : {}),
    })

    const res = await fetch(`${BASE_URL}/api/method/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({})) as Record<string, unknown>
      const raw = json['_server_messages']
      let msg = 'Username atau kata sandi salah'
      if (typeof raw === 'string') {
        try {
          const first = JSON.parse(JSON.parse(raw)[0] as string) as { message?: string }
          if (first.message) msg = first.message
        } catch { /* use default */ }
      }
      throw Object.assign(new Error(msg), { status: res.status, message: msg })
    }

    const loginResult = await res.json() as FrappeLoginResult

    // Get logged-in username
    const loggedUser = await fetchFrappeJson<string>('/api/method/frappe.auth.get_logged_user')

    // Get user profile doc
    const userDoc = await fetchFrappeJson<FrappeUserDoc>(
      `/api/resource/User/${encodeURIComponent(loggedUser)}?fields=["name","full_name","email","user_image","roles"]`
    )

    const topRole = userDoc.roles?.[0]?.role?.toLowerCase() ?? 'user'

    const user: UserProfile = {
      id: userDoc.name,
      name: userDoc.full_name || loginResult.full_name,
      email: userDoc.email,
      avatar: userDoc.user_image ?? undefined,
      role: topRole,
      permissions: [],
    }

    const tenantGroups = await fetchFrappeJson<FrappeTenantGroup[]>(
      '/api/method/sekolahpro.pengaturan.api.sekolah.get_user_institutions'
    ).catch(() => [] as FrappeTenantGroup[])

    const companyGroups: CompanyGroup[] = tenantGroups.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      logo: tenant.logo || undefined,
      companies: tenant.institutions.map((inst): Company => ({
        id: inst.name,
        code: inst.name,
        name: inst.display_name,
        logo: inst.logo || undefined,
        type: inst.type,
        lembaga: inst.lembaga,
        groupId: tenant.id,
      })),
    }))

    return { token: '', refreshToken: '', user, companyGroups }
  },

  logout: async (): Promise<void> => {
    await fetch(`${BASE_URL}/api/method/logout`, {
      method: 'GET',
      credentials: 'include',
    })
  },

  me: async (): Promise<UserProfile> => {
    const loggedUser = await fetchFrappeJson<string>('/api/method/frappe.auth.get_logged_user')
    const userDoc = await fetchFrappeJson<FrappeUserDoc>(
      `/api/resource/User/${encodeURIComponent(loggedUser)}?fields=["name","full_name","email","user_image","roles"]`
    )
    const topRole = userDoc.roles?.[0]?.role?.toLowerCase() ?? 'user'
    return {
      id: userDoc.name,
      name: userDoc.full_name,
      email: userDoc.email,
      avatar: userDoc.user_image ?? undefined,
      role: topRole,
      permissions: [],
    }
  },
}
