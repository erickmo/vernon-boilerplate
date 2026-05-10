import { useNavigate } from 'react-router-dom'
import { LogOut, Building2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { appConfig } from '@/config/app.config'
import type { Company, CompanyGroup } from '@/types/auth.types'
import styles from './ChooseCompanyPage.module.css'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

function getLogoSrc(logo?: string): string | undefined {
  if (!logo) return undefined
  if (logo.startsWith('http')) return logo
  return `${BASE_URL}${logo}`
}

function InstitutionAvatar({ company }: { company: Company }) {
  const src = getLogoSrc(company.logo)
  if (src) {
    return (
      <div className={styles.avatar}>
        <img src={src} alt={company.name} className={styles.avatarImg} />
      </div>
    )
  }
  const initials = company.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
  return <div className={styles.avatar}>{initials}</div>
}

function SkeletonCard() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonAvatar} />
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonLine} />
    </div>
  )
}

function InstitutionCard({
  company,
  group,
  onSelect,
}: {
  company: Company
  group: CompanyGroup
  onSelect: (group: CompanyGroup, company: Company) => void
}) {
  return (
    <button
      className={styles.card}
      onClick={() => onSelect(group, company)}
      type="button"
    >
      <InstitutionAvatar company={company} />
      <div className={styles.cardBody}>
        <span className={styles.cardName}>{company.name}</span>
        {company.npsn && (
          <span className={styles.cardNpsn}>NPSN: {company.npsn}</span>
        )}
        {((company.jenis ?? '') !== '' || (company.modules?.length ?? 0) > 0) && (
          <div className={styles.badges}>
            {company.jenis && (
              <span className={styles.badge}>{company.jenis}</span>
            )}
            {company.modules?.map((mod) => (
              <span key={mod} className={styles.badge}>{mod}</span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

export default function ChooseCompanyPage() {
  const navigate = useNavigate()
  const { user, availableGroups, selectGroup, selectCompany, logout } = useAuthStore()

  function handleSelect(group: CompanyGroup, company: Company) {
    selectGroup(group)
    selectCompany(company)
    navigate(`/c/${company.code}/dashboard`, { replace: true })
  }

  async function handleLogout() {
    await authService.logout().catch(() => {})
    logout()
    navigate('/login', { replace: true })
  }

  const allCompanies = availableGroups.flatMap((g) =>
    g.companies.map((c) => ({ group: g, company: c }))
  )

  const isLoading = false

  return (
    <div className={styles.root}>
      <div className={styles.orb1} aria-hidden="true" />
      <div className={styles.orb2} aria-hidden="true" />

      {/* Top-right user bar */}
      <div className={styles.topBar}>
        {user?.name && (
          <span className={styles.userName}>{user.name}</span>
        )}
        <button
          type="button"
          className={styles.logoutBtn}
          onClick={() => { void handleLogout() }}
        >
          <LogOut size={14} />
          Keluar
        </button>
      </div>

      <div className={styles.center}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoWrap}>
            {appConfig.appLogo ? (
              <img src={appConfig.appLogo} alt={appConfig.appName} style={{ height: 32 }} />
            ) : (
              <>
                <div className={styles.logoIcon}>
                  <Building2 size={18} />
                </div>
                <span className={styles.logoName}>{appConfig.appName}</span>
              </>
            )}
          </div>
          <h1 className={styles.heading}>Pilih Institusi</h1>
          <p className={styles.subheading}>
            {user?.name
              ? `Selamat datang, ${user.name}. Pilih institusi untuk melanjutkan.`
              : 'Pilih institusi yang ingin Anda kelola.'}
          </p>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className={styles.grid}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : allCompanies.length === 0 ? (
          <div className={styles.empty}>
            <Building2 size={48} className={styles.emptyIcon} />
            <p className={styles.emptyText}>
              Tidak ada institusi yang tersedia untuk akun Anda.
              Hubungi administrator.
            </p>
          </div>
        ) : (
          <div className={styles.grid}>
            {allCompanies.map(({ group, company }) => (
              <InstitutionCard
                key={company.id}
                company={company}
                group={group}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
