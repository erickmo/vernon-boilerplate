import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Building2, GraduationCap, Landmark, Plus, X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/services/auth.service'
import type { CreateInstitutionPayload, OrganisasiOption } from '@/services/auth.service'
import { appConfig } from '@/config/app.config'
import type { Company, CompanyGroup, InstitutionType } from '@/types/auth.types'
import styles from './ChooseCompanyPage.module.css'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function getLogoSrc(logo?: string): string | undefined {
  if (!logo) return undefined
  if (logo.startsWith('http')) return logo
  return `${BASE_URL}${logo}`
}

function isAdmin(user: { id?: string; name?: string; role: string } | null): boolean {
  if (!user) return false
  return (
    user.id === 'Administrator' ||
    user.name === 'Administrator' ||
    user.role === 'system manager' ||
    user.role === 'administrator'
  )
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

// ─── Create institution modal ─────────────────────────────────────────────────

function toKode(nama: string): string {
  return nama
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 20)
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [type, setType] = useState<InstitutionType>('sekolah')
  const [nama, setNama] = useState('')
  const [kode, setKode] = useState('')
  const [kodeManual, setKodeManual] = useState(false)
  const [orgList, setOrgList] = useState<OrganisasiOption[]>([])
  const [orgId, setOrgId] = useState('')
  const [newOrgNama, setNewOrgNama] = useState('')
  const [isNewOrg, setIsNewOrg] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    authService.fetchOrganisasi().then((orgs) => {
      setOrgList(orgs)
      if (orgs.length > 0) setOrgId(orgs[0].name)
      else setIsNewOrg(true)
    }).catch(() => setIsNewOrg(true))
  }, [])

  function handleNamaChange(v: string) {
    setNama(v)
    if (!kodeManual) setKode(toKode(v))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nama.trim()) { setError('Nama wajib diisi'); return }
    if (type === 'koperasi' && !kode.trim()) { setError('Kode wajib diisi'); return }
    if (!isNewOrg && !orgId) { setError('Pilih organisasi'); return }
    if (isNewOrg && !newOrgNama.trim()) { setError('Nama organisasi wajib diisi'); return }

    setSaving(true)
    setError('')
    try {
      let resolvedOrgId = orgId
      if (isNewOrg) {
        const created = await authService.createOrganisasi(newOrgNama.trim())
        resolvedOrgId = created.name
      }
      const payload: CreateInstitutionPayload = {
        type,
        nama: nama.trim(),
        kode: kode.trim() || toKode(nama.trim()),
        organisasi: resolvedOrgId,
      }
      await authService.createInstitution(payload)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat institusi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-title"
      >
        <div className={styles.modalHeader}>
          <h2 id="create-title" className={styles.modalTitle}>Tambah Institusi</h2>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Tutup">
            <X size={16} />
          </button>
        </div>

        {/* Type toggle */}
        <div className={styles.typeToggle}>
          <button
            type="button"
            className={`${styles.typeBtn} ${type === 'sekolah' ? styles.typeBtnActive : ''}`}
            onClick={() => setType('sekolah')}
          >
            <GraduationCap size={15} />
            Sekolah
          </button>
          <button
            type="button"
            className={`${styles.typeBtn} ${type === 'koperasi' ? styles.typeBtnActiveKop : ''}`}
            onClick={() => setType('koperasi')}
          >
            <Landmark size={15} />
            Koperasi
          </button>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e) }} className={styles.modalForm}>
          {/* Nama */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Nama {type === 'sekolah' ? 'Sekolah' : 'Koperasi'}</label>
            <input
              className={styles.formInput}
              type="text"
              value={nama}
              onChange={(e) => handleNamaChange(e.target.value)}
              placeholder={type === 'sekolah' ? 'SDN Maju Jaya' : 'Koperasi Al-Falah'}
              required
            />
          </div>

          {/* Kode */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>
              Kode
              <span className={styles.formLabelHint}>(ID unik, huruf besar & angka)</span>
            </label>
            <input
              className={styles.formInput}
              type="text"
              value={kode}
              onChange={(e) => { setKode(e.target.value.toUpperCase()); setKodeManual(true) }}
              placeholder="SDN-MAJU-JAYA"
              required={type === 'koperasi'}
            />
          </div>

          {/* Organisasi */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Organisasi / Yayasan</label>
            {!isNewOrg && orgList.length > 0 ? (
              <div className={styles.orgRow}>
                <select
                  className={styles.formSelect}
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value)}
                >
                  {orgList.map((o) => (
                    <option key={o.name} value={o.name}>{o.nama}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.orgNewBtn}
                  onClick={() => { setIsNewOrg(true); setOrgId('') }}
                >
                  + Baru
                </button>
              </div>
            ) : (
              <div className={styles.orgRow}>
                <input
                  className={styles.formInput}
                  type="text"
                  value={newOrgNama}
                  onChange={(e) => setNewOrgNama(e.target.value)}
                  placeholder="Nama yayasan / organisasi"
                  required
                />
                {orgList.length > 0 && (
                  <button
                    type="button"
                    className={styles.orgNewBtn}
                    onClick={() => { setIsNewOrg(false); setOrgId(orgList[0].name) }}
                  >
                    Pilih
                  </button>
                )}
              </div>
            )}
          </div>

          {error && <p className={styles.formError}>{error}</p>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={saving}
          >
            {saving ? <span className={styles.spinner} /> : 'Buat Institusi'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChooseCompanyPage() {
  const navigate = useNavigate()
  const { user, availableGroups, selectGroup, selectCompany, logout, setAvailableGroups } = useAuthStore()

  const [isLoading, setIsLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  const hasAny = availableGroups.some((g) => g.companies.length > 0)
  const showTenantLabels = availableGroups.length > 1
  const canCreate = isAdmin(user)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const groups = await authService.fetchInstitutions()
      setAvailableGroups(groups)
    } finally {
      setIsLoading(false)
    }
  }, [setAvailableGroups])

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

  async function handleCreated() {
    setShowCreate(false)
    await refresh()
  }

  return (
    <div className={styles.root}>
      <div className={styles.orb1} aria-hidden="true" />
      <div className={styles.orb2} aria-hidden="true" />

      {/* Top-right user bar */}
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
        {/* Header */}
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

        {/* Content */}
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
              {canCreate
                ? 'Belum ada institusi. Buat institusi pertama Anda.'
                : 'Tidak ada institusi yang tersedia. Hubungi administrator.'}
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

        {/* Admin: create button */}
        {canCreate && (
          <button
            type="button"
            className={styles.createBtn}
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} />
            Tambah Institusi
          </button>
        )}
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { void handleCreated() }}
        />
      )}
    </div>
  )
}
