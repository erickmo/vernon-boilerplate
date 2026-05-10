import { useNavigate } from 'react-router-dom'
import { LogOut, GraduationCap, Landmark } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { appConfig } from '@/config/app.config'
import styles from './ChooseDashboardPage.module.css'

interface DashboardOption {
  key: 'sekolah' | 'koperasi'
  label: string
  description: string
  path: string
  Icon: React.ComponentType<{ size?: number }>
  colorClass: string
}

const DASHBOARD_OPTIONS: DashboardOption[] = [
  {
    key: 'sekolah',
    label: 'Dashboard Sekolah',
    description: 'Kelola data siswa, guru, akademik, dan perpustakaan.',
    path: '/sekolah/dashboard',
    Icon: GraduationCap,
    colorClass: 'cardSekolah',
  },
  {
    key: 'koperasi',
    label: 'Dashboard Koperasi',
    description: 'Kelola anggota, simpanan, pembiayaan, kartu, dan ZIS.',
    path: '/koperasi/dashboard',
    Icon: Landmark,
    colorClass: 'cardKoperasi',
  },
]

function DashboardCard({ option, onSelect }: { option: DashboardOption; onSelect: (path: string) => void }) {
  return (
    <button
      type="button"
      className={`${styles.card} ${styles[option.colorClass]}`}
      onClick={() => onSelect(option.path)}
    >
      <div className={styles.cardIcon}>
        <option.Icon size={32} />
      </div>
      <div className={styles.cardBody}>
        <span className={styles.cardLabel}>{option.label}</span>
        <span className={styles.cardDesc}>{option.description}</span>
      </div>
    </button>
  )
}

export default function ChooseDashboardPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  function handleSelect(path: string) {
    navigate(path, { replace: true })
  }

  async function handleLogout() {
    await authService.logout().catch(() => {})
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={styles.root}>
      <div className={styles.orb1} aria-hidden="true" />
      <div className={styles.orb2} aria-hidden="true" />
      <div className={styles.topBar}>
        {user?.name && <span className={styles.userName}>{user.name}</span>}
        <button type="button" className={styles.logoutBtn} onClick={() => { void handleLogout() }}>
          <LogOut size={14} />
          Keluar
        </button>
      </div>
      <div className={styles.center}>
        <div className={styles.header}>
          <div className={styles.logoWrap}>
            <div className={styles.logoIcon} />
            <span className={styles.logoName}>{appConfig.appName}</span>
          </div>
          <h1 className={styles.heading}>Pilih Dashboard</h1>
          <p className={styles.subheading}>
            {user?.name
              ? `Selamat datang, ${user.name}. Pilih dashboard untuk melanjutkan.`
              : 'Pilih dashboard yang ingin Anda kelola.'}
          </p>
        </div>
        <div className={styles.grid}>
          {DASHBOARD_OPTIONS.map((option) => (
            <DashboardCard key={option.key} option={option} onSelect={handleSelect} />
          ))}
        </div>
      </div>
    </div>
  )
}
