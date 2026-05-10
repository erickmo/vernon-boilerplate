# Koperasi — Anggota (Nasabah Hub) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Koperasi Anggota module — Nasabah (Full Hub with 4 tabs), Anggota Koperasi (List + Form), and Simpanan Pokok (List only) — wired to the Frappe/ERPNext backend via `createEntityService`.

**Architecture:** Three entities share one module folder under `src/pages/koperasi/anggota/`. Nasabah is the primary hub entity; its DetailPage fetches related Rekening, Pembiayaan, and Kartu data in isolated per-tab React Query hooks so each tab loads independently and never blocks the others. Anggota Koperasi and Simpanan Pokok are lightweight List-only or List+Form pages that use the same template pattern without a hub.

**Tech Stack:** React 18, TypeScript, TanStack Query v5, CSS Modules, React Router 6, `createEntityService`

**Prerequisite:** infra-plan complete (AppSubNav, routes.koperasi.tsx, ChooseDashboardPage, AppShell koperasi context all exist and render correctly).

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types/koperasi/anggota.types.ts` | Create | All TS interfaces for Nasabah, AnggotaKoperasi, SimpananPokok |
| `src/services/koperasi/nasabah.service.ts` | Create | CRUD for Nasabah + getNasabahSummary |
| `src/services/koperasi/anggota-koperasi.service.ts` | Create | CRUD for Anggota Koperasi |
| `src/services/koperasi/simpanan-pokok.service.ts` | Create | List-only for Simpanan Pokok |
| `src/pages/koperasi/anggota/NasabahListPage.tsx` | Create | List with search + status filter |
| `src/pages/koperasi/anggota/NasabahDetailPage.tsx` | Create | Hub with 4 tabs |
| `src/pages/koperasi/anggota/NasabahFormPage.tsx` | Create | Tambah + Edit form |
| `src/pages/koperasi/anggota/tabs/NasabahInfoTab.tsx` | Create | Field grid for nasabah fields |
| `src/pages/koperasi/anggota/tabs/NasabahRekeningTab.tsx` | Create | Table of linked rekening |
| `src/pages/koperasi/anggota/tabs/NasabahPembiayaanTab.tsx` | Create | Table of linked akad pembiayaan |
| `src/pages/koperasi/anggota/tabs/NasabahKartuTab.tsx` | Create | Table of linked kartu |
| `src/pages/koperasi/anggota/AnggotaKoperasiListPage.tsx` | Create | List with Nama Nasabah link |
| `src/pages/koperasi/anggota/AnggotaKoperasiFormPage.tsx` | Create | Form with nasabah searchable select |
| `src/pages/koperasi/anggota/SimpananPokokListPage.tsx` | Create | Read-only list |
| `src/app/routes.koperasi.tsx` | Modify | Add 6 new routes for Anggota module |

---

## Task 1: Types — `anggota.types.ts`

**Files:**
- Create: `src/types/koperasi/anggota.types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// src/types/koperasi/anggota.types.ts
import type { BaseEntity } from '@/types/entity.types'

// ─── Nasabah ──────────────────────────────────────────────────────────────────

export type NasabahStatus = 'Aktif' | 'Non-Aktif'
export type JenisKelamin = 'Laki-laki' | 'Perempuan'

export interface Nasabah extends BaseEntity {
  nama: string
  nik: string
  no_hp: string
  alamat: string
  foto?: string
  tanggal_lahir: string        // ISO date string, e.g. "1990-05-12"
  jenis_kelamin: JenisKelamin
  status: NasabahStatus
  // Summary fields returned by getNasabahSummary
  total_rekening?: number
  total_pembiayaan?: number
  kartu_aktif?: number
}

// ─── Rekening Simpanan (slim — used in Nasabah hub tab) ───────────────────────

export interface RekeningSlim {
  id: string
  nomor_rekening: string
  produk_simpanan: string
  saldo: number
  status: string
}

// ─── Akad Pembiayaan (slim — used in Nasabah hub tab) ─────────────────────────

export interface AkadSlim {
  id: string
  nomor_akad: string
  produk_pembiayaan: string
  pokok: number
  sisa_pokok: number
  status: string
}

// ─── Kartu (slim — used in Nasabah hub tab) ───────────────────────────────────

export interface KartuSlim {
  id: string
  nomor_kartu: string
  tipe: 'debit' | 'emoney'
  uid: string
  status: string
  saldo_emoney?: number        // Only populated for tipe === 'emoney'
}

// ─── Nasabah Summary (returned by getNasabahSummary) ─────────────────────────

export interface NasabahSummary {
  nasabah_id: string
  total_rekening: number
  total_pembiayaan: number
  kartu_aktif: number
  rekening: RekeningSlim[]
  pembiayaan: AkadSlim[]
  kartu: KartuSlim[]
}

// ─── Anggota Koperasi ─────────────────────────────────────────────────────────

export interface AnggotaKoperasi extends BaseEntity {
  nasabah: string              // Nasabah id (link)
  nasabah_nama: string         // Denormalized for display
  no_anggota: string
  tanggal_bergabung: string    // ISO date string
  status: 'Aktif' | 'Non-Aktif'
}

// ─── Simpanan Pokok ───────────────────────────────────────────────────────────

export interface SimpananPokok extends BaseEntity {
  nasabah: string
  nasabah_nama: string
  jumlah: number
  tanggal: string              // ISO date string
  status_lunas: 'Lunas' | 'Belum Lunas'
}
```

- [ ] **Step 2: Verify the file has no TypeScript errors**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors mentioning `anggota.types.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/types/koperasi/anggota.types.ts
git commit -m "feat(koperasi/anggota): add Nasabah, AnggotaKoperasi, SimpananPokok types"
```

---

## Task 2: Services

**Files:**
- Create: `src/services/koperasi/nasabah.service.ts`
- Create: `src/services/koperasi/anggota-koperasi.service.ts`
- Create: `src/services/koperasi/simpanan-pokok.service.ts`

- [ ] **Step 1: Create `nasabah.service.ts`**

```typescript
// src/services/koperasi/nasabah.service.ts
import { apiClient } from '@/services/api.client'
import { createEntityService } from '@/services/createEntityService'
import type { Nasabah, NasabahSummary } from '@/types/koperasi/anggota.types'

