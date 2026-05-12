import { useAuthStore } from '@/stores/auth.store'
import { resolveCapabilities } from '@/config/role-config'

export function usePermission() {
  const roles = useAuthStore((s) => s.user?.roles ?? [])
  const caps = resolveCapabilities(roles)

  return {
    caps,
    hasRole: (role: string | string[]): boolean => {
      const required = Array.isArray(role) ? role : [role]
      return required.some((r) => roles.includes(r))
    },
  }
}
