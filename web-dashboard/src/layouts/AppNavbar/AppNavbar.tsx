import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown, LogOut,
  CheckCircle, AlertCircle, AlertTriangle, Info,
  Building2, Shield, Globe, Settings, LayoutDashboard, Users,
  GraduationCap, BookOpen, Library,
  Wallet, CreditCard, Heart, Receipt, BarChart3, BadgeCheck, ClipboardCheck,
  Menu,
} from 'lucide-react'
import { AppDrawer } from './AppDrawer'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationStore } from '@/stores/notification.store'
import { useUiStore } from '@/stores/ui.store'
import { resolveNotificationTarget } from '@/services/notification.links'
import type { NotificationItem } from '@/stores/notification.store'
import { getInitials, formatRelative } from '@/utils/format'
import { appConfig } from '@/config/app.config'
import { cn } from '@/utils/cn'
import type { AppContext } from '@/layouts/AppShell/AppShell'
import { useNavItems } from '@/hooks/usePerspective'
import { PerspectiveSwitcher } from './PerspectiveSwitcher'
import styles from './AppNavbar.module.css'

// ─── Nav item definitions per context ────────────────────────────────────────

const NAV_ITEMS_DEFAULT = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: 'dashboard' },
]

const NAV_ITEMS_SUPERUSER = [
  { key: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard, path: 'dashboard' },
  { key: 'tenants',   label: 'Tenants',    icon: Globe,           path: 'tenants' },
  { key: 'companies', label: 'Perusahaan', icon: Building2,       path: 'companies' },
]

const NAV_ITEMS_HQ = [
  { key: 'dashboard', label: 'HQ Dashboard', icon: LayoutDashboard, path: 'dashboard' },
  { key: 'users',     label: 'Pengguna',     icon: Users,           path: 'users' },
]

const NAV_ITEMS_COMPANY = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: 'dashboard' },
  { key: 'users',     label: 'Pengguna',  icon: Users,            path: 'users' },
]

const NAV_ITEMS_SEKOLAH = [
  { key: 'dashboard',      label: 'Dashboard',      icon: LayoutDashboard, path: 'dashboard' },
  { key: 'siswa',          label: 'Siswa',           icon: GraduationCap,   path: 'siswa' },
  { key: 'akademik',       label: 'Akademik',        icon: BookOpen,        path: 'akademik' },
  { key: 'perpustakaan',   label: 'Perpustakaan',    icon: Library,         path: 'perpustakaan' },
  { key: 'pengaturan',     label: 'Pengaturan',      icon: Settings,        path: 'pengaturan' },
]

const NAV_ITEMS_KOPERASI = [
  { key: 'dashboard',      label: 'Dashboard',       icon: LayoutDashboard, path: 'dashboard' },
  { key: 'persetujuan',    label: 'Persetujuan',     icon: ClipboardCheck,  path: 'persetujuan' },
  { key: 'teller',         label: 'Teller',          icon: Receipt,         path: 'teller' },
  { key: 'anggota',        label: 'Anggota',         icon: Users,           path: 'anggota' },
  { key: 'simpanan',       label: 'Simpanan',        icon: Wallet,          path: 'simpanan' },
  { key: 'pembiayaan',     label: 'Pembiayaan',      icon: CreditCard,      path: 'pembiayaan' },
  { key: 'kartu',          label: 'Kartu',           icon: BadgeCheck,      path: 'kartu' },
  { key: 'zis',            label: 'ZIS & Wakaf',     icon: Heart,           path: 'zis' },
  { key: 'kas-teller',     label: 'Kas Teller',      icon: Receipt,         path: 'kas-teller' },
  { key: 'laporan',        label: 'Laporan',         icon: BarChart3,       path: 'laporan' },
  { key: 'pengaturan',     label: 'Pengaturan',      icon: Settings,        path: 'pengaturan' },
]

const NAV_ITEMS_BY_CONTEXT = {
  default: NAV_ITEMS_DEFAULT,
  superuser: NAV_ITEMS_SUPERUSER,
  hq: NAV_ITEMS_HQ,
  company: NAV_ITEMS_COMPANY,
  sekolah: NAV_ITEMS_SEKOLAH,
  koperasi: NAV_ITEMS_KOPERASI,
} as const

const BASE_PATH_BY_CONTEXT = {
  default: '',
  superuser: '/su',
  hq: '/g',
  company: '', // resolved dynamically from selectedCompany.code
  sekolah: '/sekolah',
  koperasi: '/koperasi',
} as const

// ─── Notification icons ───────────────────────────────────────────────────────

