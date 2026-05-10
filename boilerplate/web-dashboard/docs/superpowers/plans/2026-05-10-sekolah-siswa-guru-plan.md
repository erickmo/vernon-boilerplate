# Sekolah — Siswa & Guru Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Siswa Full Hub (6-tab detail) and Guru Full Hub (4-tab detail) pages for the Sekolah dashboard, including types, services, list/detail/form pages, and all tab sub-components.

**Architecture:** Types extend `BaseEntity` from `src/types/entity.types.ts`. Services use `createEntityService` targeting Frappe `/api/resource/<Doctype>` endpoints. Pages compose `ListPageTemplate`, `DetailPageTemplate`, and `FormPageTemplate` from existing widgets, with tab content in dedicated sub-components under `src/pages/sekolah/siswa/tabs/` and `src/pages/sekolah/guru/tabs/`.

**Tech Stack:** React 18, TypeScript, TanStack Query, CSS Modules

**Prerequisite:** Phase 1 infra-plan must be complete — `AppSubNav`, `routes.sekolah.tsx`, folder structure `src/types/sekolah/` and `src/services/sekolah/` must exist before starting this plan.

---

## Step 1 — Siswa Types

**File:** `src/types/sekolah/siswa.types.ts`

- [ ] Create the file with all Siswa-related interfaces:

```typescript
import type { BaseEntity } from '@/types/entity.types'

export interface Siswa extends BaseEntity {
  nis: string
  nama_lengkap: string
  tempat_lahir: string
  tanggal_lahir: string
  jenis_kelamin: 'Laki-laki' | 'Perempuan'
  agama: string
  alamat: string
  foto?: string
  status: 'Aktif' | 'Lulus' | 'Keluar' | 'Mutasi'
  rombel_aktif?: string
  tahun_ajaran_aktif?: string
}

export interface WaliSiswa extends BaseEntity {
  siswa_id: string
  nama_wali: string
  hubungan: 'Ayah' | 'Ibu' | 'Wali'
  no_telepon: string
  pekerjaan?: string
  alamat?: string
}

export interface AnggotaRombel extends BaseEntity {
  siswa_id: string
  rombel: string
  tahun_ajaran: string
  semester: string
  is_aktif: boolean
}

export interface MutasiSiswa extends BaseEntity {
  siswa_id: string
  tanggal_mutasi: string
  jenis_mutasi: 'Masuk' | 'Keluar'
  sekolah_asal?: string
  sekolah_tujuan?: string
  alasan: string
  keterangan?: string
}

export interface KelulusanSiswa extends BaseEntity {
  siswa_id: string
  tanggal_lulus: string
  tahun_ajaran: string
  nomor_ijazah?: string
  keterangan?: string
}

export type SiswaFormValues = {
  nama_lengkap: string
  nis: string
  tempat_lahir: string
  tanggal_lahir: string
  jenis_kelamin: string
  agama: string
  alamat: string
  foto: string
}
```

---

## Step 2 — Siswa Service

**File:** `src/services/sekolah/siswa.service.ts`

- [ ] Create service using `createEntityService` plus custom methods for wali and rombel:

```typescript
import { createEntityService } from '@/services/createEntityService'
import { apiClient } from '@/services/api.client'
import type { Siswa, WaliSiswa, AnggotaRombel, MutasiSiswa, KelulusanSiswa } from '@/types/sekolah/siswa.types'
import type { ListParams } from '@/services/createEntityService'
import type { PaginatedResponse } from '@/types/api.types'

// Frappe resource fields for list view (comma-separated in fields param)
const SISWA_LIST_FIELDS = '["name","nis","nama_lengkap","status","rombel_aktif","tahun_ajaran_aktif"]'
const SISWA_LIST_FILTERS = '[["docstatus","!=","2"]]'

const _base = createEntityService<Siswa>('/api/resource/Siswa')

export const siswaService = {
  list: (params?: ListParams): Promise<PaginatedResponse<Siswa>> =>
    _base.list({
      ...params,
      fields: SISWA_LIST_FIELDS,
      filters: SISWA_LIST_FILTERS,
    }),

  getById: (id: string): Promise<Siswa> => _base.getById(id),

  create: (data: Partial<Siswa>): Promise<Siswa> => _base.create(data),

  update: (id: string, data: Partial<Siswa>): Promise<Siswa> => _base.update(id, data),

  delete: (id: string): Promise<void> => _base.delete(id),

  // Custom: list wali for a siswa
  getWali: (siswaId: string): Promise<WaliSiswa[]> =>
    apiClient.get<WaliSiswa[]>(
      `/api/resource/Wali Siswa?filters=[["siswa","=","${siswaId}"]]&fields=["name","nama_wali","hubungan","no_telepon","pekerjaan","alamat"]`
    ),

  // Custom: list rombel history for a siswa
  getRombel: (siswaId: string): Promise<AnggotaRombel[]> =>
    apiClient.get<AnggotaRombel[]>(
      `/api/resource/Anggota Rombel?filters=[["siswa","=","${siswaId}"]]&fields=["name","rombel","tahun_ajaran","semester","is_aktif"]`
    ),

  // Custom: list mutasi for a siswa
  getMutasi: (siswaId: string): Promise<MutasiSiswa[]> =>
    apiClient.get<MutasiSiswa[]>(
      `/api/resource/Mutasi Siswa?filters=[["siswa","=","${siswaId}"]]&fields=["name","tanggal_mutasi","jenis_mutasi","sekolah_asal","sekolah_tujuan","alasan"]`
    ),

  // Custom: list kelulusan for a siswa
  getKelulusan: (siswaId: string): Promise<KelulusanSiswa[]> =>
    apiClient.get<KelulusanSiswa[]>(
      `/api/resource/Kelulusan Siswa?filters=[["siswa","=","${siswaId}"]]&fields=["name","tanggal_lulus","tahun_ajaran","nomor_ijazah"]`
    ),
}
```

---

## Step 3 — SiswaListPage

**File:** `src/pages/sekolah/siswa/SiswaListPage.tsx`

- [ ] Create the list page using `ListPageTemplate`:

```tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { siswaService } from '@/services/sekolah/siswa.service'
import type { Siswa } from '@/types/sekolah/siswa.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const SISWA_COLUMNS: ColumnDef<Siswa>[] = [
  { key: 'nis', label: 'NIS', sortable: true },
  { key: 'nama_lengkap', label: 'Nama Lengkap', sortable: true },
  { key: 'rombel_aktif', label: 'Rombel Aktif', sortable: true },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (row) => (
      <span data-status={row.status}>
        {row.status}
      </span>
    ),
  },
]

export default function SiswaListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<Siswa>
      title="Daftar Siswa"
      queryKey="sekolah-siswa"
      fetcher={siswaService.list}
      columns={SISWA_COLUMNS}
      onRowClick={(row) => navigate(`/sekolah/siswa/${row.id}`)}
      onAdd={() => navigate('/sekolah/siswa/new')}
      addLabel="Tambah Siswa"
      searchPlaceholder="Cari NIS atau nama siswa..."
      exportFilename="daftar-siswa"
      deleteConfig={{
        onDelete: (row) => siswaService.delete(row.id),
        dialogTitle: 'Hapus Siswa?',
        dialogBody: (row) => `Data siswa "${row.nama_lengkap}" (NIS: ${row.nis}) akan dihapus permanen.`,
        successMessage: (row) => `Siswa "${row.nama_lengkap}" berhasil dihapus.`,
        errorMessage: 'Gagal menghapus data siswa.',
      }}
    />
  )
}
```

