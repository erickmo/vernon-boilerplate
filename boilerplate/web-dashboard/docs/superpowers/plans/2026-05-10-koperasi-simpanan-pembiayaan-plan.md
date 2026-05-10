# Koperasi — Simpanan & Pembiayaan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Simpanan and Pembiayaan modules for the Koperasi dashboard — covering Produk, Rekening/Akad, Transaksi, Permohonan/Pembayaran, and SHU as List, Simple Detail, and Form pages using the existing template components.

**Architecture:** Each entity gets its own page file under `src/pages/koperasi/simpanan/` or `src/pages/koperasi/pembiayaan/`, backed by a typed service created via `createEntityService`, with all types co-located in `src/types/koperasi/`. Pages are wired into `src/app/routes.koperasi.tsx` under the koperasi AppShell, and query keys are registered in `src/services/query-keys.ts`.

**Tech Stack:** React 18, TypeScript (strict), TanStack Query v5, React Router 6, CSS Modules, Vitest + React Testing Library

**Prerequisite:** infra-plan complete (AppSubNav, routes.koperasi.tsx, ChooseDashboardPage exist). koperasi-anggota-plan complete — `Nasabah` type with at least `{ id: string; nama_lengkap: string; nik: string }` must exist at `src/types/koperasi/nasabah.types.ts`.

---

## File Map

### New files — Simpanan

| File | Responsibility |
|------|---------------|
| `src/types/koperasi/simpanan.types.ts` | ProdukSimpanan, RekeningSimapnan, TransaksiSimpanan, PermohonanSimpanan types |
| `src/services/koperasi/simpanan.service.ts` | All simpanan service instances via createEntityService |
| `src/pages/koperasi/simpanan/ProdukSimpananListPage.tsx` | List + row-click → edit form |
| `src/pages/koperasi/simpanan/ProdukSimpananFormPage.tsx` | Create / edit produk |
| `src/pages/koperasi/simpanan/RekeningListPage.tsx` | List with nasabah link column |
| `src/pages/koperasi/simpanan/RekeningDetailPage.tsx` | Simple detail — 3 tabs |
| `src/pages/koperasi/simpanan/RekeningFormPage.tsx` | Edit non-restricted fields only, warning banner |
| `src/pages/koperasi/simpanan/TransaksiSimpananListPage.tsx` | Read-only list with filters |
| `src/pages/koperasi/simpanan/PermohonanListPage.tsx` | All permohonan types |
| `src/pages/koperasi/simpanan/PermohonanDetailPage.tsx` | Simple detail — 2 tabs inc. workflow actions |
| `src/pages/koperasi/simpanan/PermohonanFormPage.tsx` | Create new permohonan |

### New files — Pembiayaan

| File | Responsibility |
|------|---------------|
| `src/types/koperasi/pembiayaan.types.ts` | ProdukPembiayaan, AkadPembiayaan, JadwalAngsuran, PembayaranAngsuran, PembagianSHU, ItemSHUAnggota types |
| `src/services/koperasi/pembiayaan.service.ts` | All pembiayaan service instances |
| `src/pages/koperasi/pembiayaan/ProdukPembiayaanListPage.tsx` | List + row-click → edit form |
| `src/pages/koperasi/pembiayaan/ProdukPembiayaanFormPage.tsx` | Create / edit produk |
| `src/pages/koperasi/pembiayaan/AkadListPage.tsx` | List with nasabah link + status filter |
| `src/pages/koperasi/pembiayaan/AkadDetailPage.tsx` | Simple detail — 3 tabs |
| `src/pages/koperasi/pembiayaan/AkadFormPage.tsx` | Create new akad |
| `src/pages/koperasi/pembiayaan/PembayaranAngsuranListPage.tsx` | List payments |
| `src/pages/koperasi/pembiayaan/PembayaranAngsuranFormPage.tsx` | Record a payment |
| `src/pages/koperasi/pembiayaan/PembagianSHUListPage.tsx` | List SHU periods |
| `src/pages/koperasi/pembiayaan/PembagianSHUDetailPage.tsx` | Simple detail — 2 tabs |

### Modified files

| File | Change |
|------|--------|
| `src/services/query-keys.ts` | Add QK constants for all 10 new entities |
| `src/app/routes.koperasi.tsx` | Add all new routes under /koperasi/simpanan/* and /koperasi/pembiayaan/* |

---

## Task 1: Types — Simpanan

**Files:**
- Create: `src/types/koperasi/simpanan.types.ts`

- [ ] **Step 1.1: Create the types file**

```typescript
// src/types/koperasi/simpanan.types.ts

export type TipeSimpanan = 'Tabungan' | 'Deposito' | 'Giro'
export type StatusRekening = 'Aktif' | 'Dormant' | 'Blokir' | 'Tutup'
export type TipeTransaksiSimpanan = 'Setoran' | 'Penarikan' | 'Bagi Hasil'
export type TipePermohonan =
  | 'Buka Rekening'
  | 'Tutup Rekening'
  | 'Blokir Rekening'
  | 'Unblokir Rekening'
  | 'Aktivasi Dormant'
export type StatusPermohonan = 'Draft' | 'Diajukan' | 'Disetujui' | 'Ditolak'

export interface ProdukSimpanan {
  id: string
  nama: string
  tipe: TipeSimpanan
  nisbah_bagi_hasil: number   // percentage, e.g. 5.5
  min_setoran: number         // rupiah
  keterangan: string
  status: 'Aktif' | 'Tidak Aktif'
}

export interface RekeningSimapnan {
  id: string
  no_rekening: string
  nasabah_id: string
  nasabah_nama: string
  produk_id: string
  produk_nama: string
  saldo: number
  status: StatusRekening
  tanggal_buka: string        // ISO date string
}

export interface TransaksiSimpanan {
  id: string
  rekening_id: string
  no_rekening: string
  nasabah_id: string
  nasabah_nama: string
  tipe: TipeTransaksiSimpanan
  nominal: number
  saldo_sebelum: number
  saldo_sesudah: number
  tanggal: string             // ISO date string
  keterangan?: string
}

export interface PermohonanSimpanan {
  id: string
  tipe: TipePermohonan
  rekening_id: string | null  // null when tipe = 'Buka Rekening'
  no_rekening: string | null
  nasabah_id: string
  nasabah_nama: string
  status: StatusPermohonan
  alasan: string
  catatan_reviewer?: string
  tanggal: string             // ISO date string
  reviewed_by?: string
  reviewed_at?: string        // ISO date string
}
```

- [ ] **Step 1.2: Verify the file has no TypeScript errors**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `simpanan.types.ts`

- [ ] **Step 1.3: Commit**

```bash
git add src/types/koperasi/simpanan.types.ts
git commit -m "feat(koperasi): add simpanan domain types"
```

---

## Task 2: Types — Pembiayaan

**Files:**
- Create: `src/types/koperasi/pembiayaan.types.ts`

- [ ] **Step 2.1: Create the types file**

```typescript
// src/types/koperasi/pembiayaan.types.ts

export type JenisAkad = 'Murabahah' | 'Mudharabah' | 'Musyarakah' | 'Ijarah' | 'Qardh'
export type StatusAkad = 'Pengajuan' | 'Aktif' | 'Lunas' | 'Macet' | 'Ditolak'
export type StatusBayarAngsuran = 'Belum' | 'Sebagian' | 'Lunas' | 'Lewat Jatuh Tempo'
export type StatusPembagianSHU = 'Draft' | 'Diproses' | 'Selesai'

export interface ProdukPembiayaan {
  id: string
  nama: string
  akad: JenisAkad
  margin: number              // percentage, e.g. 2.5
  tenor_max: number           // bulan
  keterangan: string
  status: 'Aktif' | 'Tidak Aktif'
}

export interface AkadPembiayaan {
  id: string
  no_akad: string
  nasabah_id: string
  nasabah_nama: string
  produk_id: string
  produk_nama: string
  akad: JenisAkad
  nominal_pokok: number
  tenor: number               // bulan
  sisa_pokok: number
  tujuan_pembiayaan: string
  tanggal_akad: string        // ISO date string
  agunan: string
  status: StatusAkad
}

export interface JadwalAngsuran {
  id: string
  akad_id: string
  no_angsuran: number
  tanggal_jatuh_tempo: string // ISO date string
  pokok: number
  margin: number
  total: number
  status_bayar: StatusBayarAngsuran
}

export interface PembayaranAngsuran {
  id: string
  akad_id: string
  no_akad: string
  nasabah_id: string
  nasabah_nama: string
  jadwal_id: string
  no_angsuran: number
  nominal: number
  tanggal_bayar: string       // ISO date string
  keterangan?: string
}

export interface ItemSHUAnggota {
  id: string
  shu_id: string
  nasabah_id: string
  nasabah_nama: string
  porsi_persen: number        // e.g. 2.34
  nominal: number
}

export interface PembagianSHU {
  id: string
  periode: string             // e.g. "2025"
  total_shu: number
  status: StatusPembagianSHU
  tanggal: string             // ISO date string
  jumlah_anggota: number
}
```

- [ ] **Step 2.2: Verify no TypeScript errors**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `pembiayaan.types.ts`

- [ ] **Step 2.3: Commit**

```bash
git add src/types/koperasi/pembiayaan.types.ts
git commit -m "feat(koperasi): add pembiayaan domain types"
```

---

## Task 3: Query Keys

**Files:**
- Modify: `src/services/query-keys.ts`

- [ ] **Step 3.1: Add koperasi simpanan + pembiayaan keys to QK**

Open `src/services/query-keys.ts` and add after the existing `mediaFiles` key:

```typescript
  // ── Koperasi — Simpanan ──────────────────────────────────────────────────
  produkSimpanan: 'produk-simpanan',
  produkSimpananDetail: 'produk-simpanan-detail',
  rekeningSimapnan: 'rekening-simpanan',
  rekeningSimapnanDetail: 'rekening-simpanan-detail',
  transaksiSimpanan: 'transaksi-simpanan',
  permohonanSimpanan: 'permohonan-simpanan',
  permohonanSimpananDetail: 'permohonan-simpanan-detail',

  // ── Koperasi — Pembiayaan ────────────────────────────────────────────────
  produkPembiayaan: 'produk-pembiayaan',
  produkPembiayaanDetail: 'produk-pembiayaan-detail',
  akadPembiayaan: 'akad-pembiayaan',
  akadPembiayaanDetail: 'akad-pembiayaan-detail',
  jadwalAngsuran: 'jadwal-angsuran',
  pembayaranAngsuran: 'pembayaran-angsuran',
  pembagianSHU: 'pembagian-shu',
  pembagianSHUDetail: 'pembagian-shu-detail',
```

- [ ] **Step 3.2: Verify no TypeScript errors**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3.3: Commit**

```bash
git add src/services/query-keys.ts
git commit -m "feat(koperasi): register simpanan and pembiayaan query keys"
```

---

## Task 4: Services — Simpanan

**Files:**
- Create: `src/services/koperasi/simpanan.service.ts`

> The Frappe base URL pattern is: `POST https://<site>/api/method/sekolahpro.<module>.api.<endpoint>`. For REST list/detail/create/update/delete, the apiClient uses REST endpoints directly via the `createEntityService` helper.

- [ ] **Step 4.1: Create the service file**

```typescript
// src/services/koperasi/simpanan.service.ts
import { createEntityService } from '@/services/createEntityService'
import { apiClient } from '@/services/api.client'
import type { ProdukSimpanan, RekeningSimapnan, TransaksiSimpanan, PermohonanSimpanan } from '@/types/koperasi/simpanan.types'
import type { ListParams } from '@/services/createEntityService'
import type { PaginatedResponse } from '@/types/api.types'

export const produkSimpananService = createEntityService<ProdukSimpanan>(
  '/api/resource/Produk Simpanan',
)

const rekeningBase = createEntityService<RekeningSimapnan>(
  '/api/resource/Rekening Simpanan',
)

export const rekeningSimapnanService = {
  ...rekeningBase,

  /** Transaksi linked to a specific rekening */
  listTransaksi: (rekeningId: string, params?: ListParams): Promise<PaginatedResponse<TransaksiSimpanan>> =>
    apiClient.get(`/api/resource/Transaksi Simpanan${buildQS({ ...params, rekening_id: rekeningId })}`),

  /** Permohonan linked to a specific rekening */
  listPermohonan: (rekeningId: string, params?: ListParams): Promise<PaginatedResponse<PermohonanSimpanan>> =>
    apiClient.get(`/api/resource/Permohonan Simpanan${buildQS({ ...params, rekening_id: rekeningId })}`),
}

