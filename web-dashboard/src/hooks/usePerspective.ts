import { useEffect, useMemo } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { getNavItemsFor, type NavItemDef } from '@/layouts/AppNavbar/nav.registry'
import type { Perspective } from '@/types/perspective.types'
import { ADMIN_ROLES } from '@/types/perspective.types'

const EMPTY_ROLES: readonly string[] = Object.freeze([])
const PERSPECTIVE_PRIORITY: readonly Perspective[] = ['admin', 'saya']

function hasAny(userRoles: readonly string[], roles: readonly string[]): boolean {
  return roles.some((r) => userRoles.includes(r))
}

export function useAvailablePerspectives(): Perspective[] {
  const roles = useAuthStore((s) => s.user?.roles ?? EMPTY_ROLES)
  return useMemo(() => {
    const result: Perspective[] = ['saya']
    if (hasAny(roles, ADMIN_ROLES)) result.unshift('admin')
    return result
  }, [roles])
}

export function useNavItems(): NavItemDef[] {
  const perspective = useUiStore((s) => s.perspective)
  const roles = useAuthStore((s) => s.user?.roles ?? EMPTY_ROLES)
  return useMemo(() => getNavItemsFor(perspective, roles), [perspective, roles])
}

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