---

## Step 4 — Siswa Tab: SiswaInfoTab

**File:** `src/pages/sekolah/siswa/tabs/SiswaInfoTab.tsx`

- [ ] Field grid displaying all Siswa fields:

```tsx
import type { Siswa } from '@/types/sekolah/siswa.types'
import styles from './SiswaTab.module.css'

interface Props {
  siswa: Siswa
}

export function SiswaInfoTab({ siswa }: Props) {
  const fields: { label: string; value: string | undefined }[] = [
    { label: 'NIS', value: siswa.nis },
    { label: 'Nama Lengkap', value: siswa.nama_lengkap },
    { label: 'Tempat Lahir', value: siswa.tempat_lahir },
    { label: 'Tanggal Lahir', value: siswa.tanggal_lahir },
    { label: 'Jenis Kelamin', value: siswa.jenis_kelamin },
    { label: 'Agama', value: siswa.agama },
    { label: 'Status', value: siswa.status },
    { label: 'Rombel Aktif', value: siswa.rombel_aktif ?? '—' },
    { label: 'Tahun Ajaran', value: siswa.tahun_ajaran_aktif ?? '—' },
    { label: 'Alamat', value: siswa.alamat },
  ]

  return (
    <div className={styles.infoGrid}>
      {fields.map(({ label, value }) => (
        <div key={label} className={styles.fieldRow}>
          <span className={styles.fieldLabel}>{label}</span>
          <span className={styles.fieldValue}>{value ?? '—'}</span>
        </div>
      ))}
      {siswa.foto && (
        <div className={styles.fotoRow}>
          <span className={styles.fieldLabel}>Foto</span>
          <img src={siswa.foto} alt={siswa.nama_lengkap} className={styles.foto} />
        </div>
      )}
    </div>
  )
}
```

- [ ] Create `src/pages/sekolah/siswa/tabs/SiswaTab.module.css` with grid styles:

```css
.infoGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  padding: var(--space-4);
}

.fieldRow {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.fieldLabel {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.fieldValue {
  font-size: var(--text-sm);
  color: var(--color-text-primary);
}

.fotoRow {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.foto {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}
```

---

## Step 5 — Siswa Tab: SiswaWaliTab

**File:** `src/pages/sekolah/siswa/tabs/SiswaWaliTab.tsx`

- [ ] List of wali siswa with add/edit inline using TanStack Query:

```tsx
import { useQuery } from '@tanstack/react-query'
import { siswaService } from '@/services/sekolah/siswa.service'
import type { WaliSiswa } from '@/types/sekolah/siswa.types'
import styles from './SiswaTab.module.css'

interface Props {
  siswaId: string
}

export function SiswaWaliTab({ siswaId }: Props) {
  const { data: waliList, isLoading } = useQuery<WaliSiswa[]>({
    queryKey: ['siswa-wali', siswaId],
    queryFn: () => siswaService.getWali(siswaId),
  })

  if (isLoading) return <div className={styles.loading}>Memuat data wali...</div>
  if (!waliList?.length) return <div className={styles.empty}>Belum ada data wali siswa.</div>

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nama Wali</th>
            <th>Hubungan</th>
            <th>No. Telepon</th>
            <th>Pekerjaan</th>
          </tr>
        </thead>
        <tbody>
          {waliList.map((wali) => (
            <tr key={wali.id}>
              <td>{wali.nama_wali}</td>
              <td>{wali.hubungan}</td>
              <td>{wali.no_telepon}</td>
              <td>{wali.pekerjaan ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

Add to `SiswaTab.module.css`:

```css
.loading,
.empty {
  padding: var(--space-6);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.tableWrap {
  overflow-x: auto;
  padding: var(--space-4);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.table th {
  text-align: left;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-weight: 500;
  font-size: var(--text-xs);
  text-transform: uppercase;
}

.table td {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border-subtle);
  color: var(--color-text-primary);
}
```

---

## Step 6 — Siswa Tab: SiswaRombelTab

**File:** `src/pages/sekolah/siswa/tabs/SiswaRombelTab.tsx`

- [ ] Current and historical rombel using TanStack Query:

```tsx
import { useQuery } from '@tanstack/react-query'
import { siswaService } from '@/services/sekolah/siswa.service'
import type { AnggotaRombel } from '@/types/sekolah/siswa.types'
import styles from './SiswaTab.module.css'

interface Props {
  siswaId: string
}

export function SiswaRombelTab({ siswaId }: Props) {
  const { data: rombelList, isLoading } = useQuery<AnggotaRombel[]>({
    queryKey: ['siswa-rombel', siswaId],
    queryFn: () => siswaService.getRombel(siswaId),
  })

  if (isLoading) return <div className={styles.loading}>Memuat data rombel...</div>
  if (!rombelList?.length) return <div className={styles.empty}>Belum ada data rombongan belajar.</div>

  const aktif = rombelList.filter((r) => r.is_aktif)
  const historis = rombelList.filter((r) => !r.is_aktif)

  return (
    <div className={styles.rombelWrap}>
      {aktif.length > 0 && (
        <section>
          <h4 className={styles.sectionTitle}>Rombel Aktif</h4>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rombel</th>
                <th>Tahun Ajaran</th>
                <th>Semester</th>
              </tr>
            </thead>
            <tbody>
              {aktif.map((r) => (
                <tr key={r.id}>
                  <td>{r.rombel}</td>
                  <td>{r.tahun_ajaran}</td>
                  <td>{r.semester}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      {historis.length > 0 && (
        <section>
          <h4 className={styles.sectionTitle}>Riwayat Rombel</h4>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Rombel</th>
                <th>Tahun Ajaran</th>
                <th>Semester</th>
              </tr>
            </thead>
            <tbody>
              {historis.map((r) => (
                <tr key={r.id}>
                  <td>{r.rombel}</td>
                  <td>{r.tahun_ajaran}</td>
                  <td>{r.semester}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
```

Add to `SiswaTab.module.css`:

```css
.rombelWrap {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.sectionTitle {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--space-3) 0;
}
```

---

## Step 7 — Siswa Tab: SiswaAbsensiTab

**File:** `src/pages/sekolah/siswa/tabs/SiswaAbsensiTab.tsx`

- [ ] Absensi summary table (reads from Frappe Absensi Siswa resource, filtered by siswa):

```tsx
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api.client'
import styles from './SiswaTab.module.css'

interface AbsensiEntry {
  id: string
  tanggal: string
  mata_pelajaran: string
  keterangan: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'
  jam_ke?: number
}

interface Props {
  siswaId: string
}

export function SiswaAbsensiTab({ siswaId }: Props) {
  const { data: absensiList, isLoading } = useQuery<AbsensiEntry[]>({
    queryKey: ['siswa-absensi', siswaId],
    queryFn: () =>
      apiClient.get<AbsensiEntry[]>(
        `/api/resource/Absensi Siswa?filters=[["siswa","=","${siswaId}"]]&fields=["name","tanggal","mata_pelajaran","keterangan","jam_ke"]&limit_page_length=100&order_by=tanggal desc`
      ),
  })

  if (isLoading) return <div className={styles.loading}>Memuat data absensi...</div>
  if (!absensiList?.length) return <div className={styles.empty}>Belum ada data absensi.</div>

  const summary = absensiList.reduce(
    (acc, a) => {
      acc[a.keterangan] = (acc[a.keterangan] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className={styles.tableWrap}>
      <div className={styles.summaryRow}>
        {(['Hadir', 'Sakit', 'Izin', 'Alpha'] as const).map((k) => (
          <div key={k} className={styles.summaryCard} data-type={k.toLowerCase()}>
            <span className={styles.summaryLabel}>{k}</span>
            <span className={styles.summaryCount}>{summary[k] ?? 0}</span>
          </div>
        ))}
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Mata Pelajaran</th>
            <th>Jam Ke</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {absensiList.map((a) => (
            <tr key={a.id}>
              <td>{a.tanggal}</td>
              <td>{a.mata_pelajaran}</td>
              <td>{a.jam_ke ?? '—'}</td>
              <td>
                <span data-status={a.keterangan.toLowerCase()}>{a.keterangan}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

Add to `SiswaTab.module.css`:

```css
.summaryRow {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-4) 0;
}

.summaryCard {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  min-width: 80px;
  gap: var(--space-1);
}

.summaryLabel {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-weight: 500;
}

.summaryCount {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--color-text-primary);
}
```

---

## Step 8 — Siswa Tab: SiswaNilaiTab

**File:** `src/pages/sekolah/siswa/tabs/SiswaNilaiTab.tsx`

- [ ] Nilai per mapel table (reads from Frappe Nilai Siswa resource):

```tsx
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api.client'
import styles from './SiswaTab.module.css'

interface NilaiEntry {
  id: string
  mata_pelajaran: string
  semester: string
  tahun_ajaran: string
  nilai_harian?: number
  nilai_uts?: number
  nilai_uas?: number
  nilai_akhir?: number
}

interface Props {
  siswaId: string
}

export function SiswaNilaiTab({ siswaId }: Props) {
  const { data: nilaiList, isLoading } = useQuery<NilaiEntry[]>({
    queryKey: ['siswa-nilai', siswaId],
    queryFn: () =>
      apiClient.get<NilaiEntry[]>(
        `/api/resource/Nilai Siswa?filters=[["siswa","=","${siswaId}"]]&fields=["name","mata_pelajaran","semester","tahun_ajaran","nilai_harian","nilai_uts","nilai_uas","nilai_akhir"]&order_by=tahun_ajaran desc, semester asc`
      ),
  })

  if (isLoading) return <div className={styles.loading}>Memuat data nilai...</div>
  if (!nilaiList?.length) return <div className={styles.empty}>Belum ada data nilai.</div>

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Mata Pelajaran</th>
            <th>Tahun Ajaran</th>
            <th>Semester</th>
            <th>Harian</th>
            <th>UTS</th>
            <th>UAS</th>
            <th>Akhir</th>
          </tr>
        </thead>
        <tbody>
          {nilaiList.map((n) => (
            <tr key={n.id}>
              <td>{n.mata_pelajaran}</td>
              <td>{n.tahun_ajaran}</td>
              <td>{n.semester}</td>
              <td>{n.nilai_harian ?? '—'}</td>
              <td>{n.nilai_uts ?? '—'}</td>
              <td>{n.nilai_uas ?? '—'}</td>
              <td>
                <strong>{n.nilai_akhir ?? '—'}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

## Step 9 — Siswa Tab: SiswaMutasiTab

**File:** `src/pages/sekolah/siswa/tabs/SiswaMutasiTab.tsx`

- [ ] Mutasi and kelulusan history using TanStack Query:

```tsx
import { useQuery } from '@tanstack/react-query'
import { siswaService } from '@/services/sekolah/siswa.service'
import type { MutasiSiswa, KelulusanSiswa } from '@/types/sekolah/siswa.types'
import styles from './SiswaTab.module.css'

interface Props {
  siswaId: string
}

export function SiswaMutasiTab({ siswaId }: Props) {
  const { data: mutasiList, isLoading: loadingMutasi } = useQuery<MutasiSiswa[]>({
    queryKey: ['siswa-mutasi', siswaId],
    queryFn: () => siswaService.getMutasi(siswaId),
  })

  const { data: kelulusanList, isLoading: loadingKelulusan } = useQuery<KelulusanSiswa[]>({
    queryKey: ['siswa-kelulusan', siswaId],
    queryFn: () => siswaService.getKelulusan(siswaId),
  })

  if (loadingMutasi || loadingKelulusan) return <div className={styles.loading}>Memuat data...</div>

  const hasMutasi = mutasiList && mutasiList.length > 0
  const hasKelulusan = kelulusanList && kelulusanList.length > 0

  if (!hasMutasi && !hasKelulusan) {
    return <div className={styles.empty}>Tidak ada data mutasi atau kelulusan.</div>
  }

  return (
    <div className={styles.rombelWrap}>
      {hasMutasi && (
        <section>
          <h4 className={styles.sectionTitle}>Riwayat Mutasi</h4>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Jenis</th>
                <th>Sekolah Asal</th>
                <th>Sekolah Tujuan</th>
                <th>Alasan</th>
              </tr>
            </thead>
            <tbody>
              {mutasiList.map((m) => (
                <tr key={m.id}>
                  <td>{m.tanggal_mutasi}</td>
                  <td>{m.jenis_mutasi}</td>
                  <td>{m.sekolah_asal ?? '—'}</td>
                  <td>{m.sekolah_tujuan ?? '—'}</td>
                  <td>{m.alasan}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      {hasKelulusan && (
        <section>
          <h4 className={styles.sectionTitle}>Data Kelulusan</h4>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tanggal Lulus</th>
                <th>Tahun Ajaran</th>
                <th>No. Ijazah</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {kelulusanList.map((k) => (
                <tr key={k.id}>
                  <td>{k.tanggal_lulus}</td>
                  <td>{k.tahun_ajaran}</td>
                  <td>{k.nomor_ijazah ?? '—'}</td>
                  <td>{k.keterangan ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
```

---

## Step 10 — SiswaDetailPage (Full Hub, 6 tabs)

**File:** `src/pages/sekolah/siswa/SiswaDetailPage.tsx`

- [ ] Create the hub detail page using `DetailPageTemplate` with 6 tabs:

```tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Edit, Trash2 } from 'lucide-react'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { siswaService } from '@/services/sekolah/siswa.service'
import { toast } from '@/widgets/Toast/Toast'
import { SiswaInfoTab } from './tabs/SiswaInfoTab'
import { SiswaWaliTab } from './tabs/SiswaWaliTab'
import { SiswaRombelTab } from './tabs/SiswaRombelTab'
import { SiswaAbsensiTab } from './tabs/SiswaAbsensiTab'
import { SiswaNilaiTab } from './tabs/SiswaNilaiTab'
import { SiswaMutasiTab } from './tabs/SiswaMutasiTab'
import type { DetailPageTab, DetailPageAction } from '@/widgets/DetailPageTemplate/DetailPageTemplate'

export default function SiswaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: siswa, isLoading, error } = useQuery({
    queryKey: ['siswa', id],
    queryFn: () => siswaService.getById(id!),
    enabled: !!id,
  })

  if (isLoading) return <div>Memuat data siswa...</div>
  if (error || !siswa) return <div>Data siswa tidak ditemukan.</div>

  const tabs: DetailPageTab[] = [
    {
      id: 'info',
      label: 'Info Dasar',
      content: <SiswaInfoTab siswa={siswa} />,
    },
    {
      id: 'wali',
      label: 'Wali',
      content: <SiswaWaliTab siswaId={siswa.id} />,
    },
    {
      id: 'rombel',
      label: 'Rombel',
      content: <SiswaRombelTab siswaId={siswa.id} />,
    },
    {
      id: 'absensi',
      label: 'Absensi',
      content: <SiswaAbsensiTab siswaId={siswa.id} />,
    },
    {
      id: 'nilai',
      label: 'Nilai & Raport',
      content: <SiswaNilaiTab siswaId={siswa.id} />,
    },
    {
      id: 'mutasi',
      label: 'Mutasi/Kelulusan',
      content: <SiswaMutasiTab siswaId={siswa.id} />,
    },
  ]

  const actions: DetailPageAction[] = [
    {
      label: 'Edit',
      icon: <Edit size={14} />,
      onClick: () => navigate(`/sekolah/siswa/${siswa.id}/edit`),
      variant: 'primary',
    },
    {
      label: 'Hapus',
      icon: <Trash2 size={14} />,
      onClick: async () => {
        if (!confirm(`Hapus siswa "${siswa.nama_lengkap}"?`)) return
        try {
          await siswaService.delete(siswa.id)
          toast.success(`Siswa "${siswa.nama_lengkap}" berhasil dihapus.`)
          navigate('/sekolah/siswa')
        } catch {
          toast.error('Gagal menghapus data siswa.')
        }
      },
      variant: 'danger',
    },
  ]

  return (
    <DetailPageTemplate
      title={siswa.nama_lengkap}
      code={siswa.nis}
      tabs={tabs}
      actions={actions}
      onBack={() => navigate('/sekolah/siswa')}
    />
  )
}
```

---

## Step 11 — SiswaFormPage

**File:** `src/pages/sekolah/siswa/SiswaFormPage.tsx`

- [ ] Create form page using `FormPageTemplate` and `useForm` hook:

```tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { siswaService } from '@/services/sekolah/siswa.service'
import { useForm } from '@/hooks/useForm'
import { toast } from '@/widgets/Toast/Toast'
import type { SiswaFormValues } from '@/types/sekolah/siswa.types'
import styles from './SiswaFormPage.module.css'

const JENIS_KELAMIN_OPTIONS = ['Laki-laki', 'Perempuan'] as const
const AGAMA_OPTIONS = ['Islam', 'Kristen', 'Katholik', 'Hindu', 'Buddha', 'Konghucu'] as const

const INITIAL_VALUES: SiswaFormValues = {
  nama_lengkap: '',
  nis: '',
  tempat_lahir: '',
  tanggal_lahir: '',
  jenis_kelamin: '',
  agama: '',
  alamat: '',
  foto: '',
}

function validate(values: SiswaFormValues): Partial<Record<keyof SiswaFormValues, string>> {
  const errors: Partial<Record<keyof SiswaFormValues, string>> = {}
  if (!values.nama_lengkap.trim()) errors.nama_lengkap = 'Nama lengkap wajib diisi.'
  if (!values.nis.trim()) errors.nis = 'NIS wajib diisi.'
  if (!values.tanggal_lahir) errors.tanggal_lahir = 'Tanggal lahir wajib diisi.'
  if (!values.jenis_kelamin) errors.jenis_kelamin = 'Jenis kelamin wajib dipilih.'
  return errors
}

export default function SiswaFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string>()

  const { data: existing } = useQuery({
    queryKey: ['siswa', id],
    queryFn: () => siswaService.getById(id!),
    enabled: isEdit,
  })

  const form = useForm<SiswaFormValues>({
    initialValues: existing
      ? {
          nama_lengkap: existing.nama_lengkap,
          nis: existing.nis,
          tempat_lahir: existing.tempat_lahir,
          tanggal_lahir: existing.tanggal_lahir,
          jenis_kelamin: existing.jenis_kelamin,
          agama: existing.agama,
          alamat: existing.alamat,
          foto: existing.foto ?? '',
        }
      : INITIAL_VALUES,
    validate,
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      if (isEdit && id) {
        await siswaService.update(id, values)
        await queryClient.invalidateQueries({ queryKey: ['siswa', id] })
        toast.success('Data siswa berhasil diperbarui.')
        navigate(`/sekolah/siswa/${id}`)
      } else {
        const created = await siswaService.create(values)
        await queryClient.invalidateQueries({ queryKey: ['sekolah-siswa'] })
        toast.success('Siswa baru berhasil ditambahkan.')
        navigate(`/sekolah/siswa/${created.id}`)
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan, coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  })

  const formContent = (
    <div className={styles.formGrid}>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="nama_lengkap">Nama Lengkap <span className={styles.required}>*</span></label>
        <input id="nama_lengkap" className={styles.input} type="text" {...form.field('nama_lengkap')} />
        {form.touched.nama_lengkap && form.errors.nama_lengkap && (
          <span className={styles.errorMsg}>{form.errors.nama_lengkap}</span>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="nis">NIS <span className={styles.required}>*</span></label>
        <input id="nis" className={styles.input} type="text" {...form.field('nis')} />
        {form.touched.nis && form.errors.nis && (
          <span className={styles.errorMsg}>{form.errors.nis}</span>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="tempat_lahir">Tempat Lahir</label>
        <input id="tempat_lahir" className={styles.input} type="text" {...form.field('tempat_lahir')} />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="tanggal_lahir">Tanggal Lahir <span className={styles.required}>*</span></label>
        <input id="tanggal_lahir" className={styles.input} type="date" {...form.field('tanggal_lahir')} />
        {form.touched.tanggal_lahir && form.errors.tanggal_lahir && (
          <span className={styles.errorMsg}>{form.errors.tanggal_lahir}</span>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="jenis_kelamin">Jenis Kelamin <span className={styles.required}>*</span></label>
        <select id="jenis_kelamin" className={styles.input} {...form.field('jenis_kelamin')}>
          <option value="">Pilih jenis kelamin...</option>
          {JENIS_KELAMIN_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {form.touched.jenis_kelamin && form.errors.jenis_kelamin && (
          <span className={styles.errorMsg}>{form.errors.jenis_kelamin}</span>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="agama">Agama</label>
        <select id="agama" className={styles.input} {...form.field('agama')}>
          <option value="">Pilih agama...</option>
          {AGAMA_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
        <label className={styles.label} htmlFor="alamat">Alamat</label>
        <textarea id="alamat" className={styles.textarea} rows={3} {...form.field('alamat')} />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="foto">URL Foto</label>
        <input id="foto" className={styles.input} type="url" placeholder="https://..." {...form.field('foto')} />
      </div>
    </div>
  )

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Siswa' : 'Tambah Siswa'}
      onBack={() => navigate(-1)}
      onCancel={() => navigate(-1)}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      serverError={serverError}
      tabs={[{ id: 'form', label: 'Data Siswa', content: formContent }]}
    />
  )
}
```

- [ ] Create `src/pages/sekolah/siswa/SiswaFormPage.module.css`:

```css
.formGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  padding: var(--space-4);
}

.fieldGroup {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.fullWidth {
  grid-column: 1 / -1;
}

.label {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-primary);
}

.required {
  color: var(--color-danger);
}

.input {
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  background: var(--color-surface);
  width: 100%;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-alpha);
}

.textarea {
  composes: input;
  resize: vertical;
  min-height: 80px;
}

.errorMsg {
  font-size: var(--text-xs);
  color: var(--color-danger);
}
```

---

## Step 12 — Route Stubs for Siswa (add to routes.sekolah.tsx)

**File:** `src/app/routes.sekolah.tsx`

- [ ] Add these route entries inside the `/sekolah` route children array:

```tsx
// Siswa routes
{ path: 'siswa',              element: <S><SiswaListPage /></S> },
{ path: 'siswa/new',          element: <S><SiswaFormPage /></S> },
{ path: 'siswa/pendaftaran',  element: <S><PendaftaranSiswaListPage /></S> },  // stub
{ path: 'siswa/rombel',       element: <S><RombelListPage /></S> },            // stub
{ path: 'siswa/:id',          element: <S><SiswaDetailPage /></S> },
{ path: 'siswa/:id/edit',     element: <S><SiswaFormPage /></S> },
```

Where lazy imports at top of routes.sekolah.tsx are:

```tsx
const SiswaListPage             = lazy(() => import('@/pages/sekolah/siswa/SiswaListPage'))
const SiswaDetailPage           = lazy(() => import('@/pages/sekolah/siswa/SiswaDetailPage'))
const SiswaFormPage             = lazy(() => import('@/pages/sekolah/siswa/SiswaFormPage'))
// Stubs — implement in later phase:
const PendaftaranSiswaListPage  = lazy(() => import('@/pages/sekolah/siswa/PendaftaranSiswaListPage'))
const RombelListPage            = lazy(() => import('@/pages/sekolah/siswa/RombelListPage'))
```

- [ ] Create stub files so lazy imports don't break the build:

**`src/pages/sekolah/siswa/PendaftaranSiswaListPage.tsx`** (stub):
```tsx
// TODO: implement in later phase (Phase 3)
export default function PendaftaranSiswaListPage() {
  return <div style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>Halaman Pendaftaran Siswa — segera hadir.</div>
}
```

**`src/pages/sekolah/siswa/RombelListPage.tsx`** (stub):
```tsx
// TODO: implement in later phase (Phase 3)
export default function RombelListPage() {
  return <div style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>Halaman Rombongan Belajar — segera hadir.</div>
}
```

---

## Step 13 — Guru Types

**File:** `src/types/sekolah/guru.types.ts`

- [ ] Create all Guru-related interfaces:

```typescript
import type { BaseEntity } from '@/types/entity.types'

export interface Guru extends BaseEntity {
  nip: string
  nama: string
  mata_pelajaran: string
  status: 'Aktif' | 'Cuti' | 'Nonaktif'
  alamat?: string
  foto?: string
  no_telepon?: string
  email?: string
  tanggal_lahir?: string
  jenis_kelamin?: 'Laki-laki' | 'Perempuan'
}

export interface PenugasanGuru extends BaseEntity {
  guru_id: string
  tahun_ajaran: string
  semester: string
  mata_pelajaran: string
  kelas: string
  jam_mengajar?: number
}

export interface BerkasGuru extends BaseEntity {
  guru_id: string
  jenis_berkas: 'SK Pengangkatan' | 'SK Mutasi' | 'Sertifikat' | 'Ijazah' | 'Lainnya'
  nama_berkas: string
  tanggal_berkas?: string
  file_url?: string
  keterangan?: string
}

export type GuruFormValues = {
  nip: string
  nama: string
  mata_pelajaran: string
  status: string
  alamat: string
  foto: string
}
```

---

## Step 14 — Guru Service

**File:** `src/services/sekolah/guru.service.ts`

- [ ] Create service using `createEntityService` plus custom methods for penugasan and berkas:

```typescript
import { createEntityService } from '@/services/createEntityService'
import { apiClient } from '@/services/api.client'
import type { Guru, PenugasanGuru, BerkasGuru } from '@/types/sekolah/guru.types'
import type { ListParams } from '@/services/createEntityService'
import type { PaginatedResponse } from '@/types/api.types'

const GURU_LIST_FIELDS = '["name","nip","nama","mata_pelajaran","status"]'
const GURU_LIST_FILTERS = '[["docstatus","!=","2"]]'

const _base = createEntityService<Guru>('/api/resource/Guru')

export const guruService = {
  list: (params?: ListParams): Promise<PaginatedResponse<Guru>> =>
    _base.list({
      ...params,
      fields: GURU_LIST_FIELDS,
      filters: GURU_LIST_FILTERS,
    }),

  getById: (id: string): Promise<Guru> => _base.getById(id),

  create: (data: Partial<Guru>): Promise<Guru> => _base.create(data),

  update: (id: string, data: Partial<Guru>): Promise<Guru> => _base.update(id, data),

  delete: (id: string): Promise<void> => _base.delete(id),

  // Custom: penugasan history for a guru
  getPenugasan: (guruId: string): Promise<PenugasanGuru[]> =>
    apiClient.get<PenugasanGuru[]>(
      `/api/resource/Penugasan Guru?filters=[["guru","=","${guruId}"]]&fields=["name","tahun_ajaran","semester","mata_pelajaran","kelas","jam_mengajar"]&order_by=tahun_ajaran desc`
    ),

  // Custom: berkas for a guru
  getBerkas: (guruId: string): Promise<BerkasGuru[]> =>
    apiClient.get<BerkasGuru[]>(
      `/api/resource/Berkas Guru?filters=[["guru","=","${guruId}"]]&fields=["name","jenis_berkas","nama_berkas","tanggal_berkas","file_url","keterangan"]`
    ),
}
```

---

## Step 15 — GuruListPage

**File:** `src/pages/sekolah/guru/GuruListPage.tsx`

- [ ] Create the list page:

```tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { guruService } from '@/services/sekolah/guru.service'
import type { Guru } from '@/types/sekolah/guru.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const GURU_COLUMNS: ColumnDef<Guru>[] = [
  { key: 'nip', label: 'NIP', sortable: true },
  { key: 'nama', label: 'Nama', sortable: true },
  { key: 'mata_pelajaran', label: 'Mata Pelajaran', sortable: true },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (row) => <span data-status={row.status.toLowerCase()}>{row.status}</span>,
  },
]

export default function GuruListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<Guru>
      title="Daftar Guru"
      queryKey="sekolah-guru"
      fetcher={guruService.list}
      columns={GURU_COLUMNS}
      onRowClick={(row) => navigate(`/sekolah/guru/${row.id}`)}
      onAdd={() => navigate('/sekolah/guru/new')}
      addLabel="Tambah Guru"
      searchPlaceholder="Cari NIP atau nama guru..."
      exportFilename="daftar-guru"
      deleteConfig={{
        onDelete: (row) => guruService.delete(row.id),
        dialogTitle: 'Hapus Guru?',
        dialogBody: (row) => `Data guru "${row.nama}" (NIP: ${row.nip}) akan dihapus permanen.`,
        successMessage: (row) => `Guru "${row.nama}" berhasil dihapus.`,
        errorMessage: 'Gagal menghapus data guru.',
      }}
    />
  )
}
```

---

## Step 16 — Guru Tab: GuruInfoTab

**File:** `src/pages/sekolah/guru/tabs/GuruInfoTab.tsx`

- [ ] Field grid for all guru fields, reusing the same CSS class pattern as SiswaInfoTab:

```tsx
import type { Guru } from '@/types/sekolah/guru.types'
import styles from './GuruTab.module.css'

interface Props {
  guru: Guru
}

export function GuruInfoTab({ guru }: Props) {
  const fields: { label: string; value: string | undefined }[] = [
    { label: 'NIP', value: guru.nip },
    { label: 'Nama', value: guru.nama },
    { label: 'Mata Pelajaran', value: guru.mata_pelajaran },
    { label: 'Status', value: guru.status },
    { label: 'Jenis Kelamin', value: guru.jenis_kelamin },
    { label: 'Tanggal Lahir', value: guru.tanggal_lahir },
    { label: 'No. Telepon', value: guru.no_telepon },
    { label: 'Email', value: guru.email },
    { label: 'Alamat', value: guru.alamat },
  ]

  return (
    <div className={styles.infoGrid}>
      {fields.map(({ label, value }) => (
        <div key={label} className={styles.fieldRow}>
          <span className={styles.fieldLabel}>{label}</span>
          <span className={styles.fieldValue}>{value ?? '—'}</span>
        </div>
      ))}
      {guru.foto && (
        <div className={styles.fotoRow}>
          <span className={styles.fieldLabel}>Foto</span>
          <img src={guru.foto} alt={guru.nama} className={styles.foto} />
        </div>
      )}
    </div>
  )
}
```

- [ ] Create `src/pages/sekolah/guru/tabs/GuruTab.module.css` — copy same CSS as `SiswaTab.module.css` (identical structure, no shared file needed per module isolation pattern).

---

## Step 17 — Guru Tab: GuruPenugasanTab

**File:** `src/pages/sekolah/guru/tabs/GuruPenugasanTab.tsx`

- [ ] Penugasan & jadwal using TanStack Query:

```tsx
import { useQuery } from '@tanstack/react-query'
import { guruService } from '@/services/sekolah/guru.service'
import type { PenugasanGuru } from '@/types/sekolah/guru.types'
import styles from './GuruTab.module.css'

interface Props {
  guruId: string
}

export function GuruPenugasanTab({ guruId }: Props) {
  const { data: penugasanList, isLoading } = useQuery<PenugasanGuru[]>({
    queryKey: ['guru-penugasan', guruId],
    queryFn: () => guruService.getPenugasan(guruId),
  })

  if (isLoading) return <div className={styles.loading}>Memuat data penugasan...</div>
  if (!penugasanList?.length) return <div className={styles.empty}>Belum ada data penugasan.</div>

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Tahun Ajaran</th>
            <th>Semester</th>
            <th>Mata Pelajaran</th>
            <th>Kelas</th>
            <th>Jam Mengajar</th>
          </tr>
        </thead>
        <tbody>
          {penugasanList.map((p) => (
            <tr key={p.id}>
              <td>{p.tahun_ajaran}</td>
              <td>{p.semester}</td>
              <td>{p.mata_pelajaran}</td>
              <td>{p.kelas}</td>
              <td>{p.jam_mengajar ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

## Step 18 — Guru Tab: GuruAbsensiTab

**File:** `src/pages/sekolah/guru/tabs/GuruAbsensiTab.tsx`

- [ ] Absensi summary table for guru (reads from Frappe Absensi Guru resource):

```tsx
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/services/api.client'
import styles from './GuruTab.module.css'

interface AbsensiGuruEntry {
  id: string
  tanggal: string
  keterangan: 'Hadir' | 'Sakit' | 'Izin' | 'Alpha'
  kelas?: string
  mata_pelajaran?: string
}

interface Props {
  guruId: string
}

export function GuruAbsensiTab({ guruId }: Props) {
  const { data: absensiList, isLoading } = useQuery<AbsensiGuruEntry[]>({
    queryKey: ['guru-absensi', guruId],
    queryFn: () =>
      apiClient.get<AbsensiGuruEntry[]>(
        `/api/resource/Absensi Guru?filters=[["guru","=","${guruId}"]]&fields=["name","tanggal","keterangan","kelas","mata_pelajaran"]&limit_page_length=100&order_by=tanggal desc`
      ),
  })

  if (isLoading) return <div className={styles.loading}>Memuat data absensi...</div>
  if (!absensiList?.length) return <div className={styles.empty}>Belum ada data absensi guru.</div>

  const summary = absensiList.reduce(
    (acc, a) => {
      acc[a.keterangan] = (acc[a.keterangan] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className={styles.tableWrap}>
      <div className={styles.summaryRow}>
        {(['Hadir', 'Sakit', 'Izin', 'Alpha'] as const).map((k) => (
          <div key={k} className={styles.summaryCard} data-type={k.toLowerCase()}>
            <span className={styles.summaryLabel}>{k}</span>
            <span className={styles.summaryCount}>{summary[k] ?? 0}</span>
          </div>
        ))}
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Mata Pelajaran</th>
            <th>Kelas</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {absensiList.map((a) => (
            <tr key={a.id}>
              <td>{a.tanggal}</td>
              <td>{a.mata_pelajaran ?? '—'}</td>
              <td>{a.kelas ?? '—'}</td>
              <td>
                <span data-status={a.keterangan.toLowerCase()}>{a.keterangan}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

## Step 19 — Guru Tab: GuruBerkasTab

**File:** `src/pages/sekolah/guru/tabs/GuruBerkasTab.tsx`

- [ ] SK & Berkas list using TanStack Query:

```tsx
import { useQuery } from '@tanstack/react-query'
import { FileText, ExternalLink } from 'lucide-react'
import { guruService } from '@/services/sekolah/guru.service'
import type { BerkasGuru } from '@/types/sekolah/guru.types'
import styles from './GuruTab.module.css'

interface Props {
  guruId: string
}

export function GuruBerkasTab({ guruId }: Props) {
  const { data: berkasList, isLoading } = useQuery<BerkasGuru[]>({
    queryKey: ['guru-berkas', guruId],
    queryFn: () => guruService.getBerkas(guruId),
  })

  if (isLoading) return <div className={styles.loading}>Memuat data berkas...</div>
  if (!berkasList?.length) return <div className={styles.empty}>Belum ada berkas yang diunggah.</div>

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Jenis Berkas</th>
            <th>Nama Berkas</th>
            <th>Tanggal</th>
            <th>Keterangan</th>
            <th>File</th>
          </tr>
        </thead>
        <tbody>
          {berkasList.map((b) => (
            <tr key={b.id}>
              <td>
                <span className={styles.berkasType}>
                  <FileText size={14} />
                  {b.jenis_berkas}
                </span>
              </td>
              <td>{b.nama_berkas}</td>
              <td>{b.tanggal_berkas ?? '—'}</td>
              <td>{b.keterangan ?? '—'}</td>
              <td>
                {b.file_url ? (
                  <a href={b.file_url} target="_blank" rel="noopener noreferrer" className={styles.fileLink}>
                    <ExternalLink size={12} /> Buka
                  </a>
                ) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

Add to `GuruTab.module.css`:

```css
.berkasType {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
}

.fileLink {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-primary);
  font-size: var(--text-xs);
  text-decoration: none;
}

.fileLink:hover {
  text-decoration: underline;
}
```

---

## Step 20 — GuruDetailPage (Full Hub, 4 tabs)

**File:** `src/pages/sekolah/guru/GuruDetailPage.tsx`

- [ ] Create the hub detail page using `DetailPageTemplate` with 4 tabs:

```tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Edit, Trash2 } from 'lucide-react'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { guruService } from '@/services/sekolah/guru.service'
import { toast } from '@/widgets/Toast/Toast'
import { GuruInfoTab } from './tabs/GuruInfoTab'
import { GuruPenugasanTab } from './tabs/GuruPenugasanTab'
import { GuruAbsensiTab } from './tabs/GuruAbsensiTab'
import { GuruBerkasTab } from './tabs/GuruBerkasTab'
import type { DetailPageTab, DetailPageAction } from '@/widgets/DetailPageTemplate/DetailPageTemplate'

export default function GuruDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: guru, isLoading, error } = useQuery({
    queryKey: ['guru', id],
    queryFn: () => guruService.getById(id!),
    enabled: !!id,
  })

  if (isLoading) return <div>Memuat data guru...</div>
  if (error || !guru) return <div>Data guru tidak ditemukan.</div>

  const tabs: DetailPageTab[] = [
    {
      id: 'info',
      label: 'Info Dasar',
      content: <GuruInfoTab guru={guru} />,
    },
    {
      id: 'penugasan',
      label: 'Penugasan & Jadwal',
      content: <GuruPenugasanTab guruId={guru.id} />,
    },
    {
      id: 'absensi',
      label: 'Absensi',
      content: <GuruAbsensiTab guruId={guru.id} />,
    },
    {
      id: 'berkas',
      label: 'SK & Berkas',
      content: <GuruBerkasTab guruId={guru.id} />,
    },
  ]

  const actions: DetailPageAction[] = [
    {
      label: 'Edit',
      icon: <Edit size={14} />,
      onClick: () => navigate(`/sekolah/guru/${guru.id}/edit`),
      variant: 'primary',
    },
    {
      label: 'Hapus',
      icon: <Trash2 size={14} />,
      onClick: async () => {
        if (!confirm(`Hapus guru "${guru.nama}"?`)) return
        try {
          await guruService.delete(guru.id)
          toast.success(`Guru "${guru.nama}" berhasil dihapus.`)
          navigate('/sekolah/guru')
        } catch {
          toast.error('Gagal menghapus data guru.')
        }
      },
      variant: 'danger',
    },
  ]

  return (
    <DetailPageTemplate
      title={guru.nama}
      code={guru.nip}
      tabs={tabs}
      actions={actions}
      onBack={() => navigate('/sekolah/guru')}
    />
  )
}
```

---

## Step 21 — GuruFormPage

**File:** `src/pages/sekolah/guru/GuruFormPage.tsx`

- [ ] Create form page using `FormPageTemplate` and `useForm`:

```tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { guruService } from '@/services/sekolah/guru.service'
import { useForm } from '@/hooks/useForm'
import { toast } from '@/widgets/Toast/Toast'
import type { GuruFormValues } from '@/types/sekolah/guru.types'
import styles from './GuruFormPage.module.css'

const STATUS_OPTIONS = ['Aktif', 'Cuti', 'Nonaktif'] as const

const INITIAL_VALUES: GuruFormValues = {
  nip: '',
  nama: '',
  mata_pelajaran: '',
  status: '',
  alamat: '',
  foto: '',
}

function validate(values: GuruFormValues): Partial<Record<keyof GuruFormValues, string>> {
  const errors: Partial<Record<keyof GuruFormValues, string>> = {}
  if (!values.nip.trim()) errors.nip = 'NIP wajib diisi.'
  if (!values.nama.trim()) errors.nama = 'Nama wajib diisi.'
  if (!values.mata_pelajaran.trim()) errors.mata_pelajaran = 'Mata pelajaran wajib diisi.'
  if (!values.status) errors.status = 'Status wajib dipilih.'
  return errors
}

export default function GuruFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string>()

  const { data: existing } = useQuery({
    queryKey: ['guru', id],
    queryFn: () => guruService.getById(id!),
    enabled: isEdit,
  })

  const form = useForm<GuruFormValues>({
    initialValues: existing
      ? {
          nip: existing.nip,
          nama: existing.nama,
          mata_pelajaran: existing.mata_pelajaran,
          status: existing.status,
          alamat: existing.alamat ?? '',
          foto: existing.foto ?? '',
        }
      : INITIAL_VALUES,
    validate,
  })

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      if (isEdit && id) {
        await guruService.update(id, values)
        await queryClient.invalidateQueries({ queryKey: ['guru', id] })
        toast.success('Data guru berhasil diperbarui.')
        navigate(`/sekolah/guru/${id}`)
      } else {
        const created = await guruService.create(values)
        await queryClient.invalidateQueries({ queryKey: ['sekolah-guru'] })
        toast.success('Guru baru berhasil ditambahkan.')
        navigate(`/sekolah/guru/${created.id}`)
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan, coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  })

  const formContent = (
    <div className={styles.formGrid}>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="nip">NIP <span className={styles.required}>*</span></label>
        <input id="nip" className={styles.input} type="text" {...form.field('nip')} />
        {form.touched.nip && form.errors.nip && <span className={styles.errorMsg}>{form.errors.nip}</span>}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="nama">Nama <span className={styles.required}>*</span></label>
        <input id="nama" className={styles.input} type="text" {...form.field('nama')} />
        {form.touched.nama && form.errors.nama && <span className={styles.errorMsg}>{form.errors.nama}</span>}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="mata_pelajaran">Mata Pelajaran <span className={styles.required}>*</span></label>
        <input id="mata_pelajaran" className={styles.input} type="text" {...form.field('mata_pelajaran')} />
        {form.touched.mata_pelajaran && form.errors.mata_pelajaran && (
          <span className={styles.errorMsg}>{form.errors.mata_pelajaran}</span>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="status">Status <span className={styles.required}>*</span></label>
        <select id="status" className={styles.input} {...form.field('status')}>
          <option value="">Pilih status...</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {form.touched.status && form.errors.status && <span className={styles.errorMsg}>{form.errors.status}</span>}
      </div>

      <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
        <label className={styles.label} htmlFor="alamat">Alamat</label>
        <textarea id="alamat" className={styles.textarea} rows={3} {...form.field('alamat')} />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="foto">URL Foto</label>
        <input id="foto" className={styles.input} type="url" placeholder="https://..." {...form.field('foto')} />
      </div>
    </div>
  )

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Guru' : 'Tambah Guru'}
      onBack={() => navigate(-1)}
      onCancel={() => navigate(-1)}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      serverError={serverError}
      tabs={[{ id: 'form', label: 'Data Guru', content: formContent }]}
    />
  )
}
```

- [ ] Create `src/pages/sekolah/guru/GuruFormPage.module.css` — copy same CSS structure as `SiswaFormPage.module.css` (identical, no shared file to keep modules isolated).

---

## Step 22 — Route Stubs for Guru (add to routes.sekolah.tsx)

**File:** `src/app/routes.sekolah.tsx`

- [ ] Add lazy imports at top:

```tsx
const GuruListPage   = lazy(() => import('@/pages/sekolah/guru/GuruListPage'))
const GuruDetailPage = lazy(() => import('@/pages/sekolah/guru/GuruDetailPage'))
const GuruFormPage   = lazy(() => import('@/pages/sekolah/guru/GuruFormPage'))
```

- [ ] Add route entries inside the `/sekolah` route children:

```tsx
// Guru routes
{ path: 'guru',         element: <S><GuruListPage /></S> },
{ path: 'guru/new',     element: <S><GuruFormPage /></S> },
{ path: 'guru/:id',     element: <S><GuruDetailPage /></S> },
{ path: 'guru/:id/edit', element: <S><GuruFormPage /></S> },
```

---

## Step 23 — AppSubNav Config Update

**File:** `src/layouts/AppSubNav/subnav.config.ts`

- [ ] Ensure the `SUBNAV_CONFIG.sekolah.siswa` and `SUBNAV_CONFIG.sekolah.guru` entries are complete:

```ts
export const SUBNAV_CONFIG = {
  sekolah: {
    siswa: [
      { key: 'siswa',        label: 'Daftar Siswa',       path: '/sekolah/siswa' },
      { key: 'pendaftaran',  label: 'Pendaftaran Siswa',   path: '/sekolah/siswa/pendaftaran' },
      { key: 'rombel',       label: 'Rombongan Belajar',   path: '/sekolah/siswa/rombel' },
    ],
    guru: [
      { key: 'guru',         label: 'Daftar Guru',         path: '/sekolah/guru' },
      { key: 'penugasan',    label: 'Penugasan Guru',      path: '/sekolah/guru/penugasan' },
      { key: 'berkas',       label: 'Berkas Guru',         path: '/sekolah/guru/berkas' },
    ],
    // ... other Nav1 keys
  },
}
```

> Note: `/sekolah/guru/penugasan` and `/sekolah/guru/berkas` are stub routes — implement in a later phase. Their list pages are accessible from the Guru Detail tab in Phase 2.

---

## Verification Checklist

After implementing all steps, verify the following:

- [ ] `src/types/sekolah/siswa.types.ts` — exports `Siswa`, `WaliSiswa`, `AnggotaRombel`, `MutasiSiswa`, `KelulusanSiswa`, `SiswaFormValues`
- [ ] `src/types/sekolah/guru.types.ts` — exports `Guru`, `PenugasanGuru`, `BerkasGuru`, `GuruFormValues`
- [ ] `src/services/sekolah/siswa.service.ts` — exports `siswaService` with `list`, `getById`, `create`, `update`, `delete`, `getWali`, `getRombel`, `getMutasi`, `getKelulusan`
- [ ] `src/services/sekolah/guru.service.ts` — exports `guruService` with `list`, `getById`, `create`, `update`, `delete`, `getPenugasan`, `getBerkas`
- [ ] `SiswaListPage` renders `ListPageTemplate` with 4 columns, row click navigates to detail
- [ ] `SiswaDetailPage` renders `DetailPageTemplate` with exactly 6 tabs (Info, Wali, Rombel, Absensi, Nilai, Mutasi) + auto Koneksi tab from template
- [ ] `SiswaFormPage` handles both create and edit, `isEdit` detected from `useParams`
- [ ] `GuruListPage` renders `ListPageTemplate` with 4 columns
- [ ] `GuruDetailPage` renders `DetailPageTemplate` with exactly 4 tabs (Info, Penugasan, Absensi, Berkas)
- [ ] `GuruFormPage` handles both create and edit
- [ ] Stub pages for `PendaftaranSiswaListPage` and `RombelListPage` exist and don't throw
- [ ] `routes.sekolah.tsx` registers all 6 siswa routes + 4 guru routes
- [ ] `subnav.config.ts` siswa and guru entries are complete
- [ ] TypeScript strict mode: no implicit `any`, no missing type annotations
- [ ] No function longer than 40 lines (tab components should stay under 40 lines each)
- [ ] All queryKeys are unique and descriptive: `'sekolah-siswa'`, `'siswa'`, `'siswa-wali'`, `'siswa-rombel'`, `'siswa-absensi'`, `'siswa-nilai'`, `'siswa-mutasi'`, `'siswa-kelulusan'`, `'sekolah-guru'`, `'guru'`, `'guru-penugasan'`, `'guru-absensi'`, `'guru-berkas'`

---

## File Summary

| File | Type | Step |
|------|------|------|
| `src/types/sekolah/siswa.types.ts` | New | 1 |
| `src/services/sekolah/siswa.service.ts` | New | 2 |
| `src/pages/sekolah/siswa/SiswaListPage.tsx` | New | 3 |
| `src/pages/sekolah/siswa/tabs/SiswaInfoTab.tsx` | New | 4 |
| `src/pages/sekolah/siswa/tabs/SiswaTab.module.css` | New | 4–9 |
| `src/pages/sekolah/siswa/tabs/SiswaWaliTab.tsx` | New | 5 |
| `src/pages/sekolah/siswa/tabs/SiswaRombelTab.tsx` | New | 6 |
| `src/pages/sekolah/siswa/tabs/SiswaAbsensiTab.tsx` | New | 7 |
| `src/pages/sekolah/siswa/tabs/SiswaNilaiTab.tsx` | New | 8 |
| `src/pages/sekolah/siswa/tabs/SiswaMutasiTab.tsx` | New | 9 |
| `src/pages/sekolah/siswa/SiswaDetailPage.tsx` | New | 10 |
| `src/pages/sekolah/siswa/SiswaFormPage.tsx` | New | 11 |
| `src/pages/sekolah/siswa/SiswaFormPage.module.css` | New | 11 |
| `src/pages/sekolah/siswa/PendaftaranSiswaListPage.tsx` | New (stub) | 12 |
| `src/pages/sekolah/siswa/RombelListPage.tsx` | New (stub) | 12 |
| `src/types/sekolah/guru.types.ts` | New | 13 |
| `src/services/sekolah/guru.service.ts` | New | 14 |
| `src/pages/sekolah/guru/GuruListPage.tsx` | New | 15 |
| `src/pages/sekolah/guru/tabs/GuruInfoTab.tsx` | New | 16 |
| `src/pages/sekolah/guru/tabs/GuruTab.module.css` | New | 16–19 |
| `src/pages/sekolah/guru/tabs/GuruPenugasanTab.tsx` | New | 17 |
| `src/pages/sekolah/guru/tabs/GuruAbsensiTab.tsx` | New | 18 |
| `src/pages/sekolah/guru/tabs/GuruBerkasTab.tsx` | New | 19 |
| `src/pages/sekolah/guru/GuruDetailPage.tsx` | New | 20 |
| `src/pages/sekolah/guru/GuruFormPage.tsx` | New | 21 |
| `src/pages/sekolah/guru/GuruFormPage.module.css` | New | 21 |
| `src/app/routes.sekolah.tsx` | Edit | 12, 22 |
| `src/layouts/AppSubNav/subnav.config.ts` | Edit | 23 |

**Total: 23 new files, 2 edits. Zero shared CSS between Siswa and Guru modules (module isolation).**