export const transaksiSimpananService = createEntityService<TransaksiSimpanan>(
  '/api/resource/Transaksi Simpanan',
)

const permohonanBase = createEntityService<PermohonanSimpanan>(
  '/api/resource/Permohonan Simpanan',
)

export const permohonanSimpananService = {
  ...permohonanBase,

  approve: (id: string): Promise<PermohonanSimpanan> =>
    apiClient.post(`/api/method/sekolahpro.simpanan.api.approve_permohonan`, { permohonan_id: id }),

  reject: (id: string, alasan: string): Promise<PermohonanSimpanan> =>
    apiClient.post(`/api/method/sekolahpro.simpanan.api.reject_permohonan`, { permohonan_id: id, alasan }),
}

// ─── Internal helper ──────────────────────────────────────────────────────────

function buildQS(params?: Record<string, unknown>): string {
  if (!params) return ''
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}
```

- [ ] **Step 4.2: Verify no TypeScript errors**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4.3: Commit**

```bash
git add src/services/koperasi/simpanan.service.ts
git commit -m "feat(koperasi): add simpanan service"
```

---

## Task 5: Services — Pembiayaan

**Files:**
- Create: `src/services/koperasi/pembiayaan.service.ts`

- [ ] **Step 5.1: Create the service file**

```typescript
// src/services/koperasi/pembiayaan.service.ts
import { createEntityService } from '@/services/createEntityService'
import { apiClient } from '@/services/api.client'
import type { ProdukPembiayaan, AkadPembiayaan, JadwalAngsuran, PembayaranAngsuran, PembagianSHU, ItemSHUAnggota } from '@/types/koperasi/pembiayaan.types'
import type { ListParams } from '@/services/createEntityService'
import type { PaginatedResponse } from '@/types/api.types'

export const produkPembiayaanService = createEntityService<ProdukPembiayaan>(
  '/api/resource/Produk Pembiayaan',
)

const akadBase = createEntityService<AkadPembiayaan>(
  '/api/resource/Akad Pembiayaan',
)

export const akadPembiayaanService = {
  ...akadBase,

  /** Jadwal angsuran for a specific akad */
  listJadwal: (akadId: string, params?: ListParams): Promise<PaginatedResponse<JadwalAngsuran>> =>
    apiClient.get(`/api/resource/Jadwal Angsuran${buildQS({ ...params, akad_id: akadId })}`),

  /** Payment history for a specific akad */
  listPembayaran: (akadId: string, params?: ListParams): Promise<PaginatedResponse<PembayaranAngsuran>> =>
    apiClient.get(`/api/resource/Pembayaran Angsuran${buildQS({ ...params, akad_id: akadId })}`),
}

export const pembayaranAngsuranService = createEntityService<PembayaranAngsuran>(
  '/api/resource/Pembayaran Angsuran',
)

const shuBase = createEntityService<PembagianSHU>(
  '/api/resource/Pembagian SHU',
)

export const pembagianSHUService = {
  ...shuBase,

  /** Per-anggota items for a specific SHU period */
  listItems: (shuId: string, params?: ListParams): Promise<PaginatedResponse<ItemSHUAnggota>> =>
    apiClient.get(`/api/resource/Item SHU Anggota${buildQS({ ...params, shu_id: shuId })}`),
}

// ─── Internal helper ──────────────────────────────────────────────────────────

function buildQS(params?: Record<string, unknown>): string {
  if (!params) return ''
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}
```

- [ ] **Step 5.2: Verify no TypeScript errors**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5.3: Commit**

```bash
git add src/services/koperasi/pembiayaan.service.ts
git commit -m "feat(koperasi): add pembiayaan service"
```

---

## Task 6: ProdukSimpananListPage + ProdukSimpananFormPage

**Files:**
- Create: `src/pages/koperasi/simpanan/ProdukSimpananListPage.tsx`
- Create: `src/pages/koperasi/simpanan/ProdukSimpananFormPage.tsx`

- [ ] **Step 6.1: Write ProdukSimpananListPage**

```tsx
// src/pages/koperasi/simpanan/ProdukSimpananListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { produkSimpananService } from '@/services/koperasi/simpanan.service'
import { QK } from '@/services/query-keys'
import type { ColumnDef, DeleteConfig } from '@/widgets/DataTable/DataTable'
import type { ProdukSimpanan } from '@/types/koperasi/simpanan.types'

const COLUMNS: ColumnDef<ProdukSimpanan>[] = [
  { key: 'nama', label: 'Nama Produk', sortable: true },
  { key: 'tipe', label: 'Tipe', sortable: true },
  {
    key: 'nisbah_bagi_hasil',
    label: 'Bagi Hasil %',
    render: (row) => `${row.nisbah_bagi_hasil}%`,
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <span style={{ color: row.status === 'Aktif' ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
        {row.status}
      </span>
    ),
  },
]

const DELETE_CONFIG: DeleteConfig<ProdukSimpanan> = {
  onDelete: (row) => produkSimpananService.delete(row.id),
  dialogTitle: 'Hapus Produk Simpanan?',
  dialogBody: (row) => `Produk "${row.nama}" akan dihapus permanen.`,
  successMessage: (row) => `Produk "${row.nama}" berhasil dihapus.`,
}

export function ProdukSimpananListPage() {
  const navigate = useNavigate()
  return (
    <ListPageTemplate<ProdukSimpanan>
      title="Produk Simpanan"
      addLabel="Tambah Produk"
      onAdd={() => navigate('new')}
      queryKey={QK.produkSimpanan}
      fetcher={produkSimpananService.list}
      columns={COLUMNS}
      onRowClick={(row) => navigate(`${row.id}/edit`)}
      searchPlaceholder="Cari produk..."
      exportFilename="produk-simpanan"
      deleteConfig={DELETE_CONFIG}
    />
  )
}
```

- [ ] **Step 6.2: Write ProdukSimpananFormPage**

```tsx
// src/pages/koperasi/simpanan/ProdukSimpananFormPage.tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { produkSimpananService } from '@/services/koperasi/simpanan.service'
import { QK } from '@/services/query-keys'
import { toast } from '@/widgets/Toast/Toast'
import type { ProdukSimpanan, TipeSimpanan } from '@/types/koperasi/simpanan.types'
import styles from './ProdukSimpananFormPage.module.css'

const TIPE_OPTIONS: TipeSimpanan[] = ['Tabungan', 'Deposito', 'Giro']

export function ProdukSimpananFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const qc = useQueryClient()

  const { data: existing } = useQuery({
    queryKey: [QK.produkSimpananDetail, id],
    queryFn: () => produkSimpananService.getById(id!),
    enabled: isEdit,
  })

  const [form, setForm] = useState<Partial<ProdukSimpanan>>({
    nama: '',
    tipe: 'Tabungan',
    nisbah_bagi_hasil: 0,
    min_setoran: 0,
    keterangan: '',
    status: 'Aktif',
  })

  // Populate form when edit data arrives
  if (isEdit && existing && form.nama === '' && existing.nama) {
    setForm({
      nama: existing.nama,
      tipe: existing.tipe,
      nisbah_bagi_hasil: existing.nisbah_bagi_hasil,
      min_setoran: existing.min_setoran,
      keterangan: existing.keterangan,
      status: existing.status,
    })
  }

  const mutation = useMutation({
    mutationFn: (data: Partial<ProdukSimpanan>) =>
      isEdit
        ? produkSimpananService.update(id!, data)
        : produkSimpananService.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QK.produkSimpanan] })
      toast.success(isEdit ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.')
      navigate('/koperasi/simpanan/produk')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate(form)
  }

  const formFields = (
    <div className={styles.fields}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Nama Produk</label>
        <input
          className={styles.input}
          value={form.nama ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Tipe</label>
        <select
          className={styles.input}
          value={form.tipe}
          onChange={(e) => setForm((f) => ({ ...f, tipe: e.target.value as TipeSimpanan }))}
        >
          {TIPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Nisbah Bagi Hasil (%)</label>
        <input
          className={styles.input}
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={form.nisbah_bagi_hasil ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, nisbah_bagi_hasil: parseFloat(e.target.value) }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Minimum Setoran (Rp)</label>
        <input
          className={styles.input}
          type="number"
          min={0}
          value={form.min_setoran ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, min_setoran: parseInt(e.target.value, 10) }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Keterangan</label>
        <textarea
          className={styles.textarea}
          value={form.keterangan ?? ''}
          rows={3}
          onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
        />
      </div>
      {isEdit && (
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Status</label>
          <select
            className={styles.input}
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'Aktif' | 'Tidak Aktif' }))}
          >
            <option value="Aktif">Aktif</option>
            <option value="Tidak Aktif">Tidak Aktif</option>
          </select>
        </div>
      )}
    </div>
  )

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Produk Simpanan' : 'Tambah Produk Simpanan'}
      onBack={() => navigate('/koperasi/simpanan/produk')}
      onCancel={() => navigate('/koperasi/simpanan/produk')}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={mutation.error instanceof Error ? mutation.error.message : undefined}
      tabs={[{ id: 'form', label: 'Data Produk', content: formFields }]}
    />
  )
}
```

- [ ] **Step 6.3: Create CSS module stub**

Create `src/pages/koperasi/simpanan/ProdukSimpananFormPage.module.css`:

```css
.fields { display: flex; flex-direction: column; gap: 16px; padding: 24px; }
.fieldGroup { display: flex; flex-direction: column; gap: 6px; }
.label { font-size: 13px; font-weight: 500; color: var(--color-text-secondary); }
.input { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 14px; }
.textarea { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 14px; resize: vertical; }
```

- [ ] **Step 6.4: Verify no TypeScript errors**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 6.5: Commit**

```bash
git add src/pages/koperasi/simpanan/ProdukSimpananListPage.tsx \
        src/pages/koperasi/simpanan/ProdukSimpananFormPage.tsx \
        src/pages/koperasi/simpanan/ProdukSimpananFormPage.module.css
git commit -m "feat(koperasi/simpanan): add ProdukSimpanan list and form pages"
```

---

## Task 7: RekeningListPage

**Files:**
- Create: `src/pages/koperasi/simpanan/RekeningListPage.tsx`

- [ ] **Step 7.1: Write RekeningListPage**

```tsx
// src/pages/koperasi/simpanan/RekeningListPage.tsx
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { rekeningSimapnanService } from '@/services/koperasi/simpanan.service'
import { QK } from '@/services/query-keys'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { RekeningSimapnan } from '@/types/koperasi/simpanan.types'

const COLUMNS: ColumnDef<RekeningSimapnan>[] = [
  { key: 'no_rekening', label: 'No Rekening', sortable: true },
  {
    key: 'nasabah_nama',
    label: 'Nasabah',
    render: (row) => (
      <Link
        to={`/koperasi/anggota/${row.nasabah_id}`}
        onClick={(e) => e.stopPropagation()}
        style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
      >
        {row.nasabah_nama}
      </Link>
    ),
  },
  { key: 'produk_nama', label: 'Produk', sortable: true },
  {
    key: 'saldo',
    label: 'Saldo',
    render: (row) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(row.saldo),
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => {
      const colors: Record<string, string> = {
        Aktif: 'var(--color-success)',
        Dormant: 'var(--color-warning)',
        Blokir: 'var(--color-danger)',
        Tutup: 'var(--color-text-tertiary)',
      }
      return <span style={{ color: colors[row.status] ?? 'inherit' }}>{row.status}</span>
    },
  },
]

