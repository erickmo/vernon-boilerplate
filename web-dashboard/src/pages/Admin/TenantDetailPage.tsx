import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Building2, Edit, Users, Package, Layers } from 'lucide-react'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { tenantService } from '@/services/tenant.service'
import type { TenantDetail, TenantInstitution, OrgUser, UpdateTenantPayload } from '@/types/tenant.types'
import styles from './TenantDetailPage.module.css'

const JENIS_OPTIONS = ['Yayasan', 'Perusahaan', 'Pemerintah', 'Lainnya']
const ALL_MODULES = ['Akademik', 'Koperasi', 'Perpustakaan', 'Infrastruktur']
const ORG_ROLES = ['Teller', 'Supervisor', 'Pustakawan', 'Kepala Perpustakaan', 'Admin Guru', 'Tata Usaha']

// ─── Info Tab ─────────────────────────────────────────────────────────────────

function InfoTab({ detail, onRefresh }: { detail: TenantDetail; onRefresh: () => void }) {
  const { info } = detail
  const [form, setForm] = useState<UpdateTenantPayload>({
    nama: info.nama,
    jenis_organisasi: info.jenis_organisasi ?? 'Yayasan',
    npwp: info.npwp ?? '',
    telepon: info.telepon ?? '',
    email: info.email ?? '',
    alamat: info.alamat ?? '',
    status: info.status,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function set(field: keyof UpdateTenantPayload, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSuccess(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await tenantService.updateTenant(info.name, form)
      setSuccess(true)
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  async function handleSuspend() {
    if (!confirm(`Nonaktifkan tenant "${info.nama}"?`)) return
    try {
      await tenantService.updateTenant(info.name, { status: 'Non-Aktif' })
      onRefresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menonaktifkan')
    }
  }

  return (
    <form onSubmit={(e) => { void handleSave(e) }} className={styles.tabForm}>
      <div className={styles.formGrid}>
        <div className={styles.field}>
          <label className={styles.label}>Nama <span className={styles.req}>*</span></label>
          <input className={styles.input} value={form.nama ?? ''} onChange={(e) => set('nama', e.target.value)} required />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Jenis Organisasi</label>
          <select className={styles.select} value={form.jenis_organisasi ?? ''} onChange={(e) => set('jenis_organisasi', e.target.value)}>
            {JENIS_OPTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>NPWP</label>
          <input className={styles.input} value={form.npwp ?? ''} onChange={(e) => set('npwp', e.target.value)} placeholder="01.234.567.8-000" />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Telepon</label>
          <input className={styles.input} value={form.telepon ?? ''} onChange={(e) => set('telepon', e.target.value)} placeholder="021-1234567" />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <input className={styles.input} type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value)} placeholder="admin@org.id" />
        </div>
        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label className={styles.label}>Alamat</label>
          <textarea className={styles.textarea} value={form.alamat ?? ''} onChange={(e) => set('alamat', e.target.value)} rows={3} />
        </div>
      </div>
      {error && <p className={styles.errorMsg}>{error}</p>}
      {success && <p className={styles.successMsg}>Berhasil disimpan.</p>}
      <div className={styles.formActions}>
        <button type="submit" className={styles.saveBtn} disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
      {info.status === 'Aktif' && (
        <div className={styles.dangerZone}>
          <h3 className={styles.dangerTitle}>Danger Zone</h3>
          <div className={styles.dangerRow}>
            <div>
              <p className={styles.dangerLabel}>Nonaktifkan Tenant</p>
              <p className={styles.dangerDesc}>Tenant tidak dapat login. Institusi dan data tetap ada.</p>
            </div>
            <button type="button" className={styles.dangerBtn} onClick={() => { void handleSuspend() }}>
              Nonaktifkan
            </button>
          </div>
        </div>
      )}
    </form>
  )
}

// ─── Institusi Tab ─────────────────────────────────────────────────────────────

function InstitusiTab({ detail, onRefresh }: { detail: TenantDetail; onRefresh: () => void }) {
  const { institutions } = detail
  const [toggling, setToggling] = useState<string | null>(null)

  async function handleToggle(inst: TenantInstitution) {
    const newStatus = inst.status === 'Aktif' ? 'Non-Aktif' : 'Aktif'
    setToggling(inst.name)
    try {
      await tenantService.toggleInstitutionStatus(inst.name, inst.type === 'koperasi' ? 'Koperasi' : 'Sekolah', newStatus)
      onRefresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal mengubah status')
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className={styles.instList}>
      {institutions.length === 0
        ? <p className={styles.tabEmpty}>Belum ada institusi di tenant ini.</p>
        : institutions.map((inst) => (
          <div key={inst.name} className={styles.instRow}>
            <div className={`${styles.instIcon} ${inst.type === 'koperasi' ? styles.instIconKop : styles.instIconSek}`}>
              {inst.type === 'koperasi' ? '🏦' : '🏫'}
            </div>
            <div className={styles.instInfo}>
              <span className={styles.instName}>{inst.nama}</span>
              <span className={styles.instCode}>{inst.name}</span>
            </div>
            <span className={`${styles.typeBadge} ${inst.type === 'koperasi' ? styles.badgeKop : styles.badgeSek}`}>
              {inst.type === 'koperasi' ? 'Koperasi' : 'Sekolah'}
            </span>
            <span className={`${styles.statusBadge} ${inst.status === 'Aktif' ? styles.badgeAktif : styles.badgeNon}`}>
              {inst.status}
            </span>
            <button type="button" className={styles.toggleBtn} disabled={toggling === inst.name} onClick={() => { void handleToggle(inst) }}>
              {toggling === inst.name ? '...' : inst.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          </div>
        ))
      }
    </div>
  )
}

// ─── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab({ detail, onRefresh }: { detail: TenantDetail; onRefresh: () => void }) {
  const { users, institutions, info } = detail
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    email: '', full_name: '', password: '', role: ORG_ROLES[0],
    institution: institutions[0]?.name ?? '',
    institution_doctype: (institutions[0]?.type === 'koperasi' ? 'Koperasi' : 'Sekolah') as 'Sekolah' | 'Koperasi',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email || !form.full_name || !form.password) { setError('Email, nama, dan password wajib diisi'); return }
    setSaving(true)
    setError('')
    try {
      await tenantService.createOrgUser({ org: info.name, ...form })
      setShowForm(false)
      setForm({ email: '', full_name: '', password: '', role: ORG_ROLES[0], institution: institutions[0]?.name ?? '', institution_doctype: institutions[0]?.type === 'koperasi' ? 'Koperasi' : 'Sekolah' })
      onRefresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat user')
    } finally {
      setSaving(false)
    }
  }

  function handleInstChange(instName: string) {
    const inst = institutions.find((i) => i.name === instName)
    setForm((f) => ({ ...f, institution: instName, institution_doctype: inst?.type === 'koperasi' ? 'Koperasi' : 'Sekolah' }))
  }

  return (
    <div className={styles.usersTab}>
      <div className={styles.usersHeader}>
        <span className={styles.usersCount}>{users.length} user</span>
        <button type="button" className={styles.addUserBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Batal' : '+ Tambah User'}
        </button>
      </div>
      {showForm && (
        <form onSubmit={(e) => { void handleCreate(e) }} className={styles.userForm}>
          <div className={styles.formGrid2}>
            <div className={styles.field}>
              <label className={styles.label}>Email <span className={styles.req}>*</span></label>
              <input className={styles.input} type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="user@sekolah.id" required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Nama Lengkap <span className={styles.req}>*</span></label>
              <input className={styles.input} value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Ahmad Santoso" required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Password <span className={styles.req}>*</span></label>
              <input className={styles.input} type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Role</label>
              <select className={styles.select} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                {ORG_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label className={styles.label}>Institusi</label>
              <select className={styles.select} value={form.institution} onChange={(e) => handleInstChange(e.target.value)}>
                {institutions.map((i) => <option key={i.name} value={i.name}>{i.nama}</option>)}
              </select>
            </div>
          </div>
          {error && <p className={styles.errorMsg}>{error}</p>}
          <button type="submit" className={styles.saveBtn} disabled={saving}>{saving ? 'Membuat...' : 'Buat User'}</button>
        </form>
      )}
      {users.length === 0
        ? <p className={styles.tabEmpty}>Belum ada user di tenant ini.</p>
        : (
          <div className={styles.userList}>
            {users.map((user: OrgUser) => (
              <div key={user.name} className={styles.userRow}>
                <div className={styles.userAvatar}>{user.full_name[0]?.toUpperCase() ?? 'U'}</div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.full_name}</span>
                  <span className={styles.userEmail}>{user.email}</span>
                </div>
                <div className={styles.userMeta}>
                  <span className={styles.userRole}>{user.roles[0] ?? '—'}</span>
                  <span className={styles.userInst}>{user.institution}</span>
                </div>
                <span className={`${styles.statusBadge} ${user.enabled ? styles.badgeAktif : styles.badgeNon}`}>
                  {user.enabled ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

// ─── Modul Tab ─────────────────────────────────────────────────────────────────

function ModulTab({ detail, onRefresh }: { detail: TenantDetail; onRefresh: () => void }) {
  const { institutions } = detail
  const [toggling, setToggling] = useState<string | null>(null)

  async function handleToggle(inst: TenantInstitution, moduleName: string, currentAktif: boolean) {
    const key = `${inst.name}:${moduleName}`
    setToggling(key)
    try {
      await tenantService.toggleModule(inst.name, inst.type === 'koperasi' ? 'Koperasi' : 'Sekolah', moduleName, !currentAktif)
      onRefresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal mengubah modul')
    } finally {
      setToggling(null)
    }
  }

  if (institutions.length === 0) {
    return <p className={styles.tabEmpty}>Belum ada institusi. Tambahkan institusi terlebih dahulu.</p>
  }

  return (
    <div className={styles.modulTab}>
      {institutions.map((inst) => {
        const moduleMap = Object.fromEntries(inst.modul_aktif.map((m) => [m.nama_modul, m.aktif]))
        return (
          <div key={inst.name} className={styles.modulCard}>
            <div className={styles.modulCardHeader}>
              <span className={styles.modulInstName}>{inst.nama}</span>
              <span className={`${styles.typeBadge} ${inst.type === 'koperasi' ? styles.badgeKop : styles.badgeSek}`}>
                {inst.type === 'koperasi' ? 'Koperasi' : 'Sekolah'}
              </span>
            </div>
            <div className={styles.modulRows}>
              {ALL_MODULES.map((mod) => {
                const isAktif = moduleMap[mod] ?? false
                const key = `${inst.name}:${mod}`
                return (
                  <div key={mod} className={styles.modulRow}>
                    <span className={styles.modulName}>{mod}</span>
                    <button
                      type="button"
                      className={`${styles.toggle} ${isAktif ? styles.toggleOn : styles.toggleOff}`}
                      disabled={toggling === key}
                      onClick={() => { void handleToggle(inst, mod, isAktif) }}
                      aria-label={`${isAktif ? 'Nonaktifkan' : 'Aktifkan'} ${mod}`}
                    >
                      <span className={styles.toggleThumb} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TenantDetailPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<TenantDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    setLoadError(null)
    try {
      setDetail(await tenantService.getTenantDetail(decodeURIComponent(orgId)))
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { void load() }, [load])

  if (loading) return <div className={styles.loading}>Memuat...</div>
  if (loadError || !detail) return <div className={styles.loading}>{loadError ?? 'Tenant tidak ditemukan.'}</div>

  const statusBadge = (
    <span className={`${styles.statusBadge} ${detail.info.status === 'Aktif' ? styles.badgeAktif : styles.badgeNon}`}>
      {detail.info.status}
    </span>
  )

  return (
    <DetailPageTemplate
      title={detail.info.nama}
      code={detail.info.name}
      icon={<Building2 size={24} />}
      onBack={() => navigate('/su/tenants')}
      backLabel="Tenants"
      badges={statusBadge}
      tabs={[
        { id: 'info', label: 'Info', icon: <Edit size={14} />, content: <InfoTab detail={detail} onRefresh={load} /> },
        { id: 'institusi', label: 'Institusi', icon: <Layers size={14} />, content: <InstitusiTab detail={detail} onRefresh={load} /> },
        { id: 'users', label: 'Users', icon: <Users size={14} />, content: <UsersTab detail={detail} onRefresh={load} /> },
        { id: 'modul', label: 'Modul', icon: <Package size={14} />, content: <ModulTab detail={detail} onRefresh={load} /> },
      ]}
    />
  )
}
