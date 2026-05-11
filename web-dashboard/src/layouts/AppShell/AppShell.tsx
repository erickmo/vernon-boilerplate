import { Outlet } from 'react-router-dom'
import { AppNavbar } from '@/layouts/AppNavbar/AppNavbar'
import { AppSubNav } from '@/layouts/AppSubNav/AppSubNav'
import { PerspectiveSync } from '@/layouts/AppNavbar/PerspectiveSync'
import { useBootstrapPerspective } from '@/hooks/usePerspective'
import styles from './AppShell.module.css'

export type AppContext = 'default' | 'superuser' | 'hq' | 'company' | 'sekolah' | 'koperasi'

interface AppShellProps {
  /** Multi-tenant context — controls navbar colour, nav items, and subnav. */
  context?: AppContext
}

export function AppShell({ context = 'default' }: AppShellProps) {
  useBootstrapPerspective()

  return (
    <div className={styles.root}>
      <PerspectiveSync />
      <AppNavbar context={context} />
      <AppSubNav context={context} />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