export function RekeningListPage() {
  const navigate = useNavigate()
  return (
    <ListPageTemplate<RekeningSimapnan>
      title="Rekening Simpanan"
      queryKey={QK.rekeningSimapnan}
      fetcher={rekeningSimapnanService.list}
      columns={COLUMNS}
      onRowClick={(row) => navigate(`${row.id}`)}
      searchPlaceholder="Cari no rekening atau nasabah..."
      exportFilename="rekening-simpanan"
    />
  )
}
```

- [ ] **Step 7.2: Verify no TypeScript errors**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 7.3: Commit**

```bash
git add src/pages/koperasi/simpanan/RekeningListPage.tsx
git commit -m "feat(koperasi/simpanan): add RekeningListPage"
```

---

## Task 8: RekeningDetailPage (3 tabs)

**Files:**
- Create: `src/pages/koperasi/simpanan/RekeningDetailPage.tsx`

- [ ] **Step 8.1: Write RekeningDetailPage**

```tsx
// src/pages/koperasi/simpanan/RekeningDetailPage.tsx
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Edit } from 'lucide-react'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { rekeningSimapnanService } from '@/services/koperasi/simpanan.service'
import { QK } from '@/services/query-keys'
import type { RekeningSimapnan, TransaksiSimpanan, PermohonanSimpanan } from '@/types/koperasi/simpanan.types'
import type { PaginatedResponse } from '@/types/api.types'
import styles from './RekeningDetailPage.module.css'

// ─── Info Tab ────────────────────────────────────────────────────────────────

function InfoTab({ rekening }: { rekening: RekeningSimapnan }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  return (
    <div className={styles.infoGrid}>
      <InfoRow label="No Rekening" value={rekening.no_rekening} />
      <InfoRow
        label="Nasabah"
        value={
          <Link to={`/koperasi/anggota/${rekening.nasabah_id}`} className={styles.nasabahLink}>
            {rekening.nasabah_nama} →
          </Link>
        }
      />
      <InfoRow label="Produk" value={rekening.produk_nama} />
      <InfoRow label="Saldo" value={fmt(rekening.saldo)} />
      <InfoRow label="Status" value={rekening.status} />
      <InfoRow label="Tanggal Buka" value={new Date(rekening.tanggal_buka).toLocaleDateString('id-ID')} />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  )
}

// ─── Transaksi Tab ───────────────────────────────────────────────────────────

function TransaksiTab({ rekeningId }: { rekeningId: string }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  const { data, isLoading } = useQuery<PaginatedResponse<TransaksiSimpanan>>({
    queryKey: [QK.transaksiSimpanan, rekeningId],
    queryFn: () => rekeningSimapnanService.listTransaksi(rekeningId),
  })

  if (isLoading) return <div className={styles.loading}>Memuat...</div>

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Tipe</th>
          <th>Nominal</th>
          <th>Saldo Sebelum</th>
          <th>Saldo Sesudah</th>
          <th>Tanggal</th>
        </tr>
      </thead>
      <tbody>
        {(data?.items ?? []).map((trx) => (
          <tr key={trx.id}>
            <td>{trx.tipe}</td>
            <td>{fmt(trx.nominal)}</td>
            <td>{fmt(trx.saldo_sebelum)}</td>
            <td>{fmt(trx.saldo_sesudah)}</td>
            <td>{new Date(trx.tanggal).toLocaleDateString('id-ID')}</td>
          </tr>
        ))}
        {(data?.items ?? []).length === 0 && (
          <tr><td colSpan={5} className={styles.empty}>Belum ada transaksi</td></tr>
        )}
      </tbody>
    </table>
  )
}

// ─── Permohonan Tab ──────────────────────────────────────────────────────────

