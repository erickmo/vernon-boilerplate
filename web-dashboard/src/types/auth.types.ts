// ─── User roles ───────────────────────────────────────────────────────────────
// Mapped from Frappe roles at login.
//
// Frappe role → app role:
//   Administrator OR "System Manager" → 'superuser'
//   (anything else)                  → 'user'

export type UserRole =
  | 'superuser'    // Frappe Administrator / System Manager — accesses /su/* dashboard
  | 'tenant_owner' // manages company groups (yayasan level)
  | 'user'         // any other Frappe role
  | string

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  /** Primary display role — used for multi-tenant system routing (superuser, tenant_owner, etc.) */
  role: UserRole
  /** All Frappe roles assigned to this user — use this for feature/nav access checks */
  roles: string[]
  /** Fine-grained permission strings (e.g. '*' for superadmin) */
  permissions: string[]
}

// ─── Multi-tenant types ───────────────────────────────────────────────────────
// Always defined — just unused (null) in single-tenant mode.

export type InstitutionType = 'sekolah' | 'koperasi'

export interface Lembaga {
  name: string
  nama: string
  jenjang: string
}

export interface Company {
  id: string
  code: string
  name: string
  logo?: string
  type?: InstitutionType
  lembaga?: Lembaga[]
  groupId?: string
}

export interface CompanyGroup {
  id: string
  name: string
  logo?: string
  companies: Company[]
}

// ─── Auth request/response ────────────────────────────────────────────────────

export interface LoginRequest {
  usr: string
  pwd: string
  remember?: boolean
}

export interface LoginResponse {
  token: string | null
  refreshToken: string | null
  user: UserProfile
  // Multi-tenant only — omit or pass empty array in single-tenant
  companyGroups?: CompanyGroup[]
}

// ─── Raw API response types (match your backend) ─────────────────────────────

export interface ApiLoginResult {
  access_token: string
  refresh_token: string
  expires_at: number
  user_id: string
  name: string
  email: string
  role: string
}
