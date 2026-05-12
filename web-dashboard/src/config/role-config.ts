// Maps Frappe role names → app-level capabilities.
// Frappe roles are fetched fresh from frappe.session.user_roles on every login.
// Add new roles here as SekolahPro backend adds them.

export interface RoleCapabilities {
  /** Access /su/* superuser routes */
  isSuperuser: boolean
  /** Manage yayasan/sekolah/jenjang in Institusi page */
  canManageInstitusi: boolean
  /** Manage users and role assignments */
  canManageUsers: boolean
}

const DEFAULT_CAPS: RoleCapabilities = {
  isSuperuser: false,
  canManageInstitusi: false,
  canManageUsers: false,
}

export const ROLE_CAPABILITIES: Record<string, RoleCapabilities> = {
  'Administrator': {
    isSuperuser: true,
    canManageInstitusi: true,
    canManageUsers: true,
  },
  'System Manager': {
    isSuperuser: true,
    canManageInstitusi: true,
    canManageUsers: true,
  },
  'Supervisor': {
    isSuperuser: false,
    canManageInstitusi: true,
    canManageUsers: false,
  },
}

/** Merge capabilities from all roles the user holds. Any true wins. */
export function resolveCapabilities(roles: string[]): RoleCapabilities {
  return roles.reduce<RoleCapabilities>((acc, role) => {
    const caps = ROLE_CAPABILITIES[role] ?? DEFAULT_CAPS
    return {
      isSuperuser: acc.isSuperuser || caps.isSuperuser,
      canManageInstitusi: acc.canManageInstitusi || caps.canManageInstitusi,
      canManageUsers: acc.canManageUsers || caps.canManageUsers,
    }
  }, { ...DEFAULT_CAPS })
}
