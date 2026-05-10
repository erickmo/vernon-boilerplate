import { useNavigate } from 'react-router-dom'
import { LogOut, Building2, GraduationCap, Landmark } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import { appConfig } from '@/config/app.config'
import type { Company, CompanyGroup } from '@/types/auth.types'
import styles from './ChooseCompanyPage.module.css'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function getLogoSrc(logo?: string): string | undefined {
  if (!logo) return undefined
  if (logo.startsWith('http')) return logo
  return `${BASE_URL}${logo}`
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

function InstitutionAvatar({ company }: { company: Company }) {
  const src = getLogoSrc(company.logo)
  if (src) {
    return (
      <div className={styles.avatar}>
        <img src={src} alt={company.name} className={styles.avatarImg} />
      </div>
    )
  }
  const Icon = company.type === 'koperasi' ? Landmark : GraduationCap
  return (
    <div className={`${styles.avatar} ${company.type === 'koperasi' ? styles.avatarKoperasi : styles.avatarSekolah}`}>
      <Icon size={24} />
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonAvatar} />
      <div className={styles.skeletonLine} />
      <div className={styles.skeletonLine} />
    </div>
  )
}

// ─── Institution card ─────────────────────────────────────────────────────────

function InstitutionCard({
  company,
  group,
  onSelect,
}: {
  company: Company
  group: CompanyGroup
  onSelect: (group: CompanyGroup, company: Company) => void
}) {
  const badges = company.type === 'koperasi'
    ? ['Koperasi']
    : (company.lembaga ?? []).map((l) => l.jenjang)

  return (
    <button
      className={`${styles.card} ${company.type === 'koperasi' ? styles.cardKoperasi : ''}`}
      onClick={() => onSelect(group, company)}
      type="button"
    >
      <InstitutionAvatar company={company} />
      <div className={styles.cardBody}>
        <span className={styles.cardName}>{company.name}</span>
        {badges.length > 0 && (
          <div className={styles.badges}>
            {badges.map((b) => (
              <span key={b} className={styles.badge}>{b}</span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

// ─── Tenant section ───────────────────────────────────────────────────────────

function TenantSection({
  group,
  showLabel,
  onSelect,
}: {
  group: CompanyGroup
  showLabel: boolean
  onSelect: (group: CompanyGroup, company: Company) => void
}) {
  return (
    <div className={styles.tenantSection}>
      {showLabel && (
        <div className={styles.tenantHeader}>
          {getLogoSrc(group.logo) && (
            <img src={getLogoSrc(group.logo)} alt={group.name} className={styles.tenantLogo} />
          )}
          <span className={styles.tenantName}>{group.name}</span>
        </div>
      )}
      <div className={styles.grid}>
        {group.companies.map((company) => (
          <InstitutionCard
            key={company.id}
            company={company}
            group={group}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChooseCompanyPage() {
  const navigate = useNavigate()
  const { user, availableGroups, selectGroup, selectCompany, logout } = useAuthStore()

  const isLoading = false
  const hasAny = availableGroups.some((g) => g.companies.length > 0)
  const showTenantLabels = availableGroups.length > 1

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

  return (
    <div className={styles.root}>
      <div className={styles.orb1} aria-hidden="true" />
      <div className={styles.orb2} aria-hidden="true" />

      <div className={styles.topBar}>
        {user?.name && <span className={styles.userName}>{user.name}</span>}
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
        <div className={styles.header}>
          <div className={styles.logoWrap}>
            {appConfig.appLogo ? (
              <img src={appConfig.appLogo} alt={appConfig.appName} style={{ height: 32 }} />
            ) : (
              <>
                <div className={styles.logoIcon}><Building2 size={18} /></div>
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

        {isLoading ? (
          <div className={styles.grid}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : !hasAny ? (
          <div className={styles.empty}>
            <Building2 size={48} className={styles.emptyIcon} />
            <p className={styles.emptyText}>
              Tidak ada institusi yang tersedia untuk akun Anda.
              Hubungi administrator.
            </p>
          </div>
        ) : (
          <div className={styles.tenantList}>
            {availableGroups.map((group) => (
              <TenantSection
                key={group.id}
                group={group}
                showLabel={showTenantLabels}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
