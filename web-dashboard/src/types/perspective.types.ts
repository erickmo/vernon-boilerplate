// src/types/perspective.types.ts

export type Perspective = 'saya' | 'tim' | 'admin'

export const VT_LEADER_ROLES = ['VT Leader', 'VT Manager'] as const
export const VT_MANAGER_ROLES = ['VT Manager'] as const
export const ADMIN_ROLES = ['Administrator', 'System Manager'] as const

export const ALL_PERSPECTIVES: readonly Perspective[] = ['saya', 'tim', 'admin'] as const

/** Routes that anchor each perspective when the user switches via the toggle. */
export const DEFAULT_ROUTE_BY_PERSPECTIVE: Record<Perspective, string> = {
  saya: '/my-work',
  tim: '/leader-review',
  admin: '/audit-log',
}
