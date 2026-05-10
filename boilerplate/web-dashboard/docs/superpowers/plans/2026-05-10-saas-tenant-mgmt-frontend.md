# SaaS Tenant Management — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build TenantListPage (`/su/tenants`) and TenantDetailPage (`/su/tenants/:orgId`) with 4 tabs (Info, Institusi, Users, Modul) in the web dashboard.

**Architecture:** New `tenant.service.ts` calls `vernon_saas.api.tenant.*` endpoints. New `tenant.types.ts` defines all types. Two new page components under `src/pages/Admin/`. Routes wired into existing `/su/*` superuser context. CSS Modules, no Tailwind.

**Tech Stack:** React 18, TypeScript, React Router 6, CSS Modules, Zustand (auth store for CSRF token), Frappe REST API via session cookie.

**Prerequisite:** Backend plan (`2026-05-10-saas-tenant-mgmt-backend.md`) completed and all API endpoints returning correct responses.

---

## File Map

| Action | Path |
|--------|------|
| Create | `src/types/tenant.types.ts` |
| Create | `src/services/tenant.service.ts` |
| Create | `src/pages/Admin/TenantListPage.tsx` |
| Create | `src/pages/Admin/TenantListPage.module.css` |
| Create | `src/pages/Admin/TenantDetailPage.tsx` |
| Create | `src/pages/Admin/TenantDetailPage.module.css` |
| Modify | `src/app/routes.tsx` (add `/su/tenants` and `/su/tenants/:orgId`) |

---

### Task 1: Types and service

**Files:**
- Create: `src/types/tenant.types.ts`
- Create: `src/services/tenant.service.ts`

- [ ] **Step 1: Create `tenant.types.ts`**

```typescript
export interface Tenant {
  name: string
  nama: string
  logo?: string
  status: 'Aktif' | 'Non-Aktif'
  jenis_organisasi?: string
  email?: string
  telepon?: string
  npwp?: string
  alamat?: string
  institution_count: number
  user_count: number
}

export interface TenantModul {
  nama_modul: string
  aktif: boolean
}

export interface TenantLembaga {
  name: string
  nama: string
  jenjang: string
}

export interface TenantInstitution {
  name: string
  nama: string
  type: 'sekolah' | 'koperasi'
  status: 'Aktif' | 'Non-Aktif'
  logo?: string
  lembaga: TenantLembaga[]
  modul_aktif: TenantModul[]
}

export interface OrgUser {
  name: string
  full_name: string
  email: string
  enabled: boolean
  roles: string[]
  institution: string
  institution_doctype: string
}

export interface TenantDetail {
  info: Tenant
  institutions: TenantInstitution[]
  users: OrgUser[]
}

export interface CreateTenantPayload {
  nama: string
  jenis_organisasi: string
  email?: string
  telepon?: string
  npwp?: string
  alamat?: string
}

export interface UpdateTenantPayload {
  nama?: string
  jenis_organisasi?: string
  email?: string
  telepon?: string
  npwp?: string
  alamat?: string
  logo?: string
  status?: 'Aktif' | 'Non-Aktif'
}

export interface CreateOrgUserPayload {
  org: string
  email: string
  full_name: string
  password: string
  role: string
  institution: string
  institution_doctype: 'Sekolah' | 'Koperasi'
}
```

Save to: `src/types/tenant.types.ts`

- [ ] **Step 2: Create `tenant.service.ts`**