function PermohonanTab({ rekeningId }: { rekeningId: string }) {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery<PaginatedResponse<PermohonanSimpanan>>({
    queryKey: [QK.permohonanSimpanan, rekeningId],
    queryFn: () => rekeningSimapnanService.listPermohonan(rekeningId),
  })

  if (isLoading) return <div className={styles.loading}>Memuat...</div>

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Tipe</th>
          <th>Status</th>
          <th>Alasan</th>
          <th>Tanggal</th>
        </tr>
      </thead>
      <tbody>
        {(data?.items ?? []).map((p) => (
          <tr key={p.id} className={styles.clickable} onClick={() => navigate(`/koperasi/simpanan/permohonan/${p.id}`)}>
            <td>{p.tipe}</td>
            <td>{p.status}</td>
            <td>{p.alasan}</td>
            <td>{new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
          </tr>
        ))}
        {(data?.items ?? []).length === 0 && (
          <tr><td colSpan={4} className={styles.empty}>Belum ada permohonan</td></tr>
        )}
      </tbody>
    </table>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function RekeningDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { data: rekening, isLoading } = useQuery<RekeningSimapnan>({
    queryKey: [QK.rekeningSimapnanDetail, id],
    queryFn: () => rekeningSimapnanService.getById(id!),
    enabled: !!id,
  })

  if (isLoading || !rekening) {
    return <div className={styles.loading}>Memuat rekening...</div>
  }

  return (
    <DetailPageTemplate
      title={rekening.no_rekening}
      code={rekening.status}
      badges={
        <Link to={`/koperasi/anggota/${rekening.nasabah_id}`} className={styles.nasabahBadge}>
          ← {rekening.nasabah_nama}
        </Link>
      }
      onBack={() => navigate('/koperasi/simpanan/rekening')}
      actions={[
        {
          label: 'Edit',
          icon: <Edit size={14} />,
          onClick: () => navigate('edit'),
          variant: 'primary',
        },
      ]}
      tabs={[
        { id: 'info', label: 'Info Rekening', content: <InfoTab rekening={rekening} /> },
        { id: 'transaksi', label: 'Transaksi', content: <TransaksiTab rekeningId={id!} /> },
        { id: 'permohonan', label: 'Permohonan', content: <PermohonanTab rekeningId={id!} /> },
      ]}
    />
  )
}
```

- [ ] **Step 8.2: Create CSS module**

Create `src/pages/koperasi/simpanan/RekeningDetailPage.module.css`:

```css
.loading { padding: 32px; text-align: center; color: var(--color-text-tertiary); }
.nasabahLink { color: var(--color-primary); font-weight: 600; text-decoration: none; }
.nasabahLink:hover { text-decoration: underline; }
.nasabahBadge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: var(--color-primary-soft); color: var(--color-primary); border-radius: 20px; font-size: 13px; font-weight: 500; text-decoration: none; }
.infoGrid { display: flex; flex-direction: column; gap: 0; padding: 8px 0; }
.infoRow { display: grid; grid-template-columns: 180px 1fr; gap: 12px; padding: 12px 24px; border-bottom: 1px solid var(--color-border-light); }
.infoLabel { font-size: 13px; color: var(--color-text-secondary); }
.infoValue { font-size: 14px; color: var(--color-text-primary); font-weight: 500; }
.table { width: 100%; border-collapse: collapse; font-size: 14px; }
.table th { text-align: left; padding: 10px 16px; background: var(--color-surface-hover); font-size: 12px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
.table td { padding: 12px 16px; border-bottom: 1px solid var(--color-border-light); }
.clickable { cursor: pointer; }
.clickable:hover td { background: var(--color-surface-hover); }
.empty { text-align: center; color: var(--color-text-tertiary); padding: 32px; }
```

- [ ] **Step 8.3: Verify no TypeScript errors**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 8.4: Commit**

```bash
git add src/pages/koperasi/simpanan/RekeningDetailPage.tsx \
        src/pages/koperasi/simpanan/RekeningDetailPage.module.css
git commit -m "feat(koperasi/simpanan): add RekeningDetailPage with 3 tabs"
```

---

## Task 9: RekeningFormPage (edit only, restricted fields warning)

**Files:**
- Create: `src/pages/koperasi/simpanan/RekeningFormPage.tsx`

- [ ] **Step 9.1: Write RekeningFormPage**

```tsx
// src/pages/koperasi/simpanan/RekeningFormPage.tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { rekeningSimapnanService } from '@/services/koperasi/simpanan.service'
import { QK } from '@/services/query-keys'
import { toast } from '@/widgets/Toast/Toast'
import type { RekeningSimapnan } from '@/types/koperasi/simpanan.types'
import styles from './RekeningFormPage.module.css'

// Only these fields can be edited directly.
// status and tanggal_buka MUST go through Permohonan workflow.
type EditableFields = Pick<RekeningSimapnan, 'produk_id' | 'produk_nama'>

export function RekeningFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: rekening, isLoading } = useQuery<RekeningSimapnan>({
    queryKey: [QK.rekeningSimapnanDetail, id],
    queryFn: () => rekeningSimapnanService.getById(id!),
    enabled: !!id,
  })

  const [form, setForm] = useState<Partial<EditableFields>>({})

  if (rekening && form.produk_id === undefined) {
    setForm({ produk_id: rekening.produk_id, produk_nama: rekening.produk_nama })
  }

  const mutation = useMutation({
    mutationFn: (data: Partial<RekeningSimapnan>) =>
      rekeningSimapnanService.update(id!, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QK.rekeningSimapnanDetail, id] })
      toast.success('Rekening berhasil diperbarui.')
      navigate(`/koperasi/simpanan/rekening/${id}`)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate(form)
  }

  if (isLoading || !rekening) {
    return <div className={styles.loading}>Memuat rekening...</div>
  }

  const restrictedBanner = (
    <div className={styles.warningBanner}>
      <AlertTriangle size={16} />
      <span>
        <strong>Catatan:</strong> Status rekening dan tanggal buka tidak dapat diubah langsung.
        Gunakan <strong>Permohonan</strong> untuk mengubah status (blokir, tutup, dll).
      </span>
    </div>
  )

  const formFields = (
    <div className={styles.fields}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>No Rekening</label>
        <input className={styles.inputReadonly} value={rekening.no_rekening} readOnly disabled />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Nasabah</label>
        <input className={styles.inputReadonly} value={rekening.nasabah_nama} readOnly disabled />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Status</label>
        <input className={styles.inputReadonly} value={rekening.status} readOnly disabled />
        <span className={styles.hint}>Ubah status via menu Permohonan.</span>
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Tanggal Buka</label>
        <input className={styles.inputReadonly} value={new Date(rekening.tanggal_buka).toLocaleDateString('id-ID')} readOnly disabled />
        <span className={styles.hint}>Tidak dapat diubah.</span>
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Produk Simpanan (ID)</label>
        <input
          className={styles.input}
          value={form.produk_id ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, produk_id: e.target.value }))}
        />
      </div>
    </div>
  )

  return (
    <FormPageTemplate
      title={`Edit Rekening — ${rekening.no_rekening}`}
      onBack={() => navigate(`/koperasi/simpanan/rekening/${id}`)}
      onCancel={() => navigate(`/koperasi/simpanan/rekening/${id}`)}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={mutation.error instanceof Error ? mutation.error.message : undefined}
      beforeTabsContent={restrictedBanner}
      tabs={[{ id: 'form', label: 'Edit Rekening', content: formFields }]}
    />
  )
}
```

- [ ] **Step 9.2: Create CSS module**

Create `src/pages/koperasi/simpanan/RekeningFormPage.module.css`:

```css
.loading { padding: 32px; text-align: center; color: var(--color-text-tertiary); }
.warningBanner { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; background: var(--color-warning-soft, #fff8e6); border: 1px solid var(--color-warning, #f59e0b); border-radius: 8px; margin-bottom: 8px; font-size: 14px; color: var(--color-text-primary); }
.fields { display: flex; flex-direction: column; gap: 16px; padding: 24px; }
.fieldGroup { display: flex; flex-direction: column; gap: 6px; }
.label { font-size: 13px; font-weight: 500; color: var(--color-text-secondary); }
.input { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 14px; }
.inputReadonly { padding: 8px 12px; border: 1px solid var(--color-border-light); border-radius: 6px; font-size: 14px; background: var(--color-surface-hover); color: var(--color-text-tertiary); cursor: not-allowed; }
.hint { font-size: 12px; color: var(--color-text-tertiary); }
```

- [ ] **Step 9.3: Verify no TypeScript errors**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 9.4: Commit**

```bash
git add src/pages/koperasi/simpanan/RekeningFormPage.tsx \
        src/pages/koperasi/simpanan/RekeningFormPage.module.css
git commit -m "feat(koperasi/simpanan): add RekeningFormPage with restricted-fields warning"
```

---

## Task 10: TransaksiSimpananListPage (read-only)

**Files:**
- Create: `src/pages/koperasi/simpanan/TransaksiSimpananListPage.tsx`

- [ ] **Step 10.1: Write TransaksiSimpananListPage**

```tsx
// src/pages/koperasi/simpanan/TransaksiSimpananListPage.tsx
import { Link } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { transaksiSimpananService } from '@/services/koperasi/simpanan.service'
import { QK } from '@/services/query-keys'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { TransaksiSimpanan, TipeTransaksiSimpanan } from '@/types/koperasi/simpanan.types'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const COLUMNS: ColumnDef<TransaksiSimpanan>[] = [
  { key: 'no_rekening', label: 'No Rekening', sortable: true },
  {
    key: 'nasabah_nama',
    label: 'Nasabah',
    render: (row) => (
      <Link
        to={`/koperasi/anggota/${row.nasabah_id}`}
        onClick={(e) => e.stopPropagation()}
        style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
      >
        {row.nasabah_nama}
      </Link>
    ),
  },
  { key: 'tipe', label: 'Tipe', sortable: true },
  {
    key: 'nominal',
    label: 'Nominal',
    render: (row) => fmt(row.nominal),
  },
  {
    key: 'tanggal',
    label: 'Tanggal',
    sortable: true,
    render: (row) => new Date(row.tanggal).toLocaleDateString('id-ID'),
  },
]

const TIPE_OPTIONS: TipeTransaksiSimpanan[] = ['Setoran', 'Penarikan', 'Bagi Hasil']

const FILTER_DEFS: FilterDef[] = [
  {
    key: 'tipe',
    label: 'Tipe Transaksi',
    type: 'select',
    options: TIPE_OPTIONS.map((t) => ({ value: t, label: t })),
  },
  { key: 'tanggal_from', label: 'Dari Tanggal', type: 'date' },
  { key: 'tanggal_to', label: 'Sampai Tanggal', type: 'date' },
]

export function TransaksiSimpananListPage() {
  return (
    <ListPageTemplate<TransaksiSimpanan>
      title="Transaksi Simpanan"
      queryKey={QK.transaksiSimpanan}
      fetcher={transaksiSimpananService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari no rekening atau nasabah..."
      exportFilename="transaksi-simpanan"
      filterDefs={FILTER_DEFS}
      defaultSort={{ key: 'tanggal', order: 'desc' }}
      readonly
    />
  )
}
```

- [ ] **Step 10.2: Verify no TypeScript errors**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 10.3: Commit**

```bash
git add src/pages/koperasi/simpanan/TransaksiSimpananListPage.tsx
git commit -m "feat(koperasi/simpanan): add TransaksiSimpananListPage (read-only)"
```

---

## Task 11: PermohonanListPage + PermohonanFormPage

**Files:**
- Create: `src/pages/koperasi/simpanan/PermohonanListPage.tsx`
- Create: `src/pages/koperasi/simpanan/PermohonanFormPage.tsx`
- Create: `src/pages/koperasi/simpanan/PermohonanFormPage.module.css`

- [ ] **Step 11.1: Write PermohonanListPage**

```tsx
// src/pages/koperasi/simpanan/PermohonanListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { permohonanSimpananService } from '@/services/koperasi/simpanan.service'
import { QK } from '@/services/query-keys'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { PermohonanSimpanan, TipePermohonan, StatusPermohonan } from '@/types/koperasi/simpanan.types'

const STATUS_COLOR: Record<StatusPermohonan, string> = {
  Draft: 'var(--color-text-tertiary)',
  Diajukan: 'var(--color-warning)',
  Disetujui: 'var(--color-success)',
  Ditolak: 'var(--color-danger)',
}

const COLUMNS: ColumnDef<PermohonanSimpanan>[] = [
  { key: 'tipe', label: 'Tipe Permohonan', sortable: true },
  { key: 'no_rekening', label: 'Rekening' },
  { key: 'nasabah_nama', label: 'Nasabah', sortable: true },
  {
    key: 'status',
    label: 'Status',
    render: (row) => <span style={{ color: STATUS_COLOR[row.status] }}>{row.status}</span>,
  },
  {
    key: 'tanggal',
    label: 'Tanggal',
    sortable: true,
    render: (row) => new Date(row.tanggal).toLocaleDateString('id-ID'),
  },
]

const TIPE_OPTIONS: TipePermohonan[] = [
  'Buka Rekening', 'Tutup Rekening', 'Blokir Rekening', 'Unblokir Rekening', 'Aktivasi Dormant',
]

const STATUS_OPTIONS: StatusPermohonan[] = ['Draft', 'Diajukan', 'Disetujui', 'Ditolak']

const FILTER_DEFS: FilterDef[] = [
  {
    key: 'tipe',
    label: 'Tipe',
    type: 'select',
    options: TIPE_OPTIONS.map((t) => ({ value: t, label: t })),
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: STATUS_OPTIONS.map((s) => ({ value: s, label: s })),
  },
]

export function PermohonanListPage() {
  const navigate = useNavigate()
  return (
    <ListPageTemplate<PermohonanSimpanan>
      title="Permohonan Simpanan"
      addLabel="Buat Permohonan"
      onAdd={() => navigate('new')}
      queryKey={QK.permohonanSimpanan}
      fetcher={permohonanSimpananService.list}
      columns={COLUMNS}
      onRowClick={(row) => navigate(`${row.id}`)}
      searchPlaceholder="Cari rekening atau nasabah..."
      filterDefs={FILTER_DEFS}
      defaultSort={{ key: 'tanggal', order: 'desc' }}
    />
  )
}
```

- [ ] **Step 11.2: Write PermohonanFormPage**

```tsx
// src/pages/koperasi/simpanan/PermohonanFormPage.tsx
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { permohonanSimpananService } from '@/services/koperasi/simpanan.service'
import { QK } from '@/services/query-keys'
import { toast } from '@/widgets/Toast/Toast'
import type { PermohonanSimpanan, TipePermohonan } from '@/types/koperasi/simpanan.types'
import styles from './PermohonanFormPage.module.css'

const TIPE_OPTIONS: TipePermohonan[] = [
  'Buka Rekening', 'Tutup Rekening', 'Blokir Rekening', 'Unblokir Rekening', 'Aktivasi Dormant',
]

export function PermohonanFormPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState<Partial<PermohonanSimpanan>>({
    tipe: 'Buka Rekening',
    rekening_id: null,
    no_rekening: null,
    nasabah_id: '',
    alasan: '',
    status: 'Draft',
  })

  const isBukaRekening = form.tipe === 'Buka Rekening'

  const mutation = useMutation({
    mutationFn: (data: Partial<PermohonanSimpanan>) =>
      permohonanSimpananService.create(data),
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: [QK.permohonanSimpanan] })
      toast.success('Permohonan berhasil dibuat.')
      navigate(`/koperasi/simpanan/permohonan/${created.id}`)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate(form)
  }

  const formFields = (
    <div className={styles.fields}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Tipe Permohonan</label>
        <select
          className={styles.input}
          value={form.tipe}
          onChange={(e) => setForm((f) => ({ ...f, tipe: e.target.value as TipePermohonan }))}
        >
          {TIPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {!isBukaRekening && (
        <div className={styles.fieldGroup}>
          <label className={styles.label}>No Rekening</label>
          <input
            className={styles.input}
            placeholder="Masukkan no rekening..."
            value={form.no_rekening ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, no_rekening: e.target.value }))}
            required
          />
        </div>
      )}

      {isBukaRekening && (
        <div className={styles.fieldGroup}>
          <label className={styles.label}>ID Nasabah</label>
          <input
            className={styles.input}
            placeholder="ID nasabah..."
            value={form.nasabah_id ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, nasabah_id: e.target.value }))}
            required
          />
        </div>
      )}

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Alasan / Keterangan</label>
        <textarea
          className={styles.textarea}
          rows={4}
          value={form.alasan ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, alasan: e.target.value }))}
          required
        />
      </div>
    </div>
  )

  return (
    <FormPageTemplate
      title="Buat Permohonan"
      onBack={() => navigate('/koperasi/simpanan/permohonan')}
      onCancel={() => navigate('/koperasi/simpanan/permohonan')}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={mutation.error instanceof Error ? mutation.error.message : undefined}
      tabs={[{ id: 'form', label: 'Detail Permohonan', content: formFields }]}
    />
  )
}
```

- [ ] **Step 11.3: Create CSS module**

Create `src/pages/koperasi/simpanan/PermohonanFormPage.module.css`:

```css
.fields { display: flex; flex-direction: column; gap: 16px; padding: 24px; }
.fieldGroup { display: flex; flex-direction: column; gap: 6px; }
.label { font-size: 13px; font-weight: 500; color: var(--color-text-secondary); }
.input { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 14px; }
.textarea { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 14px; resize: vertical; }
```

- [ ] **Step 11.4: Verify no TypeScript errors**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 11.5: Commit**

```bash
git add src/pages/koperasi/simpanan/PermohonanListPage.tsx \
        src/pages/koperasi/simpanan/PermohonanFormPage.tsx \
        src/pages/koperasi/simpanan/PermohonanFormPage.module.css
git commit -m "feat(koperasi/simpanan): add PermohonanListPage and PermohonanFormPage"
```

---

## Task 12: PermohonanDetailPage (2 tabs + workflow actions)

**Files:**
- Create: `src/pages/koperasi/simpanan/PermohonanDetailPage.tsx`
- Create: `src/pages/koperasi/simpanan/PermohonanDetailPage.module.css`

- [ ] **Step 12.1: Write PermohonanDetailPage**

```tsx
// src/pages/koperasi/simpanan/PermohonanDetailPage.tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { permohonanSimpananService } from '@/services/koperasi/simpanan.service'
import { QK } from '@/services/query-keys'
import { toast } from '@/widgets/Toast/Toast'
import type { PermohonanSimpanan } from '@/types/koperasi/simpanan.types'
import styles from './PermohonanDetailPage.module.css'

// ─── Info Tab ────────────────────────────────────────────────────────────────

function InfoTab({ p }: { p: PermohonanSimpanan }) {
  return (
    <div className={styles.infoGrid}>
      <InfoRow label="Tipe" value={p.tipe} />
      <InfoRow label="No Rekening" value={p.no_rekening ?? '—'} />
      <InfoRow label="Nasabah" value={p.nasabah_nama} />
      <InfoRow label="Alasan" value={p.alasan} />
      <InfoRow label="Tanggal" value={new Date(p.tanggal).toLocaleDateString('id-ID')} />
      {p.reviewed_by && <InfoRow label="Disetujui/Ditolak oleh" value={p.reviewed_by} />}
      {p.catatan_reviewer && <InfoRow label="Catatan Reviewer" value={p.catatan_reviewer} />}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  )
}

// ─── Status Workflow Tab ──────────────────────────────────────────────────────

