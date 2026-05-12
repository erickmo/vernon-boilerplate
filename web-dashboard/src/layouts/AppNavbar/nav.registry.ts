import type { LucideIcon } from 'lucide-react'
import type { Perspective } from '@/types/perspective.types'

export interface NavItemDef {
  key: string
  label: string
  icon: LucideIcon
  /** Route path relative to root, no leading slash. */
  path: string
  perspective: Perspective
  /** Any-of role match. Omit = available to all users in that perspective. */
  requiredRoles?: readonly string[]
}

export const NAV_REGISTRY: readonly NavItemDef[] = [
  // SekolahPro nav items — add per feature here
]

function hasAny(userRoles: readonly string[], required: readonly string[] | undefined): boolean {
  if (!required) return true
  return required.some((r) => userRoles.includes(r))
}

export function getNavItemsFor(
  perspective: Perspective,
  userRoles: readonly string[],
): NavItemDef[] {
  return NAV_REGISTRY.filter(
    (item) => item.perspective === perspective && hasAny(userRoles, item.requiredRoles),
  )
}

export function routeToPerspective(pathname: string): Perspective | null {
  const trimmed = pathname.startsWith('/') ? pathname.slice(1) : pathname
  for (const item of NAV_REGISTRY) {
    if (trimmed === item.path || trimmed.startsWith(`${item.path}/`)) {
      return item.perspective
    }
  }
  return null
}