```typescript
import type {
  Tenant,
  TenantDetail,
  CreateTenantPayload,
  UpdateTenantPayload,
  CreateOrgUserPayload,
} from '@/types/tenant.types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function getCsrfToken(): string {
  return (
    document.cookie
      .split('; ')
      .find((c) => c.startsWith('csrf_token='))
      ?.split('=')[1]
  ) ?? 'fetch'
}

async function callMethod<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}/api/method/${method}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Frappe-CSRF-Token': getCsrfToken(),
    },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({})) as Record<string, unknown>
    const msg = (json['exception'] as string) ?? `${res.status} ${method}`
    throw new Error(msg)
  }
  const json = await res.json() as Record<string, unknown>
  return (json['message'] ?? json) as T
}

export const tenantService = {
  getTenantList: () =>
    callMethod<Tenant[]>('vernon_saas.api.tenant.get_tenant_list'),

  getTenantDetail: (org: string) =>
    callMethod<TenantDetail>('vernon_saas.api.tenant.get_tenant_detail', { org }),

  createTenant: (data: CreateTenantPayload) =>
    callMethod<Tenant>('vernon_saas.api.tenant.create_tenant', { data }),

  updateTenant: (org: string, data: UpdateTenantPayload) =>
    callMethod<Tenant>('vernon_saas.api.tenant.update_tenant', { org, data }),

  toggleInstitutionStatus: (name: string, doctype: 'Sekolah' | 'Koperasi', status: 'Aktif' | 'Non-Aktif') =>
    callMethod<{ name: string; status: string }>(
      'vernon_saas.api.tenant.toggle_institution_status',
      { name, doctype, status }
    ),

  createOrgUser: (payload: CreateOrgUserPayload) =>
    callMethod<{ name: string; email: string; full_name: string }>(
      'vernon_saas.api.tenant.create_org_user',
      payload
    ),

  toggleModule: (institution: string, institution_doctype: 'Sekolah' | 'Koperasi', module_name: string, aktif: boolean) =>
    callMethod<{ institution: string; module: string; aktif: boolean }>(
      'vernon_saas.api.tenant.toggle_module',
      { institution, institution_doctype, module_name, aktif }
    ),
}
```

Save to: `src/services/tenant.service.ts`

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx tsc --noEmit 2>&1
```

Expected: `TypeScript: No errors found`

- [ ] **Step 4: Commit**

```bash
git add src/types/tenant.types.ts src/services/tenant.service.ts
git commit -m "feat: add tenant types and service"
```

---

### Task 2: TenantListPage

**Files:**
- Create: `src/pages/Admin/TenantListPage.tsx`
- Create: `src/pages/Admin/TenantListPage.module.css`

- [ ] **Step 1: Create `TenantListPage.tsx`**

```tsx
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
```

Save to: `src/pages/Admin/TenantListPage.tsx`

- [ ] **Step 2: Create `TenantListPage.module.css`**

```css
.page { display: flex; flex-direction: column; gap: var(--space-5); padding: var(--space-6); max-width: 800px; }

.header { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--space-4); }
.title { font-size: var(--font-2xl); font-weight: 700; color: var(--color-text); letter-spacing: -0.01em; }
.subtitle { font-size: var(--font-sm); color: var(--color-text-secondary); margin-top: var(--space-1); }

.createBtn { display: flex; align-items: center; gap: var(--space-2); height: 36px; padding: 0 var(--space-4); background: var(--color-primary); color: #fff; border-radius: var(--radius-md); font-size: var(--font-sm); font-weight: 600; flex-shrink: 0; transition: background var(--duration-fast); }
.createBtn:hover { background: var(--color-primary-hover); }

.searchWrap { position: relative; }
.searchIcon { position: absolute; left: var(--space-3); top: 50%; transform: translateY(-50%); color: var(--color-text-tertiary); }
.searchInput { width: 100%; height: var(--input-height); padding: 0 var(--space-3) 0 calc(var(--space-3) + 22px); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-elevated); color: var(--color-text); font-size: var(--font-base); }
.searchInput:focus { outline: none; border-color: var(--color-primary); }

.list { display: flex; flex-direction: column; background: var(--color-surface-elevated); border: 1px solid var(--color-border); border-radius: var(--radius-xl); overflow: hidden; }

.row { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--color-border-subtle); text-align: left; cursor: pointer; transition: background var(--duration-fast); }
.row:last-child { border-bottom: none; }
.row:hover { background: var(--color-primary-subtle); }

