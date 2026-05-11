import type { LucideIcon } from 'lucide-react'
import {
  Briefcase,
  BarChart2,
  LayoutDashboard,
  ClipboardCheck,
  ScrollText,
} from 'lucide-react'
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
  { key: 'my-work',          label: 'Kerja Saya',     icon: Briefcase,       path: 'my-work',          perspective: 'saya' },
  { key: 'my-dashboard',     label: 'Dashboard Saya', icon: BarChart2,       path: 'my-dashboard',     perspective: 'saya' },
  { key: 'leader-dashboard', label: 'Dashboard Tim',  icon: LayoutDashboard, path: 'leader-dashboard', perspective: 'tim',   requiredRoles: ['VT Leader', 'VT Manager'] },
  { key: 'leader-review',    label: 'Review Tugas',   icon: ClipboardCheck,  path: 'leader-review',    perspective: 'tim',   requiredRoles: ['VT Leader', 'VT Manager'] },
  { key: 'audit-log',        label: 'Audit Log',      icon: ScrollText,      path: 'audit-log',        perspective: 'admin', requiredRoles: ['VT Manager', 'Administrator', 'System Manager'] },
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

/**
 * Returns the perspective that owns a given route path, or null if the path
 * is not registered. Matches exact paths and sub-paths (e.g. /my-work/123).
 */
export function routeToPerspective(pathname: string): Perspective | null {
  const trimmed = pathname.startsWith('/') ? pathname.slice(1) : pathname
  for (const item of NAV_REGISTRY) {
    if (trimmed === item.path || trimmed.startsWith(`${item.path}/`)) {
      return item.perspective
    }
  }
  return null
}
