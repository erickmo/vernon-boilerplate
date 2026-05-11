import { useEffect, useMemo } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { getNavItemsFor, type NavItemDef } from '@/layouts/AppNavbar/nav.registry'
import type { Perspective } from '@/types/perspective.types'
import {
  VT_LEADER_ROLES,
  VT_MANAGER_ROLES,
  ADMIN_ROLES,
} from '@/types/perspective.types'

const EMPTY_ROLES: readonly string[] = Object.freeze([])
const PERSPECTIVE_PRIORITY: readonly Perspective[] = ['admin', 'tim', 'saya']

function hasAny(userRoles: readonly string[], roles: readonly string[]): boolean {
  return roles.some((r) => userRoles.includes(r))
}

export function useAvailablePerspectives(): Perspective[] {
  const roles = useAuthStore((s) => s.user?.roles ?? EMPTY_ROLES)
  return useMemo(() => {
    const result: Perspective[] = []
    const isAdminOnly =
      hasAny(roles, ADMIN_ROLES) &&
      !roles.includes('VT Member') &&
      !hasAny(roles, VT_LEADER_ROLES)
    if (!isAdminOnly) result.push('saya')
    if (hasAny(roles, VT_LEADER_ROLES)) result.push('tim')
    if (hasAny(roles, VT_MANAGER_ROLES) || hasAny(roles, ADMIN_ROLES)) result.push('admin')
    return result.length > 0 ? result : ['saya']
  }, [roles])
}

export function useNavItems(): NavItemDef[] {
  const perspective = useUiStore((s) => s.perspective)
  const roles = useAuthStore((s) => s.user?.roles ?? EMPTY_ROLES)
  return useMemo(() => getNavItemsFor(perspective, roles), [perspective, roles])
}

/**
 * Validates the persisted `perspective` against the user's current roles.
 * If invalid, downgrades to the highest available perspective.
 * Mount once near the top of the app (inside AppShell) — it has no UI.
 */
export function useBootstrapPerspective(): void {
  const available = useAvailablePerspectives()
  const perspective = useUiStore((s) => s.perspective)
  const setPerspective = useUiStore((s) => s.setPerspective)

  useEffect(() => {
    if (!available.includes(perspective)) {
      const fallback =
        PERSPECTIVE_PRIORITY.find((p) => available.includes(p)) ?? 'saya'
      setPerspective(fallback)
    }
  }, [available, perspective, setPerspective])
}