.avatar { width: 40px; height: 40px; border-radius: var(--radius-md); overflow: hidden; background: var(--color-surface-alt); border: 1px solid var(--color-border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.avatarImg { width: 100%; height: 100%; object-fit: contain; padding: 4px; }
.avatarInitials { font-size: var(--font-sm); font-weight: 700; color: var(--color-primary); }

.info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.name { font-size: var(--font-base); font-weight: 600; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.meta { font-size: var(--font-xs); color: var(--color-text-secondary); }

.stats { display: flex; gap: var(--space-2); flex-shrink: 0; }
.statChip { padding: 2px 8px; border-radius: var(--radius-full); font-size: 11px; font-weight: 500; background: var(--color-border); color: var(--color-text-secondary); }

.badge { padding: 2px 8px; border-radius: var(--radius-full); font-size: 11px; font-weight: 600; flex-shrink: 0; }
.badgeAktif { background: #dcfce7; color: #15803d; }
.badgeNon { background: var(--color-border); color: var(--color-text-tertiary); }

.chevron { color: var(--color-text-tertiary); flex-shrink: 0; }

.skeletonList { display: flex; flex-direction: column; gap: var(--space-2); }
.skeletonRow { height: 64px; border-radius: var(--radius-lg); background: var(--color-surface-elevated); border: 1px solid var(--color-border); animation: shimmer 1.4s ease infinite; }
@keyframes shimmer { 0%,100% { opacity:.6; } 50% { opacity:1; } }

.empty { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); padding: var(--space-10); background: var(--color-surface-elevated); border: 1px solid var(--color-border); border-radius: var(--radius-xl); color: var(--color-text-tertiary); font-size: var(--font-sm); text-align: center; }
.emptyIcon { opacity: .4; }

/* Modal */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 200; padding: var(--space-6); }
.modal { background: var(--color-surface-elevated); border: 1px solid var(--color-border); border-radius: var(--radius-2xl); padding: var(--space-6); width: 100%; max-width: 400px; box-shadow: var(--shadow-xl); animation: scaleIn .2s var(--ease-spring) both; }
@keyframes scaleIn { from { opacity:0; transform:scale(.96); } to { opacity:1; transform:scale(1); } }
.modalTitle { font-size: var(--font-lg); font-weight: 700; color: var(--color-text); margin-bottom: var(--space-5); }
.modalForm { display: flex; flex-direction: column; gap: var(--space-3); }
.label { font-size: var(--font-xs); font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .06em; }
.req { color: var(--color-danger, #ef4444); }
.input, .select { width: 100%; height: var(--input-height); padding: 0 var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-alt); color: var(--color-text); font-size: var(--font-base); }
.input:focus, .select:focus { outline: none; border-color: var(--color-primary); }
.error { font-size: var(--font-xs); color: var(--color-danger, #ef4444); }
.modalActions { display: flex; gap: var(--space-2); justify-content: flex-end; margin-top: var(--space-2); }
.cancelBtn { padding: 0 var(--space-4); height: 36px; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: transparent; color: var(--color-text-secondary); font-size: var(--font-sm); font-weight: 600; }
.submitBtn { padding: 0 var(--space-4); height: 36px; border-radius: var(--radius-md); background: var(--color-primary); color: #fff; font-size: var(--font-sm); font-weight: 600; }
.submitBtn:disabled { opacity: .6; cursor: not-allowed; }
```

Save to: `src/pages/Admin/TenantListPage.module.css`

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1
```

Expected: `TypeScript: No errors found`

- [ ] **Step 4: Commit**

```bash
git add src/pages/Admin/TenantListPage.tsx src/pages/Admin/TenantListPage.module.css
git commit -m "feat: add TenantListPage with search and create modal"
```

---

### Task 3: TenantDetailPage — shell + Info tab

**Files:**
- Create: `src/pages/Admin/TenantDetailPage.tsx`
- Create: `src/pages/Admin/TenantDetailPage.module.css`

- [ ] **Step 1: Create `TenantDetailPage.tsx` with shell and Info tab**

```tsx
import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2 } from 'lucide-react'
import { tenantService } from '@/services/tenant.service'
import type { TenantDetail, UpdateTenantPayload } from '@/types/tenant.types'
import styles from './TenantDetailPage.module.css'

const TABS = ['Info', 'Institusi', 'Users', 'Modul'] as const
type Tab = typeof TABS[number]

const JENIS_OPTIONS = ['Yayasan', 'Perusahaan', 'Pemerintah', 'Lainnya']

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
    if (!confirm(`Nonaktifkan tenant "${info.nama}"? Semua institusi masih ada, hanya status tenant yang berubah.`)) return
    try {
      await tenantService.updateTenant(info.name, { status: 'Non-Aktif' })
      onRefresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menonaktifkan tenant')
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

// ─── Placeholder tabs (implemented in later tasks) ────────────────────────────

function InstitusiTab({ detail, onRefresh }: { detail: TenantDetail; onRefresh: () => void }) {
  return <div className={styles.tabPlaceholder}>Institusi tab — Task 4</div>
}

function UsersTab({ detail, onRefresh }: { detail: TenantDetail; onRefresh: () => void }) {
  return <div className={styles.tabPlaceholder}>Users tab — Task 5</div>
}

function ModulTab({ detail, onRefresh }: { detail: TenantDetail; onRefresh: () => void }) {
  return <div className={styles.tabPlaceholder}>Modul tab — Task 6</div>
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TenantDetailPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<TenantDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('Info')

  const load = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    try {
      setDetail(await tenantService.getTenantDetail(decodeURIComponent(orgId)))
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { void load() }, [load])

  if (loading) return <div className={styles.loading}>Memuat...</div>
  if (!detail) return <div className={styles.loading}>Tenant tidak ditemukan.</div>

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <button type="button" className={styles.backBtn} onClick={() => navigate('/su/tenants')}>
          <ArrowLeft size={16} /> Tenants
        </button>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>{detail.info.nama}</span>
      </div>

      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.headerAvatar}><Building2 size={20} /></div>
          <div>
            <h1 className={styles.pageName}>{detail.info.nama}</h1>
            <p className={styles.pageMeta}>{detail.info.jenis_organisasi} · {detail.info.email || '—'}</p>
          </div>
        </div>
        <span className={`${styles.statusBadge} ${detail.info.status === 'Aktif' ? styles.badgeAktif : styles.badgeNon}`}>
          {detail.info.status}
        </span>
      </div>

      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'Info' && <InfoTab detail={detail} onRefresh={load} />}
        {activeTab === 'Institusi' && <InstitusiTab detail={detail} onRefresh={load} />}
        {activeTab === 'Users' && <UsersTab detail={detail} onRefresh={load} />}
        {activeTab === 'Modul' && <ModulTab detail={detail} onRefresh={load} />}
      </div>
    </div>
  )
}
```

Save to: `src/pages/Admin/TenantDetailPage.tsx`

- [ ] **Step 2: Create `TenantDetailPage.module.css`**

```css
.page { display: flex; flex-direction: column; gap: var(--space-5); padding: var(--space-6); max-width: 860px; }

.loading { padding: var(--space-8); color: var(--color-text-secondary); font-size: var(--font-sm); }

.breadcrumb { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-sm); color: var(--color-text-secondary); }
.backBtn { display: flex; align-items: center; gap: var(--space-1); color: var(--color-primary); font-size: var(--font-sm); font-weight: 600; }
.breadcrumbSep { color: var(--color-border); }
.breadcrumbCurrent { color: var(--color-text); font-weight: 600; }

.pageHeader { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); }
.pageHeaderLeft { display: flex; align-items: center; gap: var(--space-3); }
.headerAvatar { width: 44px; height: 44px; border-radius: var(--radius-lg); background: var(--color-primary-subtle); border: 1px solid var(--color-border); display: flex; align-items: center; justify-content: center; color: var(--color-primary); }
.pageName { font-size: var(--font-2xl); font-weight: 700; color: var(--color-text); letter-spacing: -0.01em; }
.pageMeta { font-size: var(--font-sm); color: var(--color-text-secondary); margin-top: 2px; }
.statusBadge { padding: 3px 10px; border-radius: var(--radius-full); font-size: var(--font-xs); font-weight: 600; }
.badgeAktif { background: #dcfce7; color: #15803d; }
.badgeNon { background: var(--color-border); color: var(--color-text-tertiary); }

.tabs { display: flex; gap: 0; border-bottom: 2px solid var(--color-border); }
.tab { padding: var(--space-3) var(--space-5); font-size: var(--font-sm); font-weight: 600; color: var(--color-text-secondary); border-bottom: 2px solid transparent; margin-bottom: -2px; transition: color var(--duration-fast), border-color var(--duration-fast); }
.tab:hover { color: var(--color-text); }
.tabActive { color: var(--color-primary); border-color: var(--color-primary); }

.tabContent { background: var(--color-surface-elevated); border: 1px solid var(--color-border); border-radius: var(--radius-xl); padding: var(--space-6); }
.tabPlaceholder { color: var(--color-text-tertiary); font-size: var(--font-sm); padding: var(--space-4); }

/* Info tab form */
.tabForm { display: flex; flex-direction: column; gap: var(--space-5); }
.formGrid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
.field { display: flex; flex-direction: column; gap: var(--space-1); }
.fieldFull { grid-column: 1 / -1; }
.label { font-size: var(--font-xs); font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .06em; }
.req { color: var(--color-danger, #ef4444); }
.input, .select { width: 100%; height: var(--input-height); padding: 0 var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-alt); color: var(--color-text); font-size: var(--font-base); }
.input:focus, .select:focus { outline: none; border-color: var(--color-primary); }
.textarea { width: 100%; padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-alt); color: var(--color-text); font-size: var(--font-base); resize: vertical; }
.textarea:focus { outline: none; border-color: var(--color-primary); }
.formActions { display: flex; }
.saveBtn { height: 36px; padding: 0 var(--space-5); background: var(--color-primary); color: #fff; border-radius: var(--radius-md); font-size: var(--font-sm); font-weight: 600; transition: background var(--duration-fast); }
.saveBtn:hover:not(:disabled) { background: var(--color-primary-hover); }
.saveBtn:disabled { opacity: .6; cursor: not-allowed; }
.errorMsg { font-size: var(--font-xs); color: var(--color-danger, #ef4444); }
.successMsg { font-size: var(--font-xs); color: #15803d; }

/* Danger zone */
.dangerZone { border: 1px solid #fecaca; border-radius: var(--radius-lg); padding: var(--space-5); margin-top: var(--space-4); }
.dangerTitle { font-size: var(--font-sm); font-weight: 700; color: #dc2626; margin-bottom: var(--space-3); }
.dangerRow { display: flex; align-items: center; justify-content: space-between; gap: var(--space-4); }
.dangerLabel { font-size: var(--font-sm); font-weight: 600; color: var(--color-text); }
.dangerDesc { font-size: var(--font-xs); color: var(--color-text-secondary); margin-top: 2px; }
.dangerBtn { height: 34px; padding: 0 var(--space-4); border: 1px solid #fecaca; border-radius: var(--radius-md); color: #dc2626; font-size: var(--font-sm); font-weight: 600; background: #fff1f2; flex-shrink: 0; transition: background var(--duration-fast); }
.dangerBtn:hover { background: #fee2e2; }
```

Save to: `src/pages/Admin/TenantDetailPage.module.css`

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1
```

Expected: `TypeScript: No errors found`

- [ ] **Step 4: Commit**

```bash
git add src/pages/Admin/TenantDetailPage.tsx src/pages/Admin/TenantDetailPage.module.css
git commit -m "feat: add TenantDetailPage shell with Info tab"
```

---

### Task 4: Institusi tab

**Files:**
- Modify: `src/pages/Admin/TenantDetailPage.tsx` (replace `InstitusiTab` placeholder)

- [ ] **Step 1: Replace `InstitusiTab` function in `TenantDetailPage.tsx`**

Find and replace the placeholder `InstitusiTab` function with:

```tsx
function InstitusiTab({ detail, onRefresh }: { detail: TenantDetail; onRefresh: () => void }) {
  const { institutions, info } = detail
  const [toggling, setToggling] = useState<string | null>(null)

  async function handleToggle(inst: TenantInstitution) {
    const newStatus = inst.status === 'Aktif' ? 'Non-Aktif' : 'Aktif'
    setToggling(inst.name)
    try {
      await tenantService.toggleInstitutionStatus(
        inst.name,
        inst.type === 'sekolah' ? 'Sekolah' : 'Koperasi',
        newStatus
      )
      onRefresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal mengubah status')
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className={styles.instList}>
      {institutions.length === 0 ? (
        <p className={styles.tabEmpty}>Belum ada institusi di tenant ini.</p>
      ) : (
        institutions.map((inst) => (
          <div key={inst.name} className={styles.instRow}>
            <div className={`${styles.instIcon} ${inst.type === 'koperasi' ? styles.instIconKop : styles.instIconSek}`}>
              {inst.type === 'koperasi' ? '🏦' : '🏫'}
            </div>
            <div className={styles.instInfo}>
              <span className={styles.instName}>{inst.nama}</span>
              <span className={styles.instCode}>{inst.name}</span>
            </div>
            <span className={`${styles.instTypeBadge} ${inst.type === 'koperasi' ? styles.badgeKop : styles.badgeSek}`}>
              {inst.type === 'koperasi' ? 'Koperasi' : 'Sekolah'}
            </span>
            <span className={`${styles.statusBadge} ${inst.status === 'Aktif' ? styles.badgeAktif : styles.badgeNon}`}>
              {inst.status}
            </span>
            <button
              type="button"
              className={styles.toggleBtn}
              disabled={toggling === inst.name}
              onClick={() => { void handleToggle(inst) }}
            >
              {toggling === inst.name ? '...' : inst.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          </div>
        ))
      )}
    </div>
  )
}
```

Also add the import at top of file (after existing imports):
```tsx
import type { TenantDetail, TenantInstitution, UpdateTenantPayload } from '@/types/tenant.types'
```

Replace the existing import line `import type { TenantDetail, UpdateTenantPayload } from '@/types/tenant.types'`.

Add these CSS classes to `TenantDetailPage.module.css`:

```css
/* Institusi tab */
.instList { display: flex; flex-direction: column; gap: var(--space-2); }
.instRow { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); background: var(--color-surface-alt); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-lg); }
.instIcon { width: 36px; height: 36px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
.instIconSek { background: rgba(99,102,241,.1); }
.instIconKop { background: rgba(217,119,6,.1); }
.instInfo { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.instName { font-size: var(--font-base); font-weight: 600; color: var(--color-text); }
.instCode { font-size: var(--font-xs); color: var(--color-text-tertiary); font-family: monospace; }
.instTypeBadge { padding: 2px 8px; border-radius: var(--radius-full); font-size: 11px; font-weight: 600; flex-shrink: 0; }
.badgeSek { background: rgba(99,102,241,.1); color: #6366f1; }
.badgeKop { background: rgba(217,119,6,.1); color: #d97706; }
.toggleBtn { padding: 0 var(--space-3); height: 30px; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-surface-elevated); color: var(--color-text-secondary); font-size: var(--font-xs); font-weight: 600; flex-shrink: 0; transition: background var(--duration-fast); }
.toggleBtn:hover:not(:disabled) { background: var(--color-border); }
.toggleBtn:disabled { opacity: .5; cursor: not-allowed; }
.tabEmpty { color: var(--color-text-tertiary); font-size: var(--font-sm); padding: var(--space-4); }
```

- [ ] **Step 2: TypeScript check and commit**

```bash
npx tsc --noEmit 2>&1
git add src/pages/Admin/TenantDetailPage.tsx src/pages/Admin/TenantDetailPage.module.css
git commit -m "feat: implement Institusi tab in TenantDetailPage"
```

---

### Task 5: Users tab

**Files:**
- Modify: `src/pages/Admin/TenantDetailPage.tsx` (replace `UsersTab` placeholder)

- [ ] **Step 1: Replace `UsersTab` function**

```tsx
const ORG_ROLES = ['Teller', 'Supervisor', 'Pustakawan', 'Kepala Perpustakaan', 'Admin Guru', 'Tata Usaha']

function UsersTab({ detail, onRefresh }: { detail: TenantDetail; onRefresh: () => void }) {
  const { users, institutions, info } = detail
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: ORG_ROLES[0], institution: institutions[0]?.name ?? '', institution_doctype: institutions[0]?.type === 'koperasi' ? 'Koperasi' : 'Sekolah' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email || !form.full_name || !form.password) { setError('Email, nama, dan password wajib diisi'); return }
    setSaving(true)
    setError('')
    try {
      await tenantService.createOrgUser({ org: info.name, ...form, institution_doctype: form.institution_doctype as 'Sekolah' | 'Koperasi' })
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
              <input className={styles.input} type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min 8 karakter" required />
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

      {users.length === 0 ? (
        <p className={styles.tabEmpty}>Belum ada user di tenant ini.</p>
      ) : (
        <div className={styles.userList}>
          {users.map((user) => (
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
      )}
    </div>
  )
}
```

Add CSS to `TenantDetailPage.module.css`:

```css
/* Users tab */
.usersTab { display: flex; flex-direction: column; gap: var(--space-4); }
.usersHeader { display: flex; align-items: center; justify-content: space-between; }
.usersCount { font-size: var(--font-sm); color: var(--color-text-secondary); }
.addUserBtn { height: 32px; padding: 0 var(--space-4); border: 1px solid var(--color-primary); border-radius: var(--radius-md); color: var(--color-primary); font-size: var(--font-sm); font-weight: 600; background: var(--color-primary-subtle); transition: background var(--duration-fast); }
.addUserBtn:hover { background: rgba(99,102,241,.15); }
.userForm { background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-4); }
.formGrid2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
.userList { display: flex; flex-direction: column; gap: var(--space-2); }
.userRow { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); background: var(--color-surface-alt); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-lg); }
.userAvatar { width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary-subtle); border: 1px solid var(--color-border); display: flex; align-items: center; justify-content: center; font-size: var(--font-sm); font-weight: 700; color: var(--color-primary); flex-shrink: 0; }
.userInfo { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.userName { font-size: var(--font-base); font-weight: 600; color: var(--color-text); }
.userEmail { font-size: var(--font-xs); color: var(--color-text-secondary); }
.userMeta { display: flex; flex-direction: column; gap: 1px; align-items: flex-end; }
.userRole { font-size: var(--font-xs); font-weight: 600; color: var(--color-text); }
.userInst { font-size: 10px; color: var(--color-text-tertiary); }
```

- [ ] **Step 2: TypeScript check and commit**

```bash
npx tsc --noEmit 2>&1
git add src/pages/Admin/TenantDetailPage.tsx src/pages/Admin/TenantDetailPage.module.css
git commit -m "feat: implement Users tab in TenantDetailPage"
```

---

### Task 6: Modul tab

**Files:**
- Modify: `src/pages/Admin/TenantDetailPage.tsx` (replace `ModulTab` placeholder)

- [ ] **Step 1: Replace `ModulTab` function**

```tsx
const ALL_MODULES = ['Akademik', 'Koperasi', 'Perpustakaan', 'Infrastruktur']

function ModulTab({ detail, onRefresh }: { detail: TenantDetail; onRefresh: () => void }) {
  const { institutions } = detail
  const [toggling, setToggling] = useState<string | null>(null)

  async function handleToggle(inst: TenantInstitution, moduleName: string, currentAktif: boolean) {
    const key = `${inst.name}:${moduleName}`
    setToggling(key)
    try {
      await tenantService.toggleModule(
        inst.name,
        inst.type === 'koperasi' ? 'Koperasi' : 'Sekolah',
        moduleName,
        !currentAktif
      )
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
        const moduleMap = Object.fromEntries(
          inst.modul_aktif.map((m) => [m.nama_modul, m.aktif])
        )
        return (
          <div key={inst.name} className={styles.modulCard}>
            <div className={styles.modulCardHeader}>
              <span className={styles.modulInstName}>{inst.nama}</span>
              <span className={`${styles.instTypeBadge} ${inst.type === 'koperasi' ? styles.badgeKop : styles.badgeSek}`}>
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
```

Add CSS to `TenantDetailPage.module.css`:

```css
/* Modul tab */
.modulTab { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4); }
.modulCard { background: var(--color-surface-alt); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
.modulCardHeader { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border-subtle); }
.modulInstName { font-size: var(--font-sm); font-weight: 700; color: var(--color-text); }
.modulRows { display: flex; flex-direction: column; }
.modulRow { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border-subtle); }
.modulRow:last-child { border-bottom: none; }
.modulName { font-size: var(--font-sm); color: var(--color-text); }

/* Toggle switch */
.toggle { width: 40px; height: 22px; border-radius: 11px; position: relative; transition: background var(--duration-fast); flex-shrink: 0; }
.toggle:disabled { opacity: .5; cursor: not-allowed; }
.toggleOn { background: var(--color-primary); }
.toggleOff { background: var(--color-border); }
.toggleThumb { position: absolute; top: 3px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.2); transition: left var(--duration-fast); }
.toggleOn .toggleThumb { left: 21px; }
.toggleOff .toggleThumb { left: 3px; }
```

- [ ] **Step 2: TypeScript check and commit**

```bash
npx tsc --noEmit 2>&1
git add src/pages/Admin/TenantDetailPage.tsx src/pages/Admin/TenantDetailPage.module.css
git commit -m "feat: implement Modul tab in TenantDetailPage"
```

---

### Task 7: Wire routes and verify

**Files:**
- Modify: `src/app/routes.tsx`

- [ ] **Step 1: Add TenantListPage and TenantDetailPage imports to `routes.tsx`**

Add after existing lazy imports:

```tsx
const TenantListPage     = lazy(() => import('@/pages/Admin/TenantListPage'))
const TenantDetailPage   = lazy(() => import('@/pages/Admin/TenantDetailPage'))
```

- [ ] **Step 2: Add routes under `/su`**

Replace the commented-out tenants route:

```tsx
{ path: 'dashboard', element: <S><AdminDashboardPage /></S> },
{ path: 'tenants',   element: <S><TenantListPage /></S> },
{ path: 'tenants/:orgId', element: <S><TenantDetailPage /></S> },
```

- [ ] **Step 3: TypeScript check**

```bash
npx tsc --noEmit 2>&1
```

Expected: `TypeScript: No errors found`

- [ ] **Step 4: Smoke test in browser**

Start dev server if not running:
```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
node node_modules/.bin/vite --port 5175 > /tmp/vite.log 2>&1 &
sleep 5
```

Login as administrator, navigate to `/su/tenants`. Verify:
- Tenant list loads
- Click a tenant → `/su/tenants/:orgId` loads
- Info tab shows and saves
- Institusi tab shows institutions
- Users tab shows form
- Modul tab shows toggles

- [ ] **Step 5: Final commit**

```bash
git add src/app/routes.tsx
git commit -m "feat: wire /su/tenants and /su/tenants/:orgId routes"
```

---

## Self-Review

**Spec coverage:**
- ✅ TenantListPage with search, create modal — Task 2
- ✅ TenantDetailPage shell + breadcrumb + tabs — Task 3
- ✅ Info tab with edit form + danger zone — Task 3
- ✅ Institusi tab with toggle status — Task 4
- ✅ Users tab with create form + list — Task 5
- ✅ Modul tab with toggle switches — Task 6
- ✅ Routes wired — Task 7
- ✅ Types and service — Task 1

**Type consistency:** `TenantInstitution`, `OrgUser`, `TenantDetail` defined in Task 1 and used consistently across Tasks 3-6. `institution_doctype` typed as `'Sekolah' | 'Koperasi'` throughout.

**No placeholders:** All tabs implemented with real code, no "TBD" sections.
