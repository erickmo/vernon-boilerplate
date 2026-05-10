import { useState, useEffect, useCallback } from 'react'
import { GraduationCap, Landmark, Plus, X, RefreshCw, Building2 } from 'lucide-react'
import { authService } from '@/services/auth.service'
import type { CreateInstitutionPayload, OrganisasiOption } from '@/services/auth.service'
import type { CompanyGroup, Company, InstitutionType } from '@/types/auth.types'
import styles from './AdminDashboardPage.module.css'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function getLogoSrc(logo?: string): string | undefined {
  if (!logo) return undefined
  if (logo.startsWith('http')) return logo
  return `${BASE_URL}${logo}`
}

function toKode(nama: string): string {
  return nama
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 20)
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function StatsBar({ groups }: { groups: CompanyGroup[] }) {
  const totalOrgs = groups.length
  const allCompanies = groups.flatMap((g) => g.companies)
  const totalSekolah = allCompanies.filter((c) => c.type === 'sekolah').length
  const totalKoperasi = allCompanies.filter((c) => c.type === 'koperasi').length

  return (
    <div className={styles.statsBar}>
      <div className={styles.statCard}>
        <span className={styles.statNum}>{totalOrgs}</span>
        <span className={styles.statLabel}>Organisasi</span>
      </div>
      <div className={styles.statDivider} />
      <div className={styles.statCard}>
        <span className={styles.statNum}>{totalSekolah}</span>
        <span className={styles.statLabel}>Sekolah</span>
      </div>
      <div className={styles.statDivider} />
      <div className={styles.statCard}>
        <span className={styles.statNum}>{totalKoperasi}</span>
        <span className={styles.statLabel}>Koperasi</span>
      </div>
      <div className={styles.statDivider} />
      <div className={styles.statCard}>
        <span className={styles.statNum}>{allCompanies.length}</span>
        <span className={styles.statLabel}>Total Institusi</span>
      </div>
    </div>
  )
}

// ─── Institution row ──────────────────────────────────────────────────────────

function InstitutionRow({ company }: { company: Company }) {
  const src = getLogoSrc(company.logo)
  const Icon = company.type === 'koperasi' ? Landmark : GraduationCap

  return (
    <div className={styles.row}>
      <div className={`${styles.rowAvatar} ${company.type === 'koperasi' ? styles.rowAvatarKop : styles.rowAvatarSek}`}>
        {src
          ? <img src={src} alt={company.name} className={styles.rowAvatarImg} />
          : <Icon size={16} />}
      </div>
      <div className={styles.rowInfo}>
        <span className={styles.rowName}>{company.name}</span>
        <span className={styles.rowCode}>{company.code}</span>
      </div>
      <span className={`${styles.rowBadge} ${company.type === 'koperasi' ? styles.rowBadgeKop : styles.rowBadgeSek}`}>
        {company.type === 'koperasi' ? 'Koperasi' : 'Sekolah'}
      </span>
      {(company.lembaga?.length ?? 0) > 0 && (
        <div className={styles.rowLembaga}>
          {company.lembaga!.map((l) => (
            <span key={l.name} className={styles.rowLembagaTag}>{l.jenjang}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tenant group ─────────────────────────────────────────────────────────────

function TenantGroup({ group }: { group: CompanyGroup }) {
  return (
    <div className={styles.tenantGroup}>
      <div className={styles.tenantGroupHeader}>
        <Building2 size={14} className={styles.tenantGroupIcon} />
        <span className={styles.tenantGroupName}>{group.name}</span>
        <span className={styles.tenantGroupCount}>{group.companies.length} institusi</span>
      </div>
      <div className={styles.rowList}>
        {group.companies.length === 0 ? (
          <p className={styles.emptyGroup}>Belum ada institusi</p>
        ) : (
          group.companies.map((c) => <InstitutionRow key={c.id} company={c} />)
        )}
      </div>
    </div>
  )
}

// ─── Create modal ─────────────────────────────────────────────────────────────

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
    if (isNewOrg && !newOrgNama.trim()) { setError('Nama organisasi wajib diisi'); return }
    if (!isNewOrg && !orgId) { setError('Pilih organisasi'); return }

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
        aria-labelledby="create-inst-title"
      >
        <div className={styles.modalHeader}>
          <h2 id="create-inst-title" className={styles.modalTitle}>Tambah Institusi</h2>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Tutup">
            <X size={16} />
          </button>
        </div>

        <div className={styles.typeToggle}>
          <button
            type="button"
            className={`${styles.typeBtn} ${type === 'sekolah' ? styles.typeBtnActiveSek : ''}`}
            onClick={() => setType('sekolah')}
          >
            <GraduationCap size={15} /> Sekolah
          </button>
          <button
            type="button"
            className={`${styles.typeBtn} ${type === 'koperasi' ? styles.typeBtnActiveKop : ''}`}
            onClick={() => setType('koperasi')}
          >
            <Landmark size={15} /> Koperasi
          </button>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e) }} className={styles.modalForm}>
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

          <div className={styles.formField}>
            <label className={styles.formLabel}>
              Kode
              <span className={styles.formHint}>(ID unik, huruf besar & angka)</span>
            </label>
            <input
              className={styles.formInput}
              type="text"
              value={kode}
              onChange={(e) => { setKode(e.target.value.toUpperCase()); setKodeManual(true) }}
              placeholder="SDN-MAJU-JAYA"
            />
          </div>

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
                <button type="button" className={styles.orgToggleBtn} onClick={() => { setIsNewOrg(true); setOrgId('') }}>
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
                  <button type="button" className={styles.orgToggleBtn} onClick={() => { setIsNewOrg(false); setOrgId(orgList[0].name) }}>
                    Pilih
                  </button>
                )}
              </div>
            )}
          </div>

          {error && <p className={styles.formError}>{error}</p>}

          <button type="submit" className={styles.submitBtn} disabled={saving}>
            {saving ? <span className={styles.spinner} /> : 'Buat Institusi'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [groups, setGroups] = useState<CompanyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await authService.fetchInstitutions()
      setGroups(result)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleCreated() {
    setShowCreate(false)
    await load()
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Manajemen Institusi</h1>
          <p className={styles.pageSubtitle}>Kelola organisasi, sekolah, dan koperasi</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => { void load() }}
            disabled={loading}
            aria-label="Refresh"
          >
            <RefreshCw size={15} className={loading ? styles.spinning : undefined} />
          </button>
          <button
            type="button"
            className={styles.createBtn}
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} />
            Tambah Institusi
          </button>
        </div>
      </div>

      {!loading && <StatsBar groups={groups} />}

      <div className={styles.content}>
        {loading ? (
          <div className={styles.loadingList}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.skeletonRow} />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className={styles.emptyState}>
            <Building2 size={40} className={styles.emptyIcon} />
            <p>Belum ada institusi. Mulai dengan menambahkan yang pertama.</p>
          </div>
        ) : (
          <div className={styles.groupList}>
            {groups.map((g) => <TenantGroup key={g.id} group={g} />)}
          </div>
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
