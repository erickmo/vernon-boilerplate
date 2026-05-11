import { useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { X, Settings, Shield, LogOut } from 'lucide-react'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { useNavItems } from '@/hooks/usePerspective'
import { PerspectiveSwitcher } from './PerspectiveSwitcher'
import { getInitials } from '@/utils/format'
import { cn } from '@/utils/cn'
import styles from './AppDrawer.module.css'

export function AppDrawer() {
  const open = useUiStore((s) => s.drawerOpen)
  const setOpen = useUiStore((s) => s.setDrawerOpen)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navItems = useNavItems()
  const location = useLocation()
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)
  const lastFocused = useRef<HTMLElement | null>(null)
  const pathRef = useRef(location.pathname)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  useEffect(() => {
    if (!open) return
    lastFocused.current = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const first = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    first?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      lastFocused.current?.focus()
    }
  }, [open])

  useEffect(() => {
    if (open && location.pathname !== pathRef.current) {
      setOpen(false)
    }
    pathRef.current = location.pathname
  }, [open, location.pathname, setOpen])

  if (!open) return null

  function handleLogout() {
    setOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <>
      <div
        className={styles.backdrop}
        data-testid="drawer-backdrop"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Menu navigasi"
      >
        <header className={styles.header}>
          <span className={styles.avatar}>{getInitials(user?.name ?? 'U')}</span>
          <div className={styles.headerText}>
            <p className={styles.userName}>{user?.name ?? 'Pengguna'}</p>
            <p className={styles.userEmail}>{user?.email}</p>
          </div>
          <button
            className={styles.closeBtn}
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
            type="button"
          >
            <X size={20} />
          </button>
        </header>

        <div className={styles.switcherWrap}>
          <PerspectiveSwitcher />
        </div>

        <nav className={styles.nav} aria-label="Navigasi utama">
          {navItems.map((item) => {
            const Icon = item.icon
            const active =
              location.pathname === `/${item.path}` ||
              location.pathname.startsWith(`/${item.path}/`)
            return (
              <Link
                key={item.key}
                to={`/${item.path}`}
                className={cn(styles.navItem, active && styles.navItemActive)}
                onClick={() => setOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <hr className={styles.divider} />

        <div className={styles.footer}>
          <Link to="/profile" className={styles.footerItem} onClick={() => setOpen(false)}>
            <Settings size={16} /> Profil Saya
          </Link>
          <Link to="/change-password" className={styles.footerItem} onClick={() => setOpen(false)}>
            <Shield size={16} /> Ganti Password
          </Link>
          <button
            type="button"
            className={cn(styles.footerItem, styles.logout)}
            onClick={handleLogout}
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </aside>
    </>
  )
}
