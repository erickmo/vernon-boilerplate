import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/utils/cn'
import type { AppContext } from '@/layouts/AppShell/AppShell'
import { SUBNAV_CONFIG } from './subnav.config'
import styles from './AppSubNav.module.css'

interface AppSubNavProps {
  context: AppContext
}

export function AppSubNav({ context }: AppSubNavProps) {
  const { pathname } = useLocation()

  const nav1Key = pathname.split('/')[2] ?? ''

  const contextConfig = SUBNAV_CONFIG[context as keyof typeof SUBNAV_CONFIG]
  if (!contextConfig) return null

  const items = contextConfig[nav1Key]
  if (!items || items.length === 0) return null

  function isActive(itemPath: string): boolean {
    if (pathname === itemPath) return true
    const nav1Segment = `/${context}/${nav1Key}`
    if (itemPath === nav1Segment) {
      return pathname === itemPath
    }
    return pathname.startsWith(itemPath)
  }

  return (
    <nav
      className={cn(styles.subnav, (styles as Record<string, string>)[`subnav_${context}`])}
      aria-label="Sub-navigasi"
    >
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.key}>
            <Link
              to={item.path}
              className={cn(styles.item, isActive(item.path) && styles.itemActive)}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
