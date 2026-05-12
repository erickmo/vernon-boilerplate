export type Perspective = 'saya' | 'admin'

export const ADMIN_ROLES = ['Administrator', 'System Manager'] as const

export const ALL_PERSPECTIVES: readonly Perspective[] = ['saya', 'admin'] as const

export const DEFAULT_ROUTE_BY_PERSPECTIVE: Record<Perspective, string> = {
  saya: '/dashboard',
  admin: '/dashboard',
}