function WorkflowTab({
  permohonan,
  onApprove,
  onReject,
  isProcessing,
}: {
  permohonan: PermohonanSimpanan
  onApprove: () => void
  onReject: (alasan: string) => void
  isProcessing: boolean
}) {
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const isDiajukan = permohonan.status === 'Diajukan'

  const STEP_LABELS = ['Draft', 'Diajukan', permohonan.status === 'Ditolak' ? 'Ditolak' : 'Disetujui']
  const STEP_ACTIVE_INDEX = ['Draft', 'Diajukan', 'Disetujui', 'Ditolak'].indexOf(permohonan.status)

  return (
    <div className={styles.workflowTab}>
      <div className={styles.statusRow}>
        {STEP_LABELS.map((step, i) => (
          <div key={step} className={`${styles.step} ${i <= Math.min(STEP_ACTIVE_INDEX, 2) ? styles.stepDone : ''}`}>
            <div className={styles.stepDot} />
            <span>{step}</span>
          </div>
        ))}
      </div>

      <div className={styles.currentStatus}>
        Status saat ini: <strong>{permohonan.status}</strong>
      </div>

      {isDiajukan && (
        <div className={styles.actions}>
          <button
            className={styles.btnApprove}
            onClick={onApprove}
            disabled={isProcessing}
          >
            <CheckCircle size={14} />
            Setujui
          </button>
          <button
            className={styles.btnReject}
            onClick={() => setShowRejectForm(true)}
            disabled={isProcessing}
          >
            <XCircle size={14} />
            Tolak
          </button>
        </div>
      )}

      {showRejectForm && (
        <div className={styles.rejectForm}>
          <label className={styles.rejectLabel}>Alasan Penolakan</label>
          <textarea
            className={styles.rejectTextarea}
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className={styles.rejectActions}>
            <button className={styles.btnSecondary} onClick={() => setShowRejectForm(false)}>Batal</button>
            <button
              className={styles.btnReject}
              disabled={!rejectReason.trim() || isProcessing}
              onClick={() => onReject(rejectReason)}
            >
              Konfirmasi Tolak
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function PermohonanDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: permohonan, isLoading } = useQuery<PermohonanSimpanan>({
    queryKey: [QK.permohonanSimpananDetail, id],
    queryFn: () => permohonanSimpananService.getById(id!),
    enabled: !!id,
  })

  const approveMutation = useMutation({
    mutationFn: () => permohonanSimpananService.approve(id!),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QK.permohonanSimpananDetail, id] })
      void qc.invalidateQueries({ queryKey: [QK.permohonanSimpanan] })
      toast.success('Permohonan disetujui.')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Gagal menyetujui'),
  })

  const rejectMutation = useMutation({
    mutationFn: (alasan: string) => permohonanSimpananService.reject(id!, alasan),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QK.permohonanSimpananDetail, id] })
      void qc.invalidateQueries({ queryKey: [QK.permohonanSimpanan] })
      toast.success('Permohonan ditolak.')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Gagal menolak'),
  })

  if (isLoading || !permohonan) {
    return <div className={styles.loading}>Memuat permohonan...</div>
  }

  const isProcessing = approveMutation.isPending || rejectMutation.isPending

  return (
    <DetailPageTemplate
      title={permohonan.tipe}
      code={permohonan.status}
      onBack={() => navigate('/koperasi/simpanan/permohonan')}
      tabs={[
        { id: 'info', label: 'Info Permohonan', content: <InfoTab p={permohonan} /> },
        {
          id: 'workflow',
          label: 'Status Workflow',
          content: (
            <WorkflowTab
              permohonan={permohonan}
              onApprove={() => approveMutation.mutate()}
              onReject={(alasan) => rejectMutation.mutate(alasan)}
              isProcessing={isProcessing}
            />
          ),
        },
      ]}
    />
  )
}
```

- [ ] **Step 12.2: Create CSS module**

Create `src/pages/koperasi/simpanan/PermohonanDetailPage.module.css`:

```css
.loading { padding: 32px; text-align: center; color: var(--color-text-tertiary); }
.infoGrid { display: flex; flex-direction: column; gap: 0; padding: 8px 0; }
.infoRow { display: grid; grid-template-columns: 180px 1fr; gap: 12px; padding: 12px 24px; border-bottom: 1px solid var(--color-border-light); }
.infoLabel { font-size: 13px; color: var(--color-text-secondary); }
.infoValue { font-size: 14px; color: var(--color-text-primary); font-weight: 500; }
.workflowTab { padding: 24px; display: flex; flex-direction: column; gap: 24px; }
.statusRow { display: flex; align-items: center; gap: 0; }
.step { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; font-size: 12px; color: var(--color-text-tertiary); }
.stepDone { color: var(--color-success); }
.stepDot { width: 12px; height: 12px; border-radius: 50%; background: var(--color-border); }
.stepDone .stepDot { background: var(--color-success); }
.currentStatus { font-size: 14px; }
.actions { display: flex; gap: 12px; }
.btnApprove { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: var(--color-success); color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
.btnApprove:disabled { opacity: 0.5; cursor: not-allowed; }
.btnReject { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: var(--color-danger); color: #fff; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
.btnReject:disabled { opacity: 0.5; cursor: not-allowed; }
.btnSecondary { padding: 8px 16px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 14px; background: var(--color-surface); cursor: pointer; }
.rejectForm { display: flex; flex-direction: column; gap: 10px; }
.rejectLabel { font-size: 13px; font-weight: 500; }
.rejectTextarea { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 14px; resize: vertical; }
.rejectActions { display: flex; gap: 10px; }
```

- [ ] **Step 12.3: Verify no TypeScript errors**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 12.4: Commit**

```bash
git add src/pages/koperasi/simpanan/PermohonanDetailPage.tsx \
        src/pages/koperasi/simpanan/PermohonanDetailPage.module.css
git commit -m "feat(koperasi/simpanan): add PermohonanDetailPage with workflow approve/reject"
```

---

## Task 13: ProdukPembiayaanListPage + ProdukPembiayaanFormPage

**Files:**
- Create: `src/pages/koperasi/pembiayaan/ProdukPembiayaanListPage.tsx`
- Create: `src/pages/koperasi/pembiayaan/ProdukPembiayaanFormPage.tsx`
- Create: `src/pages/koperasi/pembiayaan/ProdukPembiayaanFormPage.module.css`

- [ ] **Step 13.1: Write ProdukPembiayaanListPage**

```tsx
// src/pages/koperasi/pembiayaan/ProdukPembiayaanListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { produkPembiayaanService } from '@/services/koperasi/pembiayaan.service'
import { QK } from '@/services/query-keys'
import type { ColumnDef, DeleteConfig } from '@/widgets/DataTable/DataTable'
import type { ProdukPembiayaan } from '@/types/koperasi/pembiayaan.types'

const COLUMNS: ColumnDef<ProdukPembiayaan>[] = [
  { key: 'nama', label: 'Nama', sortable: true },
  { key: 'akad', label: 'Akad', sortable: true },
  {
    key: 'margin',
    label: 'Margin %',
    render: (row) => `${row.margin}%`,
  },
  {
    key: 'tenor_max',
    label: 'Tenor Maks',
    render: (row) => `${row.tenor_max} bulan`,
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <span style={{ color: row.status === 'Aktif' ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
        {row.status}
      </span>
    ),
  },
]

const DELETE_CONFIG: DeleteConfig<ProdukPembiayaan> = {
  onDelete: (row) => produkPembiayaanService.delete(row.id),
  dialogTitle: 'Hapus Produk Pembiayaan?',
  dialogBody: (row) => `Produk "${row.nama}" akan dihapus permanen.`,
  successMessage: (row) => `Produk "${row.nama}" berhasil dihapus.`,
}

export function ProdukPembiayaanListPage() {
  const navigate = useNavigate()
  return (
    <ListPageTemplate<ProdukPembiayaan>
      title="Produk Pembiayaan"
      addLabel="Tambah Produk"
      onAdd={() => navigate('new')}
      queryKey={QK.produkPembiayaan}
      fetcher={produkPembiayaanService.list}
      columns={COLUMNS}
      onRowClick={(row) => navigate(`${row.id}/edit`)}
      searchPlaceholder="Cari produk pembiayaan..."
      exportFilename="produk-pembiayaan"
      deleteConfig={DELETE_CONFIG}
    />
  )
}
```

- [ ] **Step 13.2: Write ProdukPembiayaanFormPage**

```tsx
// src/pages/koperasi/pembiayaan/ProdukPembiayaanFormPage.tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { produkPembiayaanService } from '@/services/koperasi/pembiayaan.service'
import { QK } from '@/services/query-keys'
import { toast } from '@/widgets/Toast/Toast'
import type { ProdukPembiayaan, JenisAkad } from '@/types/koperasi/pembiayaan.types'
import styles from './ProdukPembiayaanFormPage.module.css'

const AKAD_OPTIONS: JenisAkad[] = ['Murabahah', 'Mudharabah', 'Musyarakah', 'Ijarah', 'Qardh']

export function ProdukPembiayaanFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const qc = useQueryClient()

  const { data: existing } = useQuery({
    queryKey: [QK.produkPembiayaanDetail, id],
    queryFn: () => produkPembiayaanService.getById(id!),
    enabled: isEdit,
  })

  const [form, setForm] = useState<Partial<ProdukPembiayaan>>({
    nama: '',
    akad: 'Murabahah',
    margin: 0,
    tenor_max: 12,
    keterangan: '',
    status: 'Aktif',
  })

  if (isEdit && existing && form.nama === '' && existing.nama) {
    setForm({
      nama: existing.nama,
      akad: existing.akad,
      margin: existing.margin,
      tenor_max: existing.tenor_max,
      keterangan: existing.keterangan,
      status: existing.status,
    })
  }

  const mutation = useMutation({
    mutationFn: (data: Partial<ProdukPembiayaan>) =>
      isEdit
        ? produkPembiayaanService.update(id!, data)
        : produkPembiayaanService.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QK.produkPembiayaan] })
      toast.success(isEdit ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.')
      navigate('/koperasi/pembiayaan/produk')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate(form)
  }

  const formFields = (
    <div className={styles.fields}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Nama Produk</label>
        <input
          className={styles.input}
          value={form.nama ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Jenis Akad</label>
        <select
          className={styles.input}
          value={form.akad}
          onChange={(e) => setForm((f) => ({ ...f, akad: e.target.value as JenisAkad }))}
        >
          {AKAD_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Margin (%)</label>
        <input
          className={styles.input}
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={form.margin ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, margin: parseFloat(e.target.value) }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Tenor Maksimum (bulan)</label>
        <input
          className={styles.input}
          type="number"
          min={1}
          value={form.tenor_max ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, tenor_max: parseInt(e.target.value, 10) }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Keterangan</label>
        <textarea
          className={styles.textarea}
          rows={3}
          value={form.keterangan ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
        />
      </div>
      {isEdit && (
        <div className={styles.fieldGroup}>
          <label className={styles.label}>Status</label>
          <select
            className={styles.input}
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'Aktif' | 'Tidak Aktif' }))}
          >
            <option value="Aktif">Aktif</option>
            <option value="Tidak Aktif">Tidak Aktif</option>
          </select>
        </div>
      )}
    </div>
  )

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Produk Pembiayaan' : 'Tambah Produk Pembiayaan'}
      onBack={() => navigate('/koperasi/pembiayaan/produk')}
      onCancel={() => navigate('/koperasi/pembiayaan/produk')}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={mutation.error instanceof Error ? mutation.error.message : undefined}
      tabs={[{ id: 'form', label: 'Data Produk', content: formFields }]}
    />
  )
}
```

- [ ] **Step 13.3: Create CSS module stub**

Create `src/pages/koperasi/pembiayaan/ProdukPembiayaanFormPage.module.css`:

```css
.fields { display: flex; flex-direction: column; gap: 16px; padding: 24px; }
.fieldGroup { display: flex; flex-direction: column; gap: 6px; }
.label { font-size: 13px; font-weight: 500; color: var(--color-text-secondary); }
.input { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 14px; }
.textarea { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 14px; resize: vertical; }
```

- [ ] **Step 13.4: Verify no TypeScript errors**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 13.5: Commit**

```bash
git add src/pages/koperasi/pembiayaan/ProdukPembiayaanListPage.tsx \
        src/pages/koperasi/pembiayaan/ProdukPembiayaanFormPage.tsx \
        src/pages/koperasi/pembiayaan/ProdukPembiayaanFormPage.module.css
git commit -m "feat(koperasi/pembiayaan): add ProdukPembiayaan list and form pages"
```

---

## Task 14: AkadListPage

**Files:**
- Create: `src/pages/koperasi/pembiayaan/AkadListPage.tsx`

- [ ] **Step 14.1: Write AkadListPage**

```tsx
// src/pages/koperasi/pembiayaan/AkadListPage.tsx
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { akadPembiayaanService } from '@/services/koperasi/pembiayaan.service'
import { QK } from '@/services/query-keys'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { AkadPembiayaan, StatusAkad } from '@/types/koperasi/pembiayaan.types'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const STATUS_COLOR: Record<StatusAkad, string> = {
  Pengajuan: 'var(--color-warning)',
  Aktif: 'var(--color-success)',
  Lunas: 'var(--color-text-tertiary)',
  Macet: 'var(--color-danger)',
  Ditolak: 'var(--color-danger)',
}