export const nasabahService = {
  ...createEntityService<Nasabah>('/api/resource/Nasabah'),

  /**
   * Fetches aggregated hub data: rekening, pembiayaan, kartu linked to this nasabah.
   * Used by NasabahDetailPage tabs that show related entities.
   */
  getNasabahSummary: (nasabahId: string): Promise<NasabahSummary> =>
    apiClient.get<NasabahSummary>(`/api/method/sekolahpro.koperasi.api.nasabah.get_summary?nasabah_id=${nasabahId}`),
}
```

- [ ] **Step 2: Create `anggota-koperasi.service.ts`**

```typescript
// src/services/koperasi/anggota-koperasi.service.ts
import { createEntityService } from '@/services/createEntityService'
import type { AnggotaKoperasi } from '@/types/koperasi/anggota.types'

export const anggotaKoperasiService = createEntityService<AnggotaKoperasi>(
  '/api/resource/Anggota Koperasi',
)
```

- [ ] **Step 3: Create `simpanan-pokok.service.ts`**

```typescript
// src/services/koperasi/simpanan-pokok.service.ts
import { createEntityService } from '@/services/createEntityService'
import type { SimpananPokok } from '@/types/koperasi/anggota.types'

export const simpananPokokService = createEntityService<SimpananPokok>(
  '/api/resource/Simpanan Pokok Wajib',
)
```

- [ ] **Step 4: Verify no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/services/koperasi/
git commit -m "feat(koperasi/anggota): add nasabah, anggota-koperasi, simpanan-pokok services"
```

---

## Task 3: NasabahInfoTab

**Files:**
- Create: `src/pages/koperasi/anggota/tabs/NasabahInfoTab.tsx`

This tab receives the Nasabah object as a prop and renders a field grid. No network call — data comes from the parent page's query.

- [ ] **Step 1: Create the tab component**

```tsx
// src/pages/koperasi/anggota/tabs/NasabahInfoTab.tsx
import type { Nasabah } from '@/types/koperasi/anggota.types'
import styles from './NasabahTab.module.css'

interface Props {
  nasabah: Nasabah
}

export function NasabahInfoTab({ nasabah }: Props) {
  return (
    <div className={styles.fieldGrid}>
      <div className={styles.fieldItem}>
        <span className={styles.fieldLabel}>Nama Lengkap</span>
        <span className={styles.fieldValue}>{nasabah.nama}</span>
      </div>
      <div className={styles.fieldItem}>
        <span className={styles.fieldLabel}>NIK</span>
        <span className={styles.fieldValue}>{nasabah.nik}</span>
      </div>
      <div className={styles.fieldItem}>
        <span className={styles.fieldLabel}>No. HP</span>
        <span className={styles.fieldValue}>{nasabah.no_hp}</span>
      </div>
      <div className={styles.fieldItem}>
        <span className={styles.fieldLabel}>Jenis Kelamin</span>
        <span className={styles.fieldValue}>{nasabah.jenis_kelamin}</span>
      </div>
      <div className={styles.fieldItem}>
        <span className={styles.fieldLabel}>Tanggal Lahir</span>
        <span className={styles.fieldValue}>
          {new Date(nasabah.tanggal_lahir).toLocaleDateString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric',
          })}
        </span>
      </div>
      <div className={styles.fieldItem}>
        <span className={styles.fieldLabel}>Status</span>
        <span className={`${styles.badge} ${nasabah.status === 'Aktif' ? styles.badgeActive : styles.badgeInactive}`}>
          {nasabah.status}
        </span>
      </div>
      <div className={`${styles.fieldItem} ${styles.fieldItemFull}`}>
        <span className={styles.fieldLabel}>Alamat</span>
        <span className={styles.fieldValue}>{nasabah.alamat}</span>
      </div>
      {nasabah.foto && (
        <div className={`${styles.fieldItem} ${styles.fieldItemFull}`}>
          <span className={styles.fieldLabel}>Foto</span>
          <img src={nasabah.foto} alt={nasabah.nama} className={styles.foto} />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create the shared CSS module for all Nasabah tabs**

```css
/* src/pages/koperasi/anggota/tabs/NasabahTab.module.css */

.fieldGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem 2rem;
  padding: 1.5rem;
}

.fieldItemFull {
  grid-column: 1 / -1;
}

.fieldLabel {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted, #6b7280);
  margin-bottom: 0.25rem;
}

