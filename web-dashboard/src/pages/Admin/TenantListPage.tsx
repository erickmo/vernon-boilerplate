import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Plus, ChevronRight, Search } from 'lucide-react'
import { tenantService } from '@/services/tenant.service'
import type { Tenant, CreateTenantPayload } from '@/types/tenant.types'
import styles from './TenantListPage.module.css'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function getLogoSrc(logo?: string): string | undefined {
  if (!logo) return undefined
  if (logo.startsWith('http')) return logo
  return `${BASE_URL}${logo}`
}

function TenantAvatar({ tenant }: { tenant: Tenant }) {
  const src = getLogoSrc(tenant.logo)
  const initials = tenant.nama.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
  if (src) return <img src={src} alt={tenant.nama} className={styles.avatarImg} />
  return <div className={styles.avatarInitials}>{initials}</div>
}

const JENIS_OPTIONS = ['Yayasan', 'Perusahaan', 'Pemerintah', 'Lainnya']

function CreateTenantModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [nama, setNama] = useState('')
  const [jenis, setJenis] = useState('Yayasan')
  const [email, setEmail] = useState('')
  const [telepon, setTelepon] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nama.trim()) { setError('Nama wajib diisi'); return }
    setSaving(true)
    setError('')
    try {
      const payload: CreateTenantPayload = { nama: nama.trim(), jenis_organisasi: jenis, email, telepon }
      await tenantService.createTenant(payload)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat tenant')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h2 className={styles.modalTitle}>Tambah Tenant / Organisasi</h2>
        <form onSubmit={(e) => { void handleSubmit(e) }} className={styles.modalForm}>
          <label className={styles.label}>Nama <span className={styles.req}>*</span></label>
          <input className={styles.input} value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Yayasan Pendidikan Maju" required />

          <label className={styles.label}>Jenis Organisasi</label>
          <select className={styles.select} value={jenis} onChange={(e) => setJenis(e.target.value)}>
            {JENIS_OPTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>

          <label className={styles.label}>Email</label>
          <input className={styles.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@org.id" />

          <label className={styles.label}>Telepon</label>
          <input className={styles.input} value={telepon} onChange={(e) => setTelepon(e.target.value)} placeholder="021-1234567" />

          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Batal</button>
            <button type="submit" className={styles.submitBtn} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Buat Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TenantListPage() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setTenants(await tenantService.getTenantList()) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const filtered = tenants.filter((t) =>
    t.nama.toLowerCase().includes(search.toLowerCase()) ||
    (t.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tenants</h1>
          <p className={styles.subtitle}>Kelola organisasi yang terdaftar di platform</p>
        </div>
        <button type="button" className={styles.createBtn} onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Tambah Tenant
        </button>
      </div>

      <div className={styles.searchWrap}>
        <Search size={15} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau email..."
        />
      </div>

      {loading ? (
        <div className={styles.skeletonList}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className={styles.skeletonRow} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <Building2 size={40} className={styles.emptyIcon} />
          <p>{search ? 'Tidak ada tenant yang cocok.' : 'Belum ada tenant. Tambahkan yang pertama.'}</p>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((tenant) => (
            <button
              key={tenant.name}
              type="button"
              className={styles.row}
              onClick={() => navigate(`/su/tenants/${encodeURIComponent(tenant.name)}`)}
            >
              <div className={styles.avatar}><TenantAvatar tenant={tenant} /></div>
              <div className={styles.info}>
                <span className={styles.name}>{tenant.nama}</span>
                <span className={styles.meta}>{tenant.jenis_organisasi} · {tenant.email || '—'}</span>
              </div>
              <div className={styles.stats}>
                <span className={styles.statChip}>{tenant.institution_count} institusi</span>
                <span className={styles.statChip}>{tenant.user_count} user</span>
              </div>
              <span className={`${styles.badge} ${tenant.status === 'Aktif' ? styles.badgeAktif : styles.badgeNon}`}>
                {tenant.status}
              </span>
              <ChevronRight size={16} className={styles.chevron} />
            </button>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateTenantModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); void load() }}
        />
      )}
    </div>
  )
}