const COLUMNS: ColumnDef<AkadPembiayaan>[] = [
  { key: 'no_akad', label: 'No Akad', sortable: true },
  {
    key: 'nasabah_nama',
    label: 'Nasabah',
    render: (row) => (
      <Link
        to={`/koperasi/anggota/${row.nasabah_id}`}
        onClick={(e) => e.stopPropagation()}
        style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
      >
        {row.nasabah_nama}
      </Link>
    ),
  },
  { key: 'produk_nama', label: 'Produk', sortable: true },
  {
    key: 'nominal_pokok',
    label: 'Pokok',
    render: (row) => fmt(row.nominal_pokok),
  },
  {
    key: 'sisa_pokok',
    label: 'Sisa',
    render: (row) => fmt(row.sisa_pokok),
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => <span style={{ color: STATUS_COLOR[row.status] }}>{row.status}</span>,
  },
]

const STATUS_OPTIONS: StatusAkad[] = ['Pengajuan', 'Aktif', 'Lunas', 'Macet', 'Ditolak']

const FILTER_DEFS: FilterDef[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: STATUS_OPTIONS.map((s) => ({ value: s, label: s })),
  },
]

export function AkadListPage() {
  const navigate = useNavigate()
  return (
    <ListPageTemplate<AkadPembiayaan>
      title="Akad Pembiayaan"
      addLabel="Buat Akad"
      onAdd={() => navigate('new')}
      queryKey={QK.akadPembiayaan}
      fetcher={akadPembiayaanService.list}
      columns={COLUMNS}
      onRowClick={(row) => navigate(`${row.id}`)}
      searchPlaceholder="Cari no akad atau nasabah..."
      exportFilename="akad-pembiayaan"
      filterDefs={FILTER_DEFS}
    />
  )
}
```

- [ ] **Step 14.2: Verify no TypeScript errors**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 14.3: Commit**

```bash
git add src/pages/koperasi/pembiayaan/AkadListPage.tsx
git commit -m "feat(koperasi/pembiayaan): add AkadListPage"
```

---

## Task 15: AkadDetailPage (3 tabs)

**Files:**
- Create: `src/pages/koperasi/pembiayaan/AkadDetailPage.tsx`
- Create: `src/pages/koperasi/pembiayaan/AkadDetailPage.module.css`

- [ ] **Step 15.1: Write AkadDetailPage**

```tsx
// src/pages/koperasi/pembiayaan/AkadDetailPage.tsx
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { akadPembiayaanService } from '@/services/koperasi/pembiayaan.service'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { QK } from '@/services/query-keys'
import type { AkadPembiayaan, JadwalAngsuran, PembayaranAngsuran } from '@/types/koperasi/pembiayaan.types'
import type { PaginatedResponse } from '@/types/api.types'
import styles from './AkadDetailPage.module.css'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

// ─── Info Tab ────────────────────────────────────────────────────────────────

function InfoTab({ akad }: { akad: AkadPembiayaan }) {
  return (
    <div className={styles.infoGrid}>
      <InfoRow label="No Akad" value={akad.no_akad} />
      <InfoRow
        label="Nasabah"
        value={
          <Link to={`/koperasi/anggota/${akad.nasabah_id}`} className={styles.nasabahLink}>
            {akad.nasabah_nama} →
          </Link>
        }
      />
      <InfoRow label="Produk" value={akad.produk_nama} />
      <InfoRow label="Jenis Akad" value={akad.akad} />
      <InfoRow label="Nominal Pokok" value={fmt(akad.nominal_pokok)} />
      <InfoRow label="Sisa Pokok" value={fmt(akad.sisa_pokok)} />
      <InfoRow label="Tenor" value={`${akad.tenor} bulan`} />
      <InfoRow label="Tujuan Pembiayaan" value={akad.tujuan_pembiayaan} />
      <InfoRow label="Agunan" value={akad.agunan} />
      <InfoRow label="Tanggal Akad" value={new Date(akad.tanggal_akad).toLocaleDateString('id-ID')} />
      <InfoRow label="Status" value={akad.status} />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  )
}

// ─── Jadwal Angsuran Tab ─────────────────────────────────────────────────────

function JadwalTab({ akadId }: { akadId: string }) {
  const { data, isLoading } = useQuery<PaginatedResponse<JadwalAngsuran>>({
    queryKey: [QK.jadwalAngsuran, akadId],
    queryFn: () => akadPembiayaanService.listJadwal(akadId),
  })

  if (isLoading) return <div className={styles.loading}>Memuat jadwal...</div>

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>No</th>
          <th>Jatuh Tempo</th>
          <th>Pokok</th>
          <th>Margin</th>
          <th>Total</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {(data?.items ?? []).map((j) => (
          <tr key={j.id}>
            <td>{j.no_angsuran}</td>
            <td>{new Date(j.tanggal_jatuh_tempo).toLocaleDateString('id-ID')}</td>
            <td>{fmt(j.pokok)}</td>
            <td>{fmt(j.margin)}</td>
            <td>{fmt(j.total)}</td>
            <td>{j.status_bayar}</td>
          </tr>
        ))}
        {(data?.items ?? []).length === 0 && (
          <tr><td colSpan={6} className={styles.empty}>Belum ada jadwal</td></tr>
        )}
      </tbody>
    </table>
  )
}

// ─── Riwayat Pembayaran Tab ──────────────────────────────────────────────────