.fieldValue {
  display: block;
  font-size: 0.9375rem;
  color: var(--color-text, #111827);
}

.badge {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.badgeActive {
  background: var(--color-success-light, #d1fae5);
  color: var(--color-success, #065f46);
}

.badgeInactive {
  background: var(--color-neutral-light, #f3f4f6);
  color: var(--color-text-muted, #6b7280);
}

.foto {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid var(--color-border, #e5e7eb);
}

/* ─── Relasi tab (rekening, pembiayaan, kartu) ─── */

.tabContent {
  padding: 1.5rem;
}

.relTable {
  width: 100%;
  border-collapse: collapse;
}

.relTable th,
.relTable td {
  text-align: left;
  padding: 0.625rem 0.875rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  font-size: 0.875rem;
}

.relTable th {
  font-weight: 600;
  color: var(--color-text-muted, #6b7280);
  background: var(--color-surface-secondary, #f9fafb);
}

.relTable tr:hover td {
  background: var(--color-surface-hover, #f3f4f6);
  cursor: pointer;
}

.relLink {
  color: var(--color-primary, #2563eb);
  text-decoration: none;
  font-weight: 500;
}

.relLink:hover {
  text-decoration: underline;
}

.emptyMsg {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted, #6b7280);
  font-size: 0.875rem;
}

.loadingMsg {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted, #6b7280);
  font-size: 0.875rem;
}

.errorMsg {
  padding: 1rem 1.5rem;
  background: var(--color-danger-light, #fee2e2);
  color: var(--color-danger, #b91c1c);
  border-radius: 6px;
  margin: 1.5rem;
  font-size: 0.875rem;
}

.saldo {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}
```

- [ ] **Step 3: Verify TypeScript — no errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/koperasi/anggota/tabs/
git commit -m "feat(koperasi/anggota): add NasabahInfoTab + shared tab CSS"
```

---

## Task 4: NasabahRekeningTab

**Files:**
- Create: `src/pages/koperasi/anggota/tabs/NasabahRekeningTab.tsx`

This tab issues its own React Query call filtered by `nasabah_id`. It does NOT receive rekening data as a prop — it fetches independently.

- [ ] **Step 1: Create the tab component**

```tsx
// src/pages/koperasi/anggota/tabs/NasabahRekeningTab.tsx
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { nasabahService } from '@/services/koperasi/nasabah.service'
import type { RekeningSlim } from '@/types/koperasi/anggota.types'
import styles from './NasabahTab.module.css'

interface Props {
  nasabahId: string
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export function NasabahRekeningTab({ nasabahId }: Props) {
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['nasabah-summary', nasabahId],
    queryFn: () => nasabahService.getNasabahSummary(nasabahId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  if (isLoading) {
    return <p className={styles.loadingMsg}>Memuat data rekening...</p>
  }

  if (error) {
    return (
      <p className={styles.errorMsg}>
        Gagal memuat rekening: {error instanceof Error ? error.message : 'Terjadi kesalahan'}
      </p>
    )
  }

  const rekening: RekeningSlim[] = summary?.rekening ?? []

  if (rekening.length === 0) {
    return <p className={styles.emptyMsg}>Nasabah ini belum memiliki rekening simpanan.</p>
  }

  return (
    <div className={styles.tabContent}>
      <table className={styles.relTable}>
        <thead>
          <tr>
            <th>No. Rekening</th>
            <th>Produk Simpanan</th>
            <th>Saldo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rekening.map((r) => (
            <tr key={r.id}>
              <td>
                <Link to={`/koperasi/simpanan/rekening/${r.id}`} className={styles.relLink}>
                  {r.nomor_rekening}
                </Link>
              </td>
              <td>{r.produk_simpanan}</td>
              <td className={styles.saldo}>{formatRupiah(r.saldo)}</td>
              <td>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript — no errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/koperasi/anggota/tabs/NasabahRekeningTab.tsx
git commit -m "feat(koperasi/anggota): add NasabahRekeningTab with isolated React Query"
```

---

## Task 5: NasabahPembiayaanTab

**Files:**
- Create: `src/pages/koperasi/anggota/tabs/NasabahPembiayaanTab.tsx`

Same pattern as NasabahRekeningTab — fetches from the same `getNasabahSummary` call (TanStack Query deduplicates the network request because the queryKey is identical).

- [ ] **Step 1: Create the tab component**

```tsx
// src/pages/koperasi/anggota/tabs/NasabahPembiayaanTab.tsx
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { nasabahService } from '@/services/koperasi/nasabah.service'
import type { AkadSlim } from '@/types/koperasi/anggota.types'
import styles from './NasabahTab.module.css'

interface Props {
  nasabahId: string
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export function NasabahPembiayaanTab({ nasabahId }: Props) {
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['nasabah-summary', nasabahId],    // Same key as RekeningTab — request is deduped
    queryFn: () => nasabahService.getNasabahSummary(nasabahId),
    staleTime: 1000 * 60 * 5,
  })

  if (isLoading) {
    return <p className={styles.loadingMsg}>Memuat data pembiayaan...</p>
  }

  if (error) {
    return (
      <p className={styles.errorMsg}>
        Gagal memuat pembiayaan: {error instanceof Error ? error.message : 'Terjadi kesalahan'}
      </p>
    )
  }

  const pembiayaan: AkadSlim[] = summary?.pembiayaan ?? []

  if (pembiayaan.length === 0) {
    return <p className={styles.emptyMsg}>Nasabah ini belum memiliki akad pembiayaan.</p>
  }

  return (
    <div className={styles.tabContent}>
      <table className={styles.relTable}>
        <thead>
          <tr>
            <th>No. Akad</th>
            <th>Produk Pembiayaan</th>
            <th>Pokok</th>
            <th>Sisa Pokok</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {pembiayaan.map((a) => (
            <tr key={a.id}>
              <td>
                <Link to={`/koperasi/pembiayaan/akad/${a.id}`} className={styles.relLink}>
                  {a.nomor_akad}
                </Link>
              </td>
              <td>{a.produk_pembiayaan}</td>
              <td className={styles.saldo}>{formatRupiah(a.pokok)}</td>
              <td className={styles.saldo}>{formatRupiah(a.sisa_pokok)}</td>
              <td>{a.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript — no errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/koperasi/anggota/tabs/NasabahPembiayaanTab.tsx
git commit -m "feat(koperasi/anggota): add NasabahPembiayaanTab"
```

---

## Task 6: NasabahKartuTab

**Files:**
- Create: `src/pages/koperasi/anggota/tabs/NasabahKartuTab.tsx`

- [ ] **Step 1: Create the tab component**

```tsx
// src/pages/koperasi/anggota/tabs/NasabahKartuTab.tsx
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { nasabahService } from '@/services/koperasi/nasabah.service'
import type { KartuSlim } from '@/types/koperasi/anggota.types'
import styles from './NasabahTab.module.css'

interface Props {
  nasabahId: string
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

export function NasabahKartuTab({ nasabahId }: Props) {
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['nasabah-summary', nasabahId],    // Deduped with Rekening + Pembiayaan tabs
    queryFn: () => nasabahService.getNasabahSummary(nasabahId),
    staleTime: 1000 * 60 * 5,
  })

  if (isLoading) {
    return <p className={styles.loadingMsg}>Memuat data kartu...</p>
  }

  if (error) {
    return (
      <p className={styles.errorMsg}>
        Gagal memuat kartu: {error instanceof Error ? error.message : 'Terjadi kesalahan'}
      </p>
    )
  }

  const kartu: KartuSlim[] = summary?.kartu ?? []

  if (kartu.length === 0) {
    return <p className={styles.emptyMsg}>Nasabah ini belum memiliki kartu.</p>
  }

  return (
    <div className={styles.tabContent}>
      <table className={styles.relTable}>
        <thead>
          <tr>
            <th>No. Kartu</th>
            <th>Tipe</th>
            <th>UID</th>
            <th>Status</th>
            <th>Saldo E-Money</th>
          </tr>
        </thead>
        <tbody>
          {kartu.map((k) => (
            <tr key={k.id}>
              <td>
                <Link to={`/koperasi/kartu/${k.id}`} className={styles.relLink}>
                  {k.nomor_kartu}
                </Link>
              </td>
              <td style={{ textTransform: 'capitalize' }}>{k.tipe}</td>
              <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{k.uid}</td>
              <td>{k.status}</td>
              <td className={styles.saldo}>
                {k.tipe === 'emoney' && k.saldo_emoney !== undefined
                  ? formatRupiah(k.saldo_emoney)
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript — no errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/koperasi/anggota/tabs/NasabahKartuTab.tsx
git commit -m "feat(koperasi/anggota): add NasabahKartuTab"
```

---

## Task 7: NasabahListPage

**Files:**
- Create: `src/pages/koperasi/anggota/NasabahListPage.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/pages/koperasi/anggota/NasabahListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { nasabahService } from '@/services/koperasi/nasabah.service'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { Nasabah } from '@/types/koperasi/anggota.types'

const COLUMNS: ColumnDef<Nasabah>[] = [
  { key: 'id', header: 'No Anggota', sortable: true },
  { key: 'nama', header: 'Nama', sortable: true },
  { key: 'nik', header: 'NIK', sortable: false },
  { key: 'no_hp', header: 'No. HP', sortable: false },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (row) => (
      <span
        style={{
          display: 'inline-block',
          padding: '0.2rem 0.6rem',
          borderRadius: '999px',
          fontSize: '0.8125rem',
          fontWeight: 600,
          background: row.status === 'Aktif' ? 'var(--color-success-light, #d1fae5)' : 'var(--color-neutral-light, #f3f4f6)',
          color: row.status === 'Aktif' ? 'var(--color-success, #065f46)' : 'var(--color-text-muted, #6b7280)',
        }}
      >
        {row.status}
      </span>
    ),
  },
]

const FILTER_DEFS: FilterDef[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Aktif', value: 'Aktif' },
      { label: 'Non-Aktif', value: 'Non-Aktif' },
    ],
  },
]

const DELETE_CONFIG = {
  onDelete: (row: Nasabah) => nasabahService.delete(row.id),
  dialogTitle: 'Hapus Nasabah?',
  dialogBody: (row: Nasabah) => (
    <>
      Nasabah <strong>{row.nama}</strong> (NIK: {row.nik}) akan dihapus secara permanen.
      Tindakan ini tidak dapat dibatalkan.
    </>
  ),
  successMessage: (row: Nasabah) => `Nasabah ${row.nama} berhasil dihapus.`,
  errorMessage: 'Gagal menghapus nasabah. Pastikan tidak ada data terkait.',
}

export default function NasabahListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<Nasabah>
      title="Daftar Nasabah"
      queryKey="nasabah"
      fetcher={nasabahService.list}
      columns={COLUMNS}
      filterDefs={FILTER_DEFS}
      searchPlaceholder="Cari nama atau NIK..."
      addLabel="Tambah Nasabah"
      onAdd={() => navigate('/koperasi/anggota/new')}
      onRowClick={(row) => navigate(`/koperasi/anggota/${row.id}`)}
      deleteConfig={DELETE_CONFIG}
      exportFilename="nasabah"
      emptyTitle="Belum ada nasabah"
      emptyDescription="Tambah nasabah pertama untuk memulai."
    />
  )
}
```

- [ ] **Step 2: Verify TypeScript — no errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/koperasi/anggota/NasabahListPage.tsx
git commit -m "feat(koperasi/anggota): add NasabahListPage"
```

---

## Task 8: NasabahDetailPage

**Files:**
- Create: `src/pages/koperasi/anggota/NasabahDetailPage.tsx`

The DetailPage fetches the Nasabah record itself. Each tab component receives `nasabahId` and manages its own data — the three relasi tabs all share one TanStack Query cache entry (`['nasabah-summary', nasabahId]`), so the network call fires once no matter which tab is visited first.

- [ ] **Step 1: Create the page**

```tsx
// src/pages/koperasi/anggota/NasabahDetailPage.tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Edit, Trash2 } from 'lucide-react'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { toast } from '@/widgets/Toast/Toast'
import { nasabahService } from '@/services/koperasi/nasabah.service'
import { NasabahInfoTab } from './tabs/NasabahInfoTab'
import { NasabahRekeningTab } from './tabs/NasabahRekeningTab'
import { NasabahPembiayaanTab } from './tabs/NasabahPembiayaanTab'
import { NasabahKartuTab } from './tabs/NasabahKartuTab'

export default function NasabahDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const nasabahId = id!

  const { data: nasabah, isLoading, error } = useQuery({
    queryKey: ['nasabah', nasabahId],
    queryFn: () => nasabahService.getById(nasabahId),
    enabled: !!nasabahId,
  })

  async function handleDelete() {
    if (!nasabah) return
    const confirmed = window.confirm(`Hapus nasabah "${nasabah.nama}"? Tindakan ini tidak dapat dibatalkan.`)
    if (!confirmed) return
    try {
      await nasabahService.delete(nasabahId)
      await queryClient.invalidateQueries({ queryKey: ['nasabah'] })
      toast.success(`Nasabah ${nasabah.nama} berhasil dihapus.`)
      navigate('/koperasi/anggota')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus nasabah.')
    }
  }

  if (isLoading) {
    return <div style={{ padding: '2rem' }}>Memuat data nasabah...</div>
  }

  if (error || !nasabah) {
    return <div style={{ padding: '2rem', color: 'var(--color-danger)' }}>
      Nasabah tidak ditemukan atau terjadi kesalahan.
    </div>
  }

  return (
    <DetailPageTemplate
      title={nasabah.nama}
      code={nasabah.nik}
      onBack={() => navigate('/koperasi/anggota')}
      backLabel="Daftar Nasabah"
      tabs={[
        {
          id: 'info',
          label: 'Info Dasar',
          content: <NasabahInfoTab nasabah={nasabah} />,
        },
        {
          id: 'rekening',
          label: 'Rekening Simpanan',
          content: <NasabahRekeningTab nasabahId={nasabahId} />,
        },
        {
          id: 'pembiayaan',
          label: 'Pembiayaan',
          content: <NasabahPembiayaanTab nasabahId={nasabahId} />,
        },
        {
          id: 'kartu',
          label: 'Kartu',
          content: <NasabahKartuTab nasabahId={nasabahId} />,
        },
      ]}
      actions={[
        {
          label: 'Edit',
          icon: <Edit size={14} />,
          onClick: () => navigate(`/koperasi/anggota/${nasabahId}/edit`),
          variant: 'primary',
        },
        {
          label: 'Hapus',
          icon: <Trash2 size={14} />,
          onClick: handleDelete,
          variant: 'danger',
        },
      ]}
    />
  )
}
```

- [ ] **Step 2: Verify TypeScript — no errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/koperasi/anggota/NasabahDetailPage.tsx
git commit -m "feat(koperasi/anggota): add NasabahDetailPage with 4 tabs"
```

---

## Task 9: NasabahFormPage

**Files:**
- Create: `src/pages/koperasi/anggota/NasabahFormPage.tsx`

Used for both Tambah (`/koperasi/anggota/new`) and Edit (`/koperasi/anggota/:id/edit`). Detects mode by checking if `id` param exists.

- [ ] **Step 1: Create the page**

```tsx
// src/pages/koperasi/anggota/NasabahFormPage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { toast } from '@/widgets/Toast/Toast'
import { nasabahService } from '@/services/koperasi/nasabah.service'
import type { Nasabah, JenisKelamin, NasabahStatus } from '@/types/koperasi/anggota.types'
import styles from './NasabahFormPage.module.css'

interface FormState {
  nama: string
  nik: string
  no_hp: string
  alamat: string
  foto: string
  tanggal_lahir: string
  jenis_kelamin: JenisKelamin
  status: NasabahStatus
}

const EMPTY_FORM: FormState = {
  nama: '',
  nik: '',
  no_hp: '',
  alamat: '',
  foto: '',
  tanggal_lahir: '',
  jenis_kelamin: 'Laki-laki',
  status: 'Aktif',
}

export default function NasabahFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: existing } = useQuery({
    queryKey: ['nasabah', id],
    queryFn: () => nasabahService.getById(id!),
    enabled: isEdit,
  })

  // Populate form when editing
  useEffect(() => {
    if (existing) {
      setForm({
        nama: existing.nama,
        nik: existing.nik,
        no_hp: existing.no_hp,
        alamat: existing.alamat,
        foto: existing.foto ?? '',
        tanggal_lahir: existing.tanggal_lahir,
        jenis_kelamin: existing.jenis_kelamin,
        status: existing.status,
      })
    }
  }, [existing])

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    setIsSubmitting(true)
    try {
      if (isEdit) {
        await nasabahService.update(id!, form)
        await queryClient.invalidateQueries({ queryKey: ['nasabah', id] })
        toast.success('Data nasabah berhasil diperbarui.')
        navigate(`/koperasi/anggota/${id}`)
      } else {
        const created = await nasabahService.create(form)
        await queryClient.invalidateQueries({ queryKey: ['nasabah'] })
        toast.success('Nasabah baru berhasil ditambahkan.')
        navigate(`/koperasi/anggota/${(created as Nasabah).id}`)
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formContent = (
    <div className={styles.formGrid}>
      <div className={styles.formField}>
        <label className={styles.label} htmlFor="nama">Nama Lengkap <span className={styles.required}>*</span></label>
        <input
          id="nama"
          className={styles.input}
          type="text"
          value={form.nama}
          onChange={(e) => handleChange('nama', e.target.value)}
          required
          placeholder="Masukkan nama lengkap"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.label} htmlFor="nik">NIK <span className={styles.required}>*</span></label>
        <input
          id="nik"
          className={styles.input}
          type="text"
          value={form.nik}
          onChange={(e) => handleChange('nik', e.target.value)}
          required
          maxLength={16}
          placeholder="16 digit NIK"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.label} htmlFor="no_hp">No. HP <span className={styles.required}>*</span></label>
        <input
          id="no_hp"
          className={styles.input}
          type="tel"
          value={form.no_hp}
          onChange={(e) => handleChange('no_hp', e.target.value)}
          required
          placeholder="Contoh: 08123456789"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.label} htmlFor="tanggal_lahir">Tanggal Lahir <span className={styles.required}>*</span></label>
        <input
          id="tanggal_lahir"
          className={styles.input}
          type="date"
          value={form.tanggal_lahir}
          onChange={(e) => handleChange('tanggal_lahir', e.target.value)}
          required
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.label} htmlFor="jenis_kelamin">Jenis Kelamin <span className={styles.required}>*</span></label>
        <select
          id="jenis_kelamin"
          className={styles.select}
          value={form.jenis_kelamin}
          onChange={(e) => handleChange('jenis_kelamin', e.target.value as JenisKelamin)}
          required
        >
          <option value="Laki-laki">Laki-laki</option>
          <option value="Perempuan">Perempuan</option>
        </select>
      </div>

      <div className={styles.formField}>
        <label className={styles.label} htmlFor="status">Status <span className={styles.required}>*</span></label>
        <select
          id="status"
          className={styles.select}
          value={form.status}
          onChange={(e) => handleChange('status', e.target.value as NasabahStatus)}
          required
        >
          <option value="Aktif">Aktif</option>
          <option value="Non-Aktif">Non-Aktif</option>
        </select>
      </div>

      <div className={`${styles.formField} ${styles.formFieldFull}`}>
        <label className={styles.label} htmlFor="alamat">Alamat <span className={styles.required}>*</span></label>
        <textarea
          id="alamat"
          className={styles.textarea}
          value={form.alamat}
          onChange={(e) => handleChange('alamat', e.target.value)}
          required
          rows={3}
          placeholder="Alamat lengkap nasabah"
        />
      </div>

      <div className={`${styles.formField} ${styles.formFieldFull}`}>
        <label className={styles.label} htmlFor="foto">URL Foto</label>
        <input
          id="foto"
          className={styles.input}
          type="url"
          value={form.foto}
          onChange={(e) => handleChange('foto', e.target.value)}
          placeholder="https://... (opsional)"
        />
      </div>
    </div>
  )

  return (
    <FormPageTemplate
      title={isEdit ? `Edit Nasabah: ${existing?.nama ?? '...'}` : 'Tambah Nasabah'}
      onBack={() => navigate(isEdit ? `/koperasi/anggota/${id}` : '/koperasi/anggota')}
      backLabel={isEdit ? 'Detail Nasabah' : 'Daftar Nasabah'}
      tabs={[{ id: 'form', label: 'Data Nasabah', content: formContent }]}
      onSubmit={handleSubmit}
      onCancel={() => navigate(isEdit ? `/koperasi/anggota/${id}` : '/koperasi/anggota')}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Simpan Perubahan' : 'Tambah Nasabah'}
      serverError={serverError}
    />
  )
}
```

- [ ] **Step 2: Create the CSS module**

```css
/* src/pages/koperasi/anggota/NasabahFormPage.module.css */

.formGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem 2rem;
  padding: 1.5rem;
}

.formFieldFull {
  grid-column: 1 / -1;
}

.label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin-bottom: 0.375rem;
}

.required {
  color: var(--color-danger, #dc2626);
  margin-left: 0.125rem;
}

.input,
.select,
.textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 6px;
  font-size: 0.9375rem;
  color: var(--color-text, #111827);
  background: var(--color-surface, #ffffff);
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.input:focus,
.select:focus,
.textarea:focus {
  outline: none;
  border-color: var(--color-primary, #2563eb);
  box-shadow: 0 0 0 3px var(--color-primary-light, #dbeafe);
}

.textarea {
  resize: vertical;
}
```

- [ ] **Step 3: Verify TypeScript — no errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/koperasi/anggota/NasabahFormPage.tsx src/pages/koperasi/anggota/NasabahFormPage.module.css
git commit -m "feat(koperasi/anggota): add NasabahFormPage (tambah + edit)"
```

---

## Task 10: AnggotaKoperasiListPage

**Files:**
- Create: `src/pages/koperasi/anggota/AnggotaKoperasiListPage.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/pages/koperasi/anggota/AnggotaKoperasiListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { anggotaKoperasiService } from '@/services/koperasi/anggota-koperasi.service'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { AnggotaKoperasi } from '@/types/koperasi/anggota.types'

const COLUMNS: ColumnDef<AnggotaKoperasi>[] = [
  { key: 'no_anggota', header: 'No Anggota', sortable: true },
  {
    key: 'nasabah_nama',
    header: 'Nama Nasabah',
    sortable: true,
    render: (row) => (
      <a
        href={`/koperasi/anggota/${row.nasabah}`}
        onClick={(e) => e.stopPropagation()}
        style={{ color: 'var(--color-primary, #2563eb)', textDecoration: 'none', fontWeight: 500 }}
      >
        {row.nasabah_nama}
      </a>
    ),
  },
  {
    key: 'tanggal_bergabung',
    header: 'Tanggal Bergabung',
    sortable: true,
    render: (row) =>
      new Date(row.tanggal_bergabung).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric',
      }),
  },
  { key: 'status', header: 'Status', sortable: true },
]

const DELETE_CONFIG = {
  onDelete: (row: AnggotaKoperasi) => anggotaKoperasiService.delete(row.id),
  dialogTitle: 'Hapus Anggota Koperasi?',
  dialogBody: (row: AnggotaKoperasi) => (
    <>
      Data anggota koperasi <strong>{row.nasabah_nama}</strong> (No: {row.no_anggota}) akan dihapus.
    </>
  ),
  successMessage: (row: AnggotaKoperasi) => `Anggota ${row.nasabah_nama} berhasil dihapus.`,
  errorMessage: 'Gagal menghapus anggota koperasi.',
}

export default function AnggotaKoperasiListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<AnggotaKoperasi>
      title="Anggota Koperasi"
      queryKey="anggota-koperasi"
      fetcher={anggotaKoperasiService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari nama atau no anggota..."
      addLabel="Tambah Anggota"
      onAdd={() => navigate('/koperasi/anggota/anggota-koperasi/new')}
      onRowClick={(row) => navigate(`/koperasi/anggota/anggota-koperasi/${row.id}/edit`)}
      deleteConfig={DELETE_CONFIG}
      exportFilename="anggota-koperasi"
      emptyTitle="Belum ada anggota koperasi"
      emptyDescription="Tambah anggota dengan menghubungkan nasabah ke koperasi."
    />
  )
}
```

- [ ] **Step 2: Verify TypeScript — no errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/koperasi/anggota/AnggotaKoperasiListPage.tsx
git commit -m "feat(koperasi/anggota): add AnggotaKoperasiListPage"
```

---

## Task 11: AnggotaKoperasiFormPage

**Files:**
- Create: `src/pages/koperasi/anggota/AnggotaKoperasiFormPage.tsx`

- [ ] **Step 1: Create the page**

The nasabah field is a searchable select: it lists Nasabah records as options. For simplicity, it loads the first 100 nasabah on mount (the pattern used across the codebase before a combobox widget is available).

```tsx
// src/pages/koperasi/anggota/AnggotaKoperasiFormPage.tsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { toast } from '@/widgets/Toast/Toast'
import { anggotaKoperasiService } from '@/services/koperasi/anggota-koperasi.service'
import { nasabahService } from '@/services/koperasi/nasabah.service'
import type { AnggotaKoperasi } from '@/types/koperasi/anggota.types'
import styles from './NasabahFormPage.module.css'   // Reuse form styles

interface FormState {
  nasabah: string
  no_anggota: string
  tanggal_bergabung: string
}

const EMPTY_FORM: FormState = {
  nasabah: '',
  no_anggota: '',
  tanggal_bergabung: new Date().toISOString().slice(0, 10),
}

export default function AnggotaKoperasiFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  // Load existing data when editing
  const { data: existing } = useQuery({
    queryKey: ['anggota-koperasi', id],
    queryFn: () => anggotaKoperasiService.getById(id!),
    enabled: isEdit,
  })

  // Load nasabah list for the select
  const { data: nasabahList } = useQuery({
    queryKey: ['nasabah', { limit: 200 }],
    queryFn: () => nasabahService.list({ limit: 200, sort: 'nama', order: 'asc' }),
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    if (existing) {
      setForm({
        nasabah: existing.nasabah,
        no_anggota: existing.no_anggota,
        tanggal_bergabung: existing.tanggal_bergabung,
      })
    }
  }, [existing])

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    setIsSubmitting(true)
    try {
      if (isEdit) {
        await anggotaKoperasiService.update(id!, form)
        await queryClient.invalidateQueries({ queryKey: ['anggota-koperasi'] })
        toast.success('Data anggota berhasil diperbarui.')
        navigate('/koperasi/anggota/anggota-koperasi')
      } else {
        await anggotaKoperasiService.create(form)
        await queryClient.invalidateQueries({ queryKey: ['anggota-koperasi'] })
        toast.success('Anggota koperasi baru berhasil ditambahkan.')
        navigate('/koperasi/anggota/anggota-koperasi')
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan. Coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formContent = (
    <div className={styles.formGrid}>
      <div className={styles.formField}>
        <label className={styles.label} htmlFor="nasabah">
          Nasabah <span className={styles.required}>*</span>
        </label>
        <select
          id="nasabah"
          className={styles.select}
          value={form.nasabah}
          onChange={(e) => handleChange('nasabah', e.target.value)}
          required
          disabled={isEdit}   // Cannot change nasabah after creation
        >
          <option value="">-- Pilih Nasabah --</option>
          {nasabahList?.items.map((n) => (
            <option key={n.id} value={n.id}>
              {n.nama} — {n.nik}
            </option>
          ))}
        </select>
        {isEdit && (
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            Nasabah tidak dapat diubah setelah anggota terdaftar.
          </p>
        )}
      </div>

      <div className={styles.formField}>
        <label className={styles.label} htmlFor="no_anggota">
          No. Anggota <span className={styles.required}>*</span>
        </label>
        <input
          id="no_anggota"
          className={styles.input}
          type="text"
          value={form.no_anggota}
          onChange={(e) => handleChange('no_anggota', e.target.value)}
          required
          placeholder="Contoh: KOP-2024-001"
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.label} htmlFor="tanggal_bergabung">
          Tanggal Bergabung <span className={styles.required}>*</span>
        </label>
        <input
          id="tanggal_bergabung"
          className={styles.input}
          type="date"
          value={form.tanggal_bergabung}
          onChange={(e) => handleChange('tanggal_bergabung', e.target.value)}
          required
        />
      </div>
    </div>
  )

  return (
    <FormPageTemplate
      title={isEdit ? `Edit Anggota: ${existing?.nasabah_nama ?? '...'}` : 'Tambah Anggota Koperasi'}
      onBack={() => navigate('/koperasi/anggota/anggota-koperasi')}
      backLabel="Anggota Koperasi"
      tabs={[{ id: 'form', label: 'Data Anggota', content: formContent }]}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/koperasi/anggota/anggota-koperasi')}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Simpan Perubahan' : 'Tambah Anggota'}
      serverError={serverError}
    />
  )
}
```

- [ ] **Step 2: Verify TypeScript — no errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/koperasi/anggota/AnggotaKoperasiFormPage.tsx
git commit -m "feat(koperasi/anggota): add AnggotaKoperasiFormPage with nasabah searchable select"
```

---

## Task 12: SimpananPokokListPage

**Files:**
- Create: `src/pages/koperasi/anggota/SimpananPokokListPage.tsx`

Read-only list (no add, no delete). Doctype `Simpanan Pokok Wajib` is system-generated when a nasabah joins the koperasi.

- [ ] **Step 1: Create the page**

```tsx
// src/pages/koperasi/anggota/SimpananPokokListPage.tsx
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { simpananPokokService } from '@/services/koperasi/simpanan-pokok.service'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { SimpananPokok } from '@/types/koperasi/anggota.types'

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

const COLUMNS: ColumnDef<SimpananPokok>[] = [
  { key: 'nasabah_nama', header: 'Nasabah', sortable: true },
  {
    key: 'jumlah',
    header: 'Jumlah',
    sortable: true,
    render: (row) => <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatRupiah(row.jumlah)}</span>,
  },
  {
    key: 'tanggal',
    header: 'Tanggal',
    sortable: true,
    render: (row) =>
      new Date(row.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
  },
  {
    key: 'status_lunas',
    header: 'Status Lunas',
    sortable: true,
    render: (row) => (
      <span
        style={{
          display: 'inline-block',
          padding: '0.2rem 0.6rem',
          borderRadius: '999px',
          fontSize: '0.8125rem',
          fontWeight: 600,
          background: row.status_lunas === 'Lunas'
            ? 'var(--color-success-light, #d1fae5)'
            : 'var(--color-warning-light, #fef3c7)',
          color: row.status_lunas === 'Lunas'
            ? 'var(--color-success, #065f46)'
            : 'var(--color-warning, #92400e)',
        }}
      >
        {row.status_lunas}
      </span>
    ),
  },
]

export default function SimpananPokokListPage() {
  return (
    <ListPageTemplate<SimpananPokok>
      title="Simpanan Pokok Wajib"
      queryKey="simpanan-pokok"
      fetcher={simpananPokokService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari nama nasabah..."
      exportFilename="simpanan-pokok"
      readonly
      emptyTitle="Belum ada simpanan pokok"
      emptyDescription="Simpanan pokok otomatis dibuat saat nasabah bergabung sebagai anggota koperasi."
      helpTitle="Simpanan Pokok Wajib"
      helpText="Data ini dikelola otomatis oleh sistem. Simpanan pokok dibuat saat nasabah mendaftar sebagai anggota koperasi dan tidak dapat diubah secara manual."
    />
  )
}
```

- [ ] **Step 2: Verify TypeScript — no errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/koperasi/anggota/SimpananPokokListPage.tsx
git commit -m "feat(koperasi/anggota): add SimpananPokokListPage (read-only)"
```

---

## Task 13: Wire Routes in `routes.koperasi.tsx`

**Files:**
- Modify: `src/app/routes.koperasi.tsx`

> Note: The infra plan must have already created `routes.koperasi.tsx` with the top-level `/koperasi` route and `AppShell context="koperasi"`. This task only adds child routes for the Anggota module.

- [ ] **Step 1: Add the 8 new child routes**

Open `src/app/routes.koperasi.tsx` and add these entries inside the `children` array of the `/koperasi` route:

```tsx
// Add at the top of the file (lazy imports):
const NasabahListPage          = lazy(() => import('@/pages/koperasi/anggota/NasabahListPage'))
const NasabahDetailPage        = lazy(() => import('@/pages/koperasi/anggota/NasabahDetailPage'))
const NasabahFormPage          = lazy(() => import('@/pages/koperasi/anggota/NasabahFormPage'))
const AnggotaKoperasiListPage  = lazy(() => import('@/pages/koperasi/anggota/AnggotaKoperasiListPage'))
const AnggotaKoperasiFormPage  = lazy(() => import('@/pages/koperasi/anggota/AnggotaKoperasiFormPage'))
const SimpananPokokListPage    = lazy(() => import('@/pages/koperasi/anggota/SimpananPokokListPage'))

// Add in children array:
{ path: 'anggota',                              element: <S><NasabahListPage /></S> },
{ path: 'anggota/new',                          element: <S><NasabahFormPage /></S> },
{ path: 'anggota/:id',                          element: <S><NasabahDetailPage /></S> },
{ path: 'anggota/:id/edit',                     element: <S><NasabahFormPage /></S> },
{ path: 'anggota/anggota-koperasi',             element: <S><AnggotaKoperasiListPage /></S> },
{ path: 'anggota/anggota-koperasi/new',         element: <S><AnggotaKoperasiFormPage /></S> },
{ path: 'anggota/anggota-koperasi/:id/edit',    element: <S><AnggotaKoperasiFormPage /></S> },
{ path: 'anggota/simpanan-pokok',               element: <S><SimpananPokokListPage /></S> },
```

> **Router ordering note:** React Router 6 uses static route matching. The path `anggota/new` must be declared **before** `anggota/:id` in the array to prevent "new" being interpreted as an id. Verify the order above is maintained after editing.

- [ ] **Step 2: Verify no TypeScript errors and the router compiles**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/app/routes.koperasi.tsx
git commit -m "feat(koperasi/anggota): wire Nasabah, AnggotaKoperasi, SimpananPokok routes"
```

---

## Task 14: AppSubNav config — Anggota entries

**Files:**
- Modify: `src/layouts/AppSubNav/subnav.config.ts`

> The infra plan created this file. This task fills in the `koperasi.anggota` entries.

- [ ] **Step 1: Add Anggota submenu entries to the config**

Find the `koperasi` section and add (or replace) the `anggota` key:

```ts
// Inside SUBNAV_CONFIG.koperasi:
anggota: [
  { key: 'nasabah',          label: 'Nasabah',           path: '/koperasi/anggota' },
  { key: 'anggota-koperasi', label: 'Anggota Koperasi',  path: '/koperasi/anggota/anggota-koperasi' },
  { key: 'simpanan-pokok',   label: 'Simpanan Pokok',    path: '/koperasi/anggota/simpanan-pokok' },
],
```

- [ ] **Step 2: Verify TypeScript — no errors**

```bash
npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 3: Commit**

```bash
git add src/layouts/AppSubNav/subnav.config.ts
git commit -m "feat(koperasi/anggota): add Anggota submenu to AppSubNav config"
```

---

## Task 15: Smoke Test — Dev Server

- [ ] **Step 1: Start dev server**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npm run dev
```

Expected: Server starts without compile errors at `http://localhost:5173` (or next available port).

- [ ] **Step 2: Navigate to each route and verify render**

Verify these URLs load without a blank screen or console errors:

| URL | Expected |
|-----|----------|
| `/koperasi/anggota` | NasabahListPage renders with DataTable |
| `/koperasi/anggota/new` | NasabahFormPage renders with 8 form fields |
| `/koperasi/anggota/anggota-koperasi` | AnggotaKoperasiListPage renders |
| `/koperasi/anggota/anggota-koperasi/new` | AnggotaKoperasiFormPage renders with nasabah select |
| `/koperasi/anggota/simpanan-pokok` | SimpananPokokListPage renders, "Hanya Baca" pill visible |

- [ ] **Step 3: Check tab deduplication behavior**

Navigate to `/koperasi/anggota/<any-valid-id>` and open the Network tab in DevTools.

- Switch to the **Rekening Simpanan** tab — one request fires to `get_summary`.
- Switch to **Pembiayaan** tab — no new network request (TanStack Query serves from cache).
- Switch to **Kartu** tab — same, no new request.

Expected: The `get_summary` endpoint is called exactly once regardless of which relasi tab is opened first.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "chore(koperasi/anggota): verified smoke tests pass"
```

---

## Summary of Files Created / Modified

| Path | Action |
|------|--------|
| `src/types/koperasi/anggota.types.ts` | Created |
| `src/services/koperasi/nasabah.service.ts` | Created |
| `src/services/koperasi/anggota-koperasi.service.ts` | Created |
| `src/services/koperasi/simpanan-pokok.service.ts` | Created |
| `src/pages/koperasi/anggota/tabs/NasabahInfoTab.tsx` | Created |
| `src/pages/koperasi/anggota/tabs/NasabahTab.module.css` | Created |
| `src/pages/koperasi/anggota/tabs/NasabahRekeningTab.tsx` | Created |
| `src/pages/koperasi/anggota/tabs/NasabahPembiayaanTab.tsx` | Created |
| `src/pages/koperasi/anggota/tabs/NasabahKartuTab.tsx` | Created |
| `src/pages/koperasi/anggota/NasabahListPage.tsx` | Created |
| `src/pages/koperasi/anggota/NasabahDetailPage.tsx` | Created |
| `src/pages/koperasi/anggota/NasabahFormPage.tsx` | Created |
| `src/pages/koperasi/anggota/NasabahFormPage.module.css` | Created |
| `src/pages/koperasi/anggota/AnggotaKoperasiListPage.tsx` | Created |
| `src/pages/koperasi/anggota/AnggotaKoperasiFormPage.tsx` | Created |
| `src/pages/koperasi/anggota/SimpananPokokListPage.tsx` | Created |
| `src/app/routes.koperasi.tsx` | Modified — 8 new routes added |
| `src/layouts/AppSubNav/subnav.config.ts` | Modified — anggota submenu filled |
