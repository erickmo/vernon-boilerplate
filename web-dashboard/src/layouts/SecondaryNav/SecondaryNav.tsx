import { Link, useLocation } from 'react-router-dom'
import { Activity, FileText, LayoutDashboard, ShieldCheck, UserCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { cn } from '@/utils/cn'
import type { AppContext } from '@/layouts/AppShell/AppShell'
import styles from './SecondaryNav.module.css'

interface SecondaryNavProps {
  context?: AppContext
}

const CONTEXT_LABEL: Record<AppContext, string> = {
  default: 'Workspace',
  superuser: 'Platform',
  hq: 'HQ',
  company: 'Company',
  sekolah: 'Sekolah',
  koperasi: 'Koperasi',
}

function getBasePath(context: AppContext, companyCode?: string) {
  if (context === 'superuser') return '/su'
  if (context === 'hq') return '/g'
  if (context === 'company') return `/c/${companyCode ?? ''}`
  return ''
}

function isNavItemActive(currentPath: string, itemPath: string) {
  if (itemPath.endsWith('/dashboard') || itemPath === '/dashboard') {
    const basePath = itemPath.replace(/\/dashboard$/, '') || '/'
    return currentPath === itemPath || currentPath === basePath
  }

  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`)
}

export function SecondaryNav({ context = 'default' }: SecondaryNavProps) {
  const location = useLocation()
  const selectedCompany = useAuthStore((s) => s.selectedCompany)
  const basePath = getBasePath(context, selectedCompany?.code)

  const items = [
    { label: 'Overview', path: `${basePath}/dashboard`, icon: LayoutDashboard },
    { label: 'Examples', path: `${basePath}/examples`, icon: FileText },
    { label: 'Audit log', path: `${basePath}/audit-log`, icon: Activity },
    { label: 'Profile', path: `${basePath}/profile`, icon: UserCircle },
    { label: 'Security', path: `${basePath}/change-password`, icon: ShieldCheck },
  ]

  return (
    <nav className={styles.nav2} aria-label="Secondary navigation">
      <div className={styles.inner}>
        <span className={styles.contextLabel}>{CONTEXT_LABEL[context]}</span>
        <div className={styles.links}>
          {items.map((item) => {
            const isActive = isNavItemActive(location.pathname, item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(styles.link, isActive && styles.linkActive)}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon size={15} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