function PembayaranTab({ akadId }: { akadId: string }) {
  const { data, isLoading } = useQuery<PaginatedResponse<PembayaranAngsuran>>({
    queryKey: [QK.pembayaranAngsuran, akadId],
    queryFn: () => akadPembiayaanService.listPembayaran(akadId),
  })

  if (isLoading) return <div className={styles.loading}>Memuat riwayat...</div>

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Angsuran ke-</th>
          <th>Nominal</th>
          <th>Tanggal Bayar</th>
          <th>Keterangan</th>
        </tr>
      </thead>
      <tbody>
        {(data?.items ?? []).map((p) => (
          <tr key={p.id}>
            <td>{p.no_angsuran}</td>
            <td>{fmt(p.nominal)}</td>
            <td>{new Date(p.tanggal_bayar).toLocaleDateString('id-ID')}</td>
            <td>{p.keterangan ?? '—'}</td>
          </tr>
        ))}
        {(data?.items ?? []).length === 0 && (
          <tr><td colSpan={4} className={styles.empty}>Belum ada pembayaran</td></tr>
        )}
      </tbody>
    </table>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function AkadDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { data: akad, isLoading } = useQuery<AkadPembiayaan>({
    queryKey: [QK.akadPembiayaanDetail, id],
    queryFn: () => akadPembiayaanService.getById(id!),
    enabled: !!id,
  })

  if (isLoading || !akad) {
    return <div className={styles.loading}>Memuat akad...</div>
  }

  return (
    <DetailPageTemplate
      title={akad.no_akad}
      code={akad.status}
      badges={
        <Link to={`/koperasi/anggota/${akad.nasabah_id}`} className={styles.nasabahBadge}>
          ← {akad.nasabah_nama}
        </Link>
      }
      onBack={() => navigate('/koperasi/pembiayaan/akad')}
      tabs={[
        { id: 'info', label: 'Info Akad', content: <InfoTab akad={akad} /> },
        { id: 'jadwal', label: 'Jadwal Angsuran', content: <JadwalTab akadId={id!} /> },
        { id: 'riwayat', label: 'Riwayat Pembayaran', content: <PembayaranTab akadId={id!} /> },
      ]}
    />
  )
}
```

- [ ] **Step 15.2: Create CSS module**

Create `src/pages/koperasi/pembiayaan/AkadDetailPage.module.css`:

```css
.loading { padding: 32px; text-align: center; color: var(--color-text-tertiary); }
.nasabahLink { color: var(--color-primary); font-weight: 600; text-decoration: none; }
.nasabahLink:hover { text-decoration: underline; }
.nasabahBadge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: var(--color-primary-soft); color: var(--color-primary); border-radius: 20px; font-size: 13px; font-weight: 500; text-decoration: none; }
.infoGrid { display: flex; flex-direction: column; gap: 0; padding: 8px 0; }
.infoRow { display: grid; grid-template-columns: 200px 1fr; gap: 12px; padding: 12px 24px; border-bottom: 1px solid var(--color-border-light); }
.infoLabel { font-size: 13px; color: var(--color-text-secondary); }
.infoValue { font-size: 14px; color: var(--color-text-primary); font-weight: 500; }
.table { width: 100%; border-collapse: collapse; font-size: 14px; }
.table th { text-align: left; padding: 10px 16px; background: var(--color-surface-hover); font-size: 12px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
.table td { padding: 12px 16px; border-bottom: 1px solid var(--color-border-light); }
.empty { text-align: center; color: var(--color-text-tertiary); padding: 32px; }
```

- [ ] **Step 15.3: Verify no TypeScript errors**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard && npx tsc --noEmit 2>&1 | head -30
```

- [ ] **Step 15.4: Commit**

```bash
git add src/pages/koperasi/pembiayaan/AkadDetailPage.tsx \
        src/pages/koperasi/pembiayaan/AkadDetailPage.module.css
git commit -m "feat(koperasi/pembiayaan): add AkadDetailPage with 3 tabs"
```

---

## Task 16: AkadFormPage

**Files:**
- Create: `src/pages/koperasi/pembiayaan/AkadFormPage.tsx`
- Create: `src/pages/koperasi/pembiayaan/AkadFormPage.module.css`

- [ ] **Step 16.1: Write AkadFormPage**

```tsx
// src/pages/koperasi/pembiayaan/AkadFormPage.tsx
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { akadPembiayaanService } from '@/services/koperasi/pembiayaan.service'
import { QK } from '@/services/query-keys'
import { toast } from '@/widgets/Toast/Toast'
import type { AkadPembiayaan, JenisAkad } from '@/types/koperasi/pembiayaan.types'
import styles from './AkadFormPage.module.css'

const AKAD_OPTIONS: JenisAkad[] = ['Murabahah', 'Mudharabah', 'Musyarakah', 'Ijarah', 'Qardh']

export function AkadFormPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState<Partial<AkadPembiayaan>>({
    nasabah_id: '',
    produk_id: '',
    akad: 'Murabahah',
    nominal_pokok: 0,
    tenor: 12,
    tujuan_pembiayaan: '',
    tanggal_akad: new Date().toISOString().split('T')[0],
    agunan: '',
  })

  const mutation = useMutation({
    mutationFn: (data: Partial<AkadPembiayaan>) => akadPembiayaanService.create(data),
    onSuccess: (created) => {
      void qc.invalidateQueries({ queryKey: [QK.akadPembiayaan] })
      toast.success('Akad pembiayaan berhasil dibuat.')
      navigate(`/koperasi/pembiayaan/akad/${created.id}`)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate(form)
  }

  const formFields = (
    <div className={styles.fields}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>ID Nasabah</label>
        <input
          className={styles.input}
          placeholder="ID nasabah..."
          value={form.nasabah_id ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, nasabah_id: e.target.value }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>ID Produk Pembiayaan</label>
        <input
          className={styles.input}
          placeholder="ID produk..."
          value={form.produk_id ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, produk_id: e.target.value }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Jenis Akad</label>
        <select
          className={styles.input}
          value={form.akad}
          onChange={(e) => setForm((f) => ({ ...f, akad: e.target.value as JenisAkad }))}
        >
          {AKAD_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Nominal Pokok (Rp)</label>
        <input
          className={styles.input}
          type="number"
          min={0}
          value={form.nominal_pokok ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, nominal_pokok: parseInt(e.target.value, 10) }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Tenor (bulan)</label>
        <input
          className={styles.input}
          type="number"
          min={1}
          value={form.tenor ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, tenor: parseInt(e.target.value, 10) }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Tujuan Pembiayaan</label>
        <textarea
          className={styles.textarea}
          rows={2}
          value={form.tujuan_pembiayaan ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, tujuan_pembiayaan: e.target.value }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Tanggal Akad</label>
        <input
          className={styles.input}
          type="date"
          value={form.tanggal_akad ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, tanggal_akad: e.target.value }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Agunan</label>
        <textarea
          className={styles.textarea}
          rows={2}
          value={form.agunan ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, agunan: e.target.value }))}
        />
      </div>
    </div>
  )

  return (
    <FormPageTemplate
      title="Buat Akad Pembiayaan"
      onBack={() => navigate('/koperasi/pembiayaan/akad')}
      onCancel={() => navigate('/koperasi/pembiayaan/akad')}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={mutation.error instanceof Error ? mutation.error.message : undefined}
      tabs={[{ id: 'form', label: 'Data Akad', content: formFields }]}
    />
  )
}
```

- [ ] **Step 16.2: Create CSS module stub**

Create `src/pages/koperasi/pembiayaan/AkadFormPage.module.css`:

```css
.fields { display: flex; flex-direction: column; gap: 16px; padding: 24px; }
.fieldGroup { display: flex; flex-direction: column; gap: 6px; }
.label { font-size: 13px; font-weight: 500; color: var(--color-text-secondary); }
.input { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 14px; }
.textarea { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 14px; resize: vertical; }
```

- [ ] **Step 16.3: Verify no TypeScript errors**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 16.4: Commit**

```bash
git add src/pages/koperasi/pembiayaan/AkadFormPage.tsx \
        src/pages/koperasi/pembiayaan/AkadFormPage.module.css
git commit -m "feat(koperasi/pembiayaan): add AkadFormPage"
```

---

## Task 17: PembayaranAngsuranListPage + PembayaranAngsuranFormPage

**Files:**
- Create: `src/pages/koperasi/pembiayaan/PembayaranAngsuranListPage.tsx`
- Create: `src/pages/koperasi/pembiayaan/PembayaranAngsuranFormPage.tsx`
- Create: `src/pages/koperasi/pembiayaan/PembayaranAngsuranFormPage.module.css`

- [ ] **Step 17.1: Write PembayaranAngsuranListPage**

```tsx
// src/pages/koperasi/pembiayaan/PembayaranAngsuranListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { pembayaranAngsuranService } from '@/services/koperasi/pembiayaan.service'
import { QK } from '@/services/query-keys'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { PembayaranAngsuran } from '@/types/koperasi/pembiayaan.types'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const COLUMNS: ColumnDef<PembayaranAngsuran>[] = [
  { key: 'no_akad', label: 'No Akad', sortable: true },
  { key: 'nasabah_nama', label: 'Nasabah', sortable: true },
  { key: 'no_angsuran', label: 'Angsuran ke-', sortable: true },
  {
    key: 'nominal',
    label: 'Nominal',
    render: (row) => fmt(row.nominal),
  },
  {
    key: 'tanggal_bayar',
    label: 'Tanggal Bayar',
    sortable: true,
    render: (row) => new Date(row.tanggal_bayar).toLocaleDateString('id-ID'),
  },
]

export function PembayaranAngsuranListPage() {
  const navigate = useNavigate()
  return (
    <ListPageTemplate<PembayaranAngsuran>
      title="Pembayaran Angsuran"
      addLabel="Catat Pembayaran"
      onAdd={() => navigate('new')}
      queryKey={QK.pembayaranAngsuran}
      fetcher={pembayaranAngsuranService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari no akad atau nasabah..."
      exportFilename="pembayaran-angsuran"
      defaultSort={{ key: 'tanggal_bayar', order: 'desc' }}
    />
  )
}
```

- [ ] **Step 17.2: Write PembayaranAngsuranFormPage**

```tsx
// src/pages/koperasi/pembiayaan/PembayaranAngsuranFormPage.tsx
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { pembayaranAngsuranService } from '@/services/koperasi/pembiayaan.service'
import { QK } from '@/services/query-keys'
import { toast } from '@/widgets/Toast/Toast'
import type { PembayaranAngsuran } from '@/types/koperasi/pembiayaan.types'
import styles from './PembayaranAngsuranFormPage.module.css'

export function PembayaranAngsuranFormPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState<Partial<PembayaranAngsuran>>({
    akad_id: '',
    jadwal_id: '',
    nominal: 0,
    tanggal_bayar: new Date().toISOString().split('T')[0],
    keterangan: '',
  })

  const mutation = useMutation({
    mutationFn: (data: Partial<PembayaranAngsuran>) => pembayaranAngsuranService.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [QK.pembayaranAngsuran] })
      void qc.invalidateQueries({ queryKey: [QK.akadPembiayaan] })
      toast.success('Pembayaran angsuran berhasil dicatat.')
      navigate('/koperasi/pembiayaan/pembayaran')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate(form)
  }

  const formFields = (
    <div className={styles.fields}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>ID Akad Pembiayaan</label>
        <input
          className={styles.input}
          placeholder="ID akad..."
          value={form.akad_id ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, akad_id: e.target.value }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>ID Jadwal Angsuran</label>
        <input
          className={styles.input}
          placeholder="ID jadwal..."
          value={form.jadwal_id ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, jadwal_id: e.target.value }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Nominal (Rp)</label>
        <input
          className={styles.input}
          type="number"
          min={0}
          value={form.nominal ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, nominal: parseInt(e.target.value, 10) }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Tanggal Bayar</label>
        <input
          className={styles.input}
          type="date"
          value={form.tanggal_bayar ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, tanggal_bayar: e.target.value }))}
          required
        />
      </div>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Keterangan</label>
        <textarea
          className={styles.textarea}
          rows={2}
          value={form.keterangan ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
        />
      </div>
    </div>
  )

  return (
    <FormPageTemplate
      title="Catat Pembayaran Angsuran"
      onBack={() => navigate('/koperasi/pembiayaan/pembayaran')}
      onCancel={() => navigate('/koperasi/pembiayaan/pembayaran')}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={mutation.error instanceof Error ? mutation.error.message : undefined}
      tabs={[{ id: 'form', label: 'Data Pembayaran', content: formFields }]}
    />
  )
}
```

- [ ] **Step 17.3: Create CSS module stub**

Create `src/pages/koperasi/pembiayaan/PembayaranAngsuranFormPage.module.css`:

```css
.fields { display: flex; flex-direction: column; gap: 16px; padding: 24px; }
.fieldGroup { display: flex; flex-direction: column; gap: 6px; }
.label { font-size: 13px; font-weight: 500; color: var(--color-text-secondary); }
.input { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 14px; }
.textarea { padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 6px; font-size: 14px; resize: vertical; }
```

- [ ] **Step 17.4: Verify no TypeScript errors**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 17.5: Commit**

```bash
git add src/pages/koperasi/pembiayaan/PembayaranAngsuranListPage.tsx \
        src/pages/koperasi/pembiayaan/PembayaranAngsuranFormPage.tsx \
        src/pages/koperasi/pembiayaan/PembayaranAngsuranFormPage.module.css
git commit -m "feat(koperasi/pembiayaan): add PembayaranAngsuran list and form pages"
```

---

## Task 18: PembagianSHUListPage + PembagianSHUDetailPage

**Files:**
- Create: `src/pages/koperasi/pembiayaan/PembagianSHUListPage.tsx`
- Create: `src/pages/koperasi/pembiayaan/PembagianSHUDetailPage.tsx`
- Create: `src/pages/koperasi/pembiayaan/PembagianSHUDetailPage.module.css`

- [ ] **Step 18.1: Write PembagianSHUListPage**

```tsx
// src/pages/koperasi/pembiayaan/PembagianSHUListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { pembagianSHUService } from '@/services/koperasi/pembiayaan.service'
import { QK } from '@/services/query-keys'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { PembagianSHU, StatusPembagianSHU } from '@/types/koperasi/pembiayaan.types'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const STATUS_COLOR: Record<StatusPembagianSHU, string> = {
  Draft: 'var(--color-text-tertiary)',
  Diproses: 'var(--color-warning)',
  Selesai: 'var(--color-success)',
}

const COLUMNS: ColumnDef<PembagianSHU>[] = [
  { key: 'periode', label: 'Periode', sortable: true },
  {
    key: 'total_shu',
    label: 'Total SHU',
    render: (row) => fmt(row.total_shu),
  },
  {
    key: 'status',
    label: 'Status',
    render: (row) => <span style={{ color: STATUS_COLOR[row.status] }}>{row.status}</span>,
  },
  {
    key: 'jumlah_anggota',
    label: 'Jumlah Anggota',
    render: (row) => row.jumlah_anggota.toLocaleString('id-ID'),
  },
  {
    key: 'tanggal',
    label: 'Tanggal',
    sortable: true,
    render: (row) => new Date(row.tanggal).toLocaleDateString('id-ID'),
  },
]

export function PembagianSHUListPage() {
  const navigate = useNavigate()
  return (
    <ListPageTemplate<PembagianSHU>
      title="Pembagian SHU"
      queryKey={QK.pembagianSHU}
      fetcher={pembagianSHUService.list}
      columns={COLUMNS}
      onRowClick={(row) => navigate(`${row.id}`)}
      searchPlaceholder="Cari periode SHU..."
      exportFilename="pembagian-shu"
      defaultSort={{ key: 'periode', order: 'desc' }}
    />
  )
}
```

- [ ] **Step 18.2: Write PembagianSHUDetailPage**

```tsx
// src/pages/koperasi/pembiayaan/PembagianSHUDetailPage.tsx
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { pembagianSHUService } from '@/services/koperasi/pembiayaan.service'
import { QK } from '@/services/query-keys'
import type { PembagianSHU, ItemSHUAnggota } from '@/types/koperasi/pembiayaan.types'
import type { PaginatedResponse } from '@/types/api.types'
import styles from './PembagianSHUDetailPage.module.css'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

// ─── Info Tab ────────────────────────────────────────────────────────────────

function InfoTab({ shu }: { shu: PembagianSHU }) {
  return (
    <div className={styles.infoGrid}>
      <InfoRow label="Periode" value={shu.periode} />
      <InfoRow label="Total SHU" value={fmt(shu.total_shu)} />
      <InfoRow label="Status" value={shu.status} />
      <InfoRow label="Jumlah Anggota" value={shu.jumlah_anggota.toLocaleString('id-ID')} />
      <InfoRow label="Tanggal" value={new Date(shu.tanggal).toLocaleDateString('id-ID')} />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  )
}

// ─── Item per Anggota Tab ────────────────────────────────────────────────────

function ItemAnggotaTab({ shuId }: { shuId: string }) {
  const { data, isLoading } = useQuery<PaginatedResponse<ItemSHUAnggota>>({
    queryKey: [QK.pembagianSHUDetail, shuId, 'items'],
    queryFn: () => pembagianSHUService.listItems(shuId),
  })

  if (isLoading) return <div className={styles.loading}>Memuat data anggota...</div>

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Nama Anggota</th>
          <th>Porsi (%)</th>
          <th>Nominal</th>
        </tr>
      </thead>
      <tbody>
        {(data?.items ?? []).map((item) => (
          <tr key={item.id}>
            <td>
              <Link
                to={`/koperasi/anggota/${item.nasabah_id}`}
                className={styles.nasabahLink}
              >
                {item.nasabah_nama}
              </Link>
            </td>
            <td>{item.porsi_persen.toFixed(2)}%</td>
            <td>{fmt(item.nominal)}</td>
          </tr>
        ))}
        {(data?.items ?? []).length === 0 && (
          <tr><td colSpan={3} className={styles.empty}>Belum ada data anggota</td></tr>
        )}
      </tbody>
    </table>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function PembagianSHUDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { data: shu, isLoading } = useQuery<PembagianSHU>({
    queryKey: [QK.pembagianSHUDetail, id],
    queryFn: () => pembagianSHUService.getById(id!),
    enabled: !!id,
  })

  if (isLoading || !shu) {
    return <div className={styles.loading}>Memuat SHU...</div>
  }

  return (
    <DetailPageTemplate
      title={`SHU Periode ${shu.periode}`}
      code={shu.status}
      onBack={() => navigate('/koperasi/pembiayaan/shu')}
      tabs={[
        { id: 'info', label: 'Info SHU', content: <InfoTab shu={shu} /> },
        { id: 'anggota', label: 'Item per Anggota', content: <ItemAnggotaTab shuId={id!} /> },
      ]}
    />
  )
}
```

- [ ] **Step 18.3: Create CSS module**

Create `src/pages/koperasi/pembiayaan/PembagianSHUDetailPage.module.css`:

```css
.loading { padding: 32px; text-align: center; color: var(--color-text-tertiary); }
.nasabahLink { color: var(--color-primary); font-weight: 500; text-decoration: none; }
.nasabahLink:hover { text-decoration: underline; }
.infoGrid { display: flex; flex-direction: column; gap: 0; padding: 8px 0; }
.infoRow { display: grid; grid-template-columns: 180px 1fr; gap: 12px; padding: 12px 24px; border-bottom: 1px solid var(--color-border-light); }
.infoLabel { font-size: 13px; color: var(--color-text-secondary); }
.infoValue { font-size: 14px; color: var(--color-text-primary); font-weight: 500; }
.table { width: 100%; border-collapse: collapse; font-size: 14px; }
.table th { text-align: left; padding: 10px 16px; background: var(--color-surface-hover); font-size: 12px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
.table td { padding: 12px 16px; border-bottom: 1px solid var(--color-border-light); }
.empty { text-align: center; color: var(--color-text-tertiary); padding: 32px; }
```

- [ ] **Step 18.4: Verify no TypeScript errors**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 18.5: Commit**

```bash
git add src/pages/koperasi/pembiayaan/PembagianSHUListPage.tsx \
        src/pages/koperasi/pembiayaan/PembagianSHUDetailPage.tsx \
        src/pages/koperasi/pembiayaan/PembagianSHUDetailPage.module.css
git commit -m "feat(koperasi/pembiayaan): add PembagianSHU list and detail pages"
```

---

## Task 19: Wire routes in routes.koperasi.tsx

**Files:**
- Modify: `src/app/routes.koperasi.tsx`

> If `routes.koperasi.tsx` does not exist yet (infra-plan may not be done), create it. Otherwise append these routes to the existing file.

- [ ] **Step 19.1: Add simpanan routes**

In `src/app/routes.koperasi.tsx`, add inside the `/koperasi/simpanan` route group:

```tsx
// Simpanan imports
import { ProdukSimpananListPage } from '@/pages/koperasi/simpanan/ProdukSimpananListPage'
import { ProdukSimpananFormPage } from '@/pages/koperasi/simpanan/ProdukSimpananFormPage'
import { RekeningListPage } from '@/pages/koperasi/simpanan/RekeningListPage'
import { RekeningDetailPage } from '@/pages/koperasi/simpanan/RekeningDetailPage'
import { RekeningFormPage } from '@/pages/koperasi/simpanan/RekeningFormPage'
import { TransaksiSimpananListPage } from '@/pages/koperasi/simpanan/TransaksiSimpananListPage'
import { PermohonanListPage } from '@/pages/koperasi/simpanan/PermohonanListPage'
import { PermohonanDetailPage } from '@/pages/koperasi/simpanan/PermohonanDetailPage'
import { PermohonanFormPage } from '@/pages/koperasi/simpanan/PermohonanFormPage'

// Simpanan routes (inside /koperasi route group)
{ path: 'simpanan/produk', element: <ProdukSimpananListPage /> },
{ path: 'simpanan/produk/new', element: <ProdukSimpananFormPage /> },
{ path: 'simpanan/produk/:id/edit', element: <ProdukSimpananFormPage /> },
{ path: 'simpanan/rekening', element: <RekeningListPage /> },
{ path: 'simpanan/rekening/:id', element: <RekeningDetailPage /> },
{ path: 'simpanan/rekening/:id/edit', element: <RekeningFormPage /> },
{ path: 'simpanan/transaksi', element: <TransaksiSimpananListPage /> },
{ path: 'simpanan/permohonan', element: <PermohonanListPage /> },
{ path: 'simpanan/permohonan/new', element: <PermohonanFormPage /> },
{ path: 'simpanan/permohonan/:id', element: <PermohonanDetailPage /> },
```

- [ ] **Step 19.2: Add pembiayaan routes**

In the same file, add under `/koperasi/pembiayaan`:

```tsx
// Pembiayaan imports
import { ProdukPembiayaanListPage } from '@/pages/koperasi/pembiayaan/ProdukPembiayaanListPage'
import { ProdukPembiayaanFormPage } from '@/pages/koperasi/pembiayaan/ProdukPembiayaanFormPage'
import { AkadListPage } from '@/pages/koperasi/pembiayaan/AkadListPage'
import { AkadDetailPage } from '@/pages/koperasi/pembiayaan/AkadDetailPage'
import { AkadFormPage } from '@/pages/koperasi/pembiayaan/AkadFormPage'
import { PembayaranAngsuranListPage } from '@/pages/koperasi/pembiayaan/PembayaranAngsuranListPage'
import { PembayaranAngsuranFormPage } from '@/pages/koperasi/pembiayaan/PembayaranAngsuranFormPage'
import { PembagianSHUListPage } from '@/pages/koperasi/pembiayaan/PembagianSHUListPage'
import { PembagianSHUDetailPage } from '@/pages/koperasi/pembiayaan/PembagianSHUDetailPage'

// Pembiayaan routes (inside /koperasi route group)
{ path: 'pembiayaan/produk', element: <ProdukPembiayaanListPage /> },
{ path: 'pembiayaan/produk/new', element: <ProdukPembiayaanFormPage /> },
{ path: 'pembiayaan/produk/:id/edit', element: <ProdukPembiayaanFormPage /> },
{ path: 'pembiayaan/akad', element: <AkadListPage /> },
{ path: 'pembiayaan/akad/new', element: <AkadFormPage /> },
{ path: 'pembiayaan/akad/:id', element: <AkadDetailPage /> },
{ path: 'pembiayaan/pembayaran', element: <PembayaranAngsuranListPage /> },
{ path: 'pembiayaan/pembayaran/new', element: <PembayaranAngsuranFormPage /> },
{ path: 'pembiayaan/shu', element: <PembagianSHUListPage /> },
{ path: 'pembiayaan/shu/:id', element: <PembagianSHUDetailPage /> },
```

- [ ] **Step 19.3: Verify no TypeScript errors and no broken imports**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard && npx tsc --noEmit 2>&1
```

Expected: zero errors.

- [ ] **Step 19.4: Commit**

```bash
git add src/app/routes.koperasi.tsx
git commit -m "feat(koperasi): wire simpanan and pembiayaan routes"
```

---

## Task 20: AppSubNav config — add simpanan + pembiayaan entries

**Files:**
- Modify: `src/layouts/AppSubNav/subnav.config.ts` (create if not yet exists per infra-plan)

- [ ] **Step 20.1: Add simpanan and pembiayaan submenu config**

In `src/layouts/AppSubNav/subnav.config.ts`, inside the `koperasi` key, add:

```typescript
simpanan: [
  { key: 'produk-simpanan', label: 'Produk Simpanan', path: '/koperasi/simpanan/produk' },
  { key: 'rekening',        label: 'Rekening Simpanan', path: '/koperasi/simpanan/rekening' },
  { key: 'transaksi',       label: 'Transaksi', path: '/koperasi/simpanan/transaksi' },
  { key: 'permohonan',      label: 'Permohonan', path: '/koperasi/simpanan/permohonan' },
],
pembiayaan: [
  { key: 'produk-pembiayaan', label: 'Produk Pembiayaan', path: '/koperasi/pembiayaan/produk' },
  { key: 'akad',              label: 'Akad Pembiayaan', path: '/koperasi/pembiayaan/akad' },
  { key: 'pembayaran',        label: 'Pembayaran Angsuran', path: '/koperasi/pembiayaan/pembayaran' },
  { key: 'shu',               label: 'Pembagian SHU', path: '/koperasi/pembiayaan/shu' },
],
```

- [ ] **Step 20.2: Verify no TypeScript errors**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 20.3: Commit**

```bash
git add src/layouts/AppSubNav/subnav.config.ts
git commit -m "feat(koperasi): add simpanan and pembiayaan subnav entries"
```

---

## Task 21: Smoke test in browser

- [ ] **Step 21.1: Start dev server**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard && npm run dev
```

- [ ] **Step 21.2: Verify simpanan routes load without blank screen**

Navigate to each of these paths and confirm the page title renders:
- `/koperasi/simpanan/produk` → "Produk Simpanan"
- `/koperasi/simpanan/produk/new` → "Tambah Produk Simpanan"
- `/koperasi/simpanan/rekening` → "Rekening Simpanan"
- `/koperasi/simpanan/transaksi` → "Transaksi Simpanan"
- `/koperasi/simpanan/permohonan` → "Permohonan Simpanan"
- `/koperasi/simpanan/permohonan/new` → "Buat Permohonan"

- [ ] **Step 21.3: Verify pembiayaan routes load without blank screen**

Navigate to each of these paths and confirm the page title renders:
- `/koperasi/pembiayaan/produk` → "Produk Pembiayaan"
- `/koperasi/pembiayaan/produk/new` → "Tambah Produk Pembiayaan"
- `/koperasi/pembiayaan/akad` → "Akad Pembiayaan"
- `/koperasi/pembiayaan/akad/new` → "Buat Akad Pembiayaan"
- `/koperasi/pembiayaan/pembayaran` → "Pembayaran Angsuran"
- `/koperasi/pembiayaan/pembayaran/new` → "Catat Pembayaran Angsuran"
- `/koperasi/pembiayaan/shu` → "Pembagian SHU"

- [ ] **Step 21.4: Verify AppSubNav shows simpanan and pembiayaan tabs**

When on any `/koperasi/simpanan/*` route, confirm Nav2 bar shows: Produk Simpanan · Rekening Simpanan · Transaksi · Permohonan.

When on any `/koperasi/pembiayaan/*` route, confirm Nav2 bar shows: Produk Pembiayaan · Akad Pembiayaan · Pembayaran Angsuran · Pembagian SHU.

- [ ] **Step 21.5: Final commit**

```bash
git add -p   # review any unstaged changes
git commit -m "chore(koperasi): smoke test passed — simpanan and pembiayaan pages wired"
```

---

## Self-Review Checklist

**Spec coverage:**
- Produk Simpanan List + Form: Task 6
- Rekening Simpanan List: Task 7
- Rekening Simpanan Detail (3 tabs): Task 8
- Rekening Simpanan Form (restricted fields + warning banner): Task 9
- Transaksi Simpanan List (read-only, filters): Task 10
- Permohonan List + Form: Task 11
- Permohonan Detail (2 tabs + workflow approve/reject): Task 12
- Produk Pembiayaan List + Form: Task 13
- Akad Pembiayaan List (nasabah link, status filter): Task 14
- Akad Pembiayaan Detail (3 tabs): Task 15
- Akad Pembiayaan Form: Task 16
- Pembayaran Angsuran List + Form: Task 17
- Pembagian SHU List + Detail (2 tabs): Task 18
- Routes wired: Task 19
- SubNav config updated: Task 20

**Type consistency check:**
- `RekeningSimapnan` (note: typo is intentional, matches spec field name) used consistently across Task 1, 4, 7, 8, 9
- `PermohonanSimpanan` used consistently across Task 1, 4, 8, 11, 12
- `QK.rekeningSimapnan` (matches type name) used consistently in Tasks 7, 8, 9
- `QK.jadwalAngsuran` used in Task 3 and Task 15 `JadwalTab` query key
- `QK.pembayaranAngsuran` used in Task 3, Task 15 `PembayaranTab`, Task 17
- `akadPembiayaanService.listJadwal` defined in Task 5, called in Task 15
- `akadPembiayaanService.listPembayaran` defined in Task 5, called in Task 15
- `pembagianSHUService.listItems` defined in Task 5, called in Task 18
- `rekeningSimapnanService.listTransaksi` defined in Task 4, called in Task 8
- `rekeningSimapnanService.listPermohonan` defined in Task 4, called in Task 8

**Placeholder scan:** No TBD, no TODO in code blocks. All field names, route paths, and CSS class names are explicit.