const NOTIF_ICONS = {
  success: <CheckCircle size={14} />,
  error: <AlertCircle size={14} />,
  warning: <AlertTriangle size={14} />,
  info: <Info size={14} />,
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AppNavbarProps {
  context?: AppContext
}

export function AppNavbar({ context = 'default' }: AppNavbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, selectedCompany, selectedGroup, logout } = useAuthStore()
  const { items: notifications, unreadCount, markAllRead, markRead } = useNotificationStore()
  const setPerspective = useUiStore((s) => s.setPerspective)
  const currentPerspective = useUiStore((s) => s.perspective)
  const setDrawerOpen = useUiStore((s) => s.setDrawerOpen)

  const [showNotif, setShowNotif] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const isVtContext = context === 'default'
  const vtNavItems = useNavItems()
  const navItems = isVtContext ? vtNavItems : NAV_ITEMS_BY_CONTEXT[context]
  const basePath = context === 'company'
    ? `/c/${selectedCompany?.code ?? ''}`
    : BASE_PATH_BY_CONTEXT[context]

  const isActive = (path: string) => {
    const full = basePath ? `${basePath}/${path}` : `/${path}`
    if (path === 'dashboard' && basePath && location.pathname === basePath) return true
    return location.pathname === full || location.pathname.startsWith(`${full}/`)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  function handleNotificationClick(n: NotificationItem) {
    markRead(n.id)
    setShowNotif(false)
    const target = resolveNotificationTarget(n)
    if (!target) return
    if (target.perspective && target.perspective !== currentPerspective) {
      setPerspective(target.perspective)
    }
    navigate(target.link)
  }

  // Workspace label for multi-tenant company switcher
  const workspaceLabel = context === 'hq'
    ? selectedGroup?.name
    : context === 'company'
      ? selectedCompany?.name
      : null

  return (
    <>
    <nav className={cn(
      styles.navbar,
      context === 'superuser' && styles.navbarSuperuser,
      context === 'hq' && styles.navbarHq,
      context === 'sekolah' && styles.navbarSekolah,
      context === 'koperasi' && styles.navbarKoperasi,
    )}>
      <button
        type="button"
        className={styles.hamburger}
        onClick={() => setDrawerOpen(true)}
        aria-label="Buka menu"
      >
        <Menu size={22} />
      </button>
      {/* Logo */}
      <Link to={basePath ? `${basePath}/dashboard` : '/dashboard'} className={styles.logo}>
        {context === 'superuser' && <Shield size={16} className={styles.logoContextIcon} />}
        {context === 'hq' && <Globe size={16} className={styles.logoContextIcon} />}
        {context === 'sekolah' && <GraduationCap size={16} className={styles.logoContextIcon} />}
        {context === 'koperasi' && <Wallet size={16} className={styles.logoContextIcon} />}
        {(context === 'default' || context === 'company') && (
          <span className={styles.logoIcon}>{appConfig.appName[0]}</span>
        )}
        <span className={styles.logoText}>{appConfig.appName}</span>
      </Link>

      {isVtContext && <PerspectiveSwitcher />}

      {/* Main nav */}
      <ul className={styles.navList}>
        {navItems.map((item) => (
          <li key={item.key}>
            <Link
              to={`${basePath}/${item.path}`}
              className={cn(styles.navItem, isActive(item.path) && styles.navItemActive)}
            >
              <item.icon size={16} />
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Right zone */}
      <div className={styles.right}>
        {/* Company / workspace switcher (multi-tenant only) */}
        {appConfig.isMultiTenant && workspaceLabel && (
          <Link to="/choose-company" className={styles.workspaceBtn}>
            <Building2 size={14} />
            <span className={styles.workspaceName}>{workspaceLabel}</span>
            <ChevronDown size={12} />
          </Link>
        )}

        {/* Notifications */}
        <div className={styles.iconWrap} ref={notifRef}>
          <button
            className={styles.iconBtn}
            onClick={() => setShowNotif(!showNotif)}
            aria-label="Notifikasi"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
          {showNotif && (
            <div className={styles.notifDropdown}>
              <div className={styles.notifHeader}>
                <span>Notifikasi</span>
                {unreadCount > 0 && (
                  <button className={styles.markAllBtn} onClick={markAllRead}>
                    Tandai semua dibaca
                  </button>
                )}
              </div>
              <div className={styles.notifList}>
                {notifications.length === 0 && (
                  <p className={styles.notifEmpty}>Tidak ada notifikasi</p>
                )}
                {notifications.slice(0, 6).map((n) => (
                  <button
                    key={n.id}
                    className={cn(styles.notifItem, !n.isRead && styles.notifUnread)}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <span className={cn(styles.notifIcon, styles[`notifIcon_${n.type}`])}>
                      {NOTIF_ICONS[n.type]}
                    </span>
                    <div className={styles.notifContent}>
                      <span className={styles.notifTitle}>{n.title}</span>
                      <span className={styles.notifMessage}>{n.message}</span>
                      <span className={styles.notifTime}>{formatRelative(n.createdAt)}</span>
                    </div>
                    {!n.isRead && <span className={styles.unreadDot} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className={styles.iconWrap} ref={profileRef}>
          <button className={styles.avatarBtn} onClick={() => setShowProfile(!showProfile)}>
            <span className={styles.avatar}>{getInitials(user?.name ?? 'U')}</span>
            <ChevronDown size={12} className={styles.avatarChevron} />
          </button>
          {showProfile && (
            <div className={styles.profileDropdown}>
              <div className={styles.profileInfo}>
                <span className={styles.profileAvatar}>{getInitials(user?.name ?? 'U')}</span>
                <div>
                  <p className={styles.profileName}>{user?.name}</p>
                  <p className={styles.profileEmail}>{user?.email}</p>
                  {(user?.roles ?? [user?.role]).filter(Boolean).map((r) => (
                    <span key={r} className={styles.roleBadge}>{r}</span>
                  ))}
                </div>
              </div>
              <hr className={styles.divider} />
              <Link
                to={`${basePath}/profile`}
                className={styles.dropdownItem}
                onClick={() => setShowProfile(false)}
              >
                <Settings size={14} />
                Profil Saya
              </Link>
              <Link
                to={`${basePath}/change-password`}
                className={styles.dropdownItem}
                onClick={() => setShowProfile(false)}
              >
                <Shield size={14} />
                Ganti Password
              </Link>
              <button className={cn(styles.dropdownItem, styles.logoutItem)} onClick={handleLogout}>
                <LogOut size={14} />
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
    <AppDrawer />
    </>
  )
}
