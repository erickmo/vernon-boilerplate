# Sekolah — Akademik Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all Akademik module pages for the Sekolah dashboard — 7 entity groups covering types, services, list/form/detail pages, route registration, and the Laporan Dinas export page.

**Architecture:** Each entity gets its own typed interface in `src/types/sekolah/akademik.types.ts`, a service created with `createEntityService` in `src/services/sekolah/akademik.service.ts`, and page components under `src/pages/sekolah/akademik/`. List+Form entities use `ListPageTemplate`+`FormPageTemplate`; Simple Detail entities add `DetailPageTemplate` with tabs. Laporan Dinas is a standalone filter-form + three export buttons — no CRUD template.

**Tech Stack:** React 18, TypeScript (strict), TanStack Query v5, React Router 6, CSS Modules, Lucide React icons

**Prerequisite:** infra-plan complete (routes.sekolah.tsx exists, AppShell context="sekolah" route block registered, AppSubNav rendered). siswa-guru-plan complete (for `RombelRef` type reference used in Absensi Siswa filter).

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/types/sekolah/akademik.types.ts` | All Akademik interfaces: MataPelajaran, JadwalPelajaran, SlotJadwal, AbsensiHarian, DetailAbsensiHarian, AbsensiGuru, DetailAbsensiGuru, EntriNilai, Raport, RaportMapel |
| `src/services/sekolah/akademik.service.ts` | `createEntityService` instances for each doctype + laporan export helpers |
| `src/pages/sekolah/akademik/MataPelajaranListPage.tsx` | List: Nama, Kode, Kurikulum columns; onRowClick → edit |
| `src/pages/sekolah/akademik/MataPelajaranFormPage.tsx` | Form: nama, kode, kurikulum fields |
| `src/pages/sekolah/akademik/JadwalListPage.tsx` | List: Rombel, Tahun Ajaran, Jumlah Slot |
| `src/pages/sekolah/akademik/JadwalDetailPage.tsx` | Simple Detail 3 tabs: Info Jadwal, Slot Jadwal, Override |
| `src/pages/sekolah/akademik/JadwalFormPage.tsx` | Form: rombel, tahun_ajaran, semester |
| `src/pages/sekolah/akademik/AbsensiSiswaListPage.tsx` | List with rombel+tanggal filterDefs |
| `src/pages/sekolah/akademik/AbsensiSiswaFormPage.tsx` | Form: input absensi per siswa in rombel |
| `src/pages/sekolah/akademik/AbsensiGuruListPage.tsx` | List: Tanggal, Jumlah Guru, Keterangan |
| `src/pages/sekolah/akademik/AbsensiGuruFormPage.tsx` | Form: tanggal + detail per guru rows |
| `src/pages/sekolah/akademik/PenilaianListPage.tsx` | List: Mapel, Rombel, Komponen, Semester |
| `src/pages/sekolah/akademik/PenilaianFormPage.tsx` | Form: mapel, rombel, komponen, nilai per siswa |
| `src/pages/sekolah/akademik/RaportListPage.tsx` | List: Siswa, Rombel, Semester, Status |
| `src/pages/sekolah/akademik/RaportDetailPage.tsx` | Simple Detail 2 tabs: Info Raport, Nilai per Mapel |
| `src/pages/sekolah/akademik/LaporanDinasPage.tsx` | Filter form (report_name, filters) + 3 export buttons (XLSX, PDF, JSON) |
| `src/app/routes.sekolah.tsx` (modify) | Register all 15 akademik routes under /sekolah/akademik/* |

---

## Task 1: Types

**Files:**
- Create: `src/types/sekolah/akademik.types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// src/types/sekolah/akademik.types.ts
import type { BaseEntity } from '@/types/entity.types'

// ─── Master Data ─────────────────────────────────────────────────────────────

export interface MataPelajaran extends BaseEntity {
  nama: string
  kode: string
  kurikulum: string
}

export interface JadwalPelajaran extends BaseEntity {
  rombel: string
  rombel_nama: string
  tahun_ajaran: string
  semester: string
  jumlah_slot: number
}

export interface SlotJadwal extends BaseEntity {
  jadwal_pelajaran: string
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'
  jam_mulai: string   // "HH:MM"
  jam_selesai: string // "HH:MM"
  mata_pelajaran: string
  mata_pelajaran_nama: string
  guru: string
  guru_nama: string
  ruangan?: string
}

export interface JadwalOverride extends BaseEntity {
  jadwal_pelajaran: string
  tanggal: string  // "YYYY-MM-DD"
  keterangan: string
  slots: SlotJadwal[]
}

// ─── Absensi Siswa ───────────────────────────────────────────────────────────

export type StatusAbsensiSiswa = 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' | 'Terlambat'

export interface DetailAbsensiHarian extends BaseEntity {
  absensi_harian: string
  siswa: string
  siswa_nama: string
  nis: string
  status: StatusAbsensiSiswa
  keterangan?: string
}

export interface AbsensiHarian extends BaseEntity {
  rombel: string
  rombel_nama: string
  tanggal: string        // "YYYY-MM-DD"
  tahun_ajaran: string
  semester: string
  jumlah_hadir: number
  jumlah_sakit: number
  jumlah_izin: number
  jumlah_alpha: number
  detail: DetailAbsensiHarian[]
}

// ─── Absensi Guru ────────────────────────────────────────────────────────────

export type StatusAbsensiGuru = 'Hadir' | 'Sakit' | 'Izin' | 'Alpha' | 'Dinas Luar'

export interface DetailAbsensiGuru extends BaseEntity {
  absensi_guru: string
  guru: string
  guru_nama: string
  nip: string
  status: StatusAbsensiGuru
  keterangan?: string
}

export interface AbsensiGuru extends BaseEntity {
  tanggal: string  // "YYYY-MM-DD"
  tahun_ajaran: string
  jumlah_guru: number
  jumlah_hadir: number
  keterangan?: string
  detail: DetailAbsensiGuru[]
}

// ─── Penilaian ───────────────────────────────────────────────────────────────

export interface EntriNilai extends BaseEntity {
  mata_pelajaran: string
  mata_pelajaran_nama: string
  rombel: string
  rombel_nama: string
  komponen: string          // e.g. "UH1", "UTS", "UAS"
  semester: string
  tahun_ajaran: string
  guru: string
  guru_nama: string
  jumlah_siswa: number
}

// ─── Raport ──────────────────────────────────────────────────────────────────

export type StatusRaport = 'Draft' | 'Final' | 'Diterbitkan'

export interface RaportMapel extends BaseEntity {
  raport: string
  mata_pelajaran: string
  mata_pelajaran_nama: string
  nilai_akhir: number
  predikat: 'A' | 'B' | 'C' | 'D'
  kkm: number
  catatan?: string
}

export interface Raport extends BaseEntity {
  siswa: string
  siswa_nama: string
  nis: string
  rombel: string
  rombel_nama: string
  semester: string
  tahun_ajaran: string
  status: StatusRaport
  rata_rata: number
  mapel: RaportMapel[]
}

// ─── Laporan Dinas ───────────────────────────────────────────────────────────

export type LaporanDinasReportName =
  | 'Rekap Absensi Siswa'
  | 'Rekap Absensi Guru'
  | 'Laporan TPG'

export interface LaporanDinasFilters {
  sekolah?: string
  tahun_ajaran?: string
  semester?: string
  rombel?: string
  bulan?: string   // "YYYY-MM" — required for Rekap Absensi Guru
}

export interface LaporanDinasForm {
  report_name: LaporanDinasReportName
  filters: LaporanDinasFilters
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx tsc --noEmit --strict 2>&1 | head -30
```

Expected: no errors mentioning `akademik.types.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/types/sekolah/akademik.types.ts
git commit -m "feat(akademik): add akademik domain types"
```

---

## Task 2: Services

**Files:**
- Create: `src/services/sekolah/akademik.service.ts`

- [ ] **Step 1: Create the services file**

```typescript
// src/services/sekolah/akademik.service.ts
import { createEntityService } from '@/services/createEntityService'
import { apiClient } from '@/services/api.client'
import type {
  MataPelajaran,
  JadwalPelajaran,
  AbsensiHarian,
  AbsensiGuru,
  EntriNilai,
  Raport,
  LaporanDinasReportName,
  LaporanDinasFilters,
} from '@/types/sekolah/akademik.types'

// ─── Frappe base path ─────────────────────────────────────────────────────────
// All paths below are relative to VITE_API_BASE_URL.
// Frappe REST: /api/resource/<Doctype Name>  (spaces → %20 handled by apiClient)

export const mataPelajaranService = createEntityService<MataPelajaran>(
  '/api/resource/Mata Pelajaran',
)

export const jadwalService = createEntityService<JadwalPelajaran>(
  '/api/resource/Jadwal Pelajaran',
)

export const absensiSiswaService = createEntityService<AbsensiHarian>(
  '/api/resource/Absensi Harian',
)

export const absensiGuruService = createEntityService<AbsensiGuru>(
  '/api/resource/Absensi Guru',
)

export const penilaianService = createEntityService<EntriNilai>(
  '/api/resource/Entri Nilai',
)

export const raportService = createEntityService<Raport>(
  '/api/resource/Raport',
)

// ─── Laporan Dinas export helpers ────────────────────────────────────────────

const LAPORAN_BASE = '/api/method/sekolahpro.akademik.api.laporan_dinas'

function buildLaporanParams(
  reportName: LaporanDinasReportName,
  filters: LaporanDinasFilters,
): string {
  return (
    `report_name=${encodeURIComponent(reportName)}` +
    `&filters=${encodeURIComponent(JSON.stringify(filters))}`
  )
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  return new Blob([bytes], { type: mimeType })
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const laporanDinasService = {
  exportXlsx: async (
    reportName: LaporanDinasReportName,
    filters: LaporanDinasFilters,
  ): Promise<void> => {
    const qs = buildLaporanParams(reportName, filters)
    const res = await apiClient.get<{ message: string }>(
      `${LAPORAN_BASE}.export_xlsx?${qs}`,
    )
    const blob = base64ToBlob(
      res.message,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    const safeReport = reportName.replace(/\s+/g, '_')
    triggerDownload(blob, `${safeReport}.xlsx`)
  },

  exportPdf: async (
    reportName: LaporanDinasReportName,
    filters: LaporanDinasFilters,
  ): Promise<void> => {
    const qs = buildLaporanParams(reportName, filters)
    const res = await apiClient.get<{ message: string }>(
      `${LAPORAN_BASE}.export_pdf?${qs}`,
    )
    const blob = base64ToBlob(res.message, 'application/pdf')
    const safeReport = reportName.replace(/\s+/g, '_')
    triggerDownload(blob, `${safeReport}.pdf`)
  },

  exportJson: async (
    reportName: LaporanDinasReportName,
    filters: LaporanDinasFilters,
  ): Promise<void> => {
    const qs = buildLaporanParams(reportName, filters) + '&format=json'
    const res = await apiClient.get<{ message: unknown }>(
      `${LAPORAN_BASE}.export_data?${qs}`,
    )
    const blob = new Blob([JSON.stringify(res.message, null, 2)], {
      type: 'application/json',
    })
    const safeReport = reportName.replace(/\s+/g, '_')
    triggerDownload(blob, `${safeReport}.json`)
  },
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx tsc --noEmit --strict 2>&1 | head -30
```

Expected: no errors mentioning `akademik.service.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/services/sekolah/akademik.service.ts
git commit -m "feat(akademik): add akademik entity services and laporan export helpers"
```

---

## Task 3: Mata Pelajaran List + Form

**Files:**
- Create: `src/pages/sekolah/akademik/MataPelajaranListPage.tsx`
- Create: `src/pages/sekolah/akademik/MataPelajaranFormPage.tsx`

- [ ] **Step 1: Create MataPelajaranListPage**

```tsx
// src/pages/sekolah/akademik/MataPelajaranListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { mataPelajaranService } from '@/services/sekolah/akademik.service'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { MataPelajaran } from '@/types/sekolah/akademik.types'

const COLUMNS: ColumnDef<MataPelajaran>[] = [
  { key: 'nama', label: 'Nama Mata Pelajaran', sortable: true },
  { key: 'kode', label: 'Kode', sortable: true },
  { key: 'kurikulum', label: 'Kurikulum', sortable: true },
]

export default function MataPelajaranListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<MataPelajaran>
      title="Mata Pelajaran"
      addLabel="Tambah Mata Pelajaran"
      onAdd={() => navigate('/sekolah/akademik/mata-pelajaran/new')}
      queryKey="mata-pelajaran"
      fetcher={mataPelajaranService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari mata pelajaran..."
      exportFilename="mata-pelajaran"
      onRowClick={(row) => navigate(`/sekolah/akademik/mata-pelajaran/${row.id}/edit`)}
      deleteConfig={{
        onDelete: (row) => mataPelajaranService.delete(row.id),
        dialogTitle: 'Hapus Mata Pelajaran?',
        dialogBody: (row) => (
          <>Mata pelajaran <strong>{row.nama}</strong> akan dihapus permanen.</>
        ),
        successMessage: (row) => `${row.nama} berhasil dihapus`,
        errorMessage: 'Gagal menghapus mata pelajaran',
      }}
    />
  )
}
```

- [ ] **Step 2: Create MataPelajaranFormPage**

```tsx
// src/pages/sekolah/akademik/MataPelajaranFormPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { mataPelajaranService } from '@/services/sekolah/akademik.service'
import { toast } from '@/widgets/Toast/Toast'
import type { MataPelajaran } from '@/types/sekolah/akademik.types'
import styles from './AkademikForm.module.css'

interface FormState {
  nama: string
  kode: string
  kurikulum: string
}

const EMPTY_FORM: FormState = { nama: '', kode: '', kurikulum: '' }

export default function MataPelajaranFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: existing } = useQuery<MataPelajaran>({
    queryKey: ['mata-pelajaran', id],
    queryFn: () => mataPelajaranService.getById(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      setForm({ nama: existing.nama, kode: existing.kode, kurikulum: existing.kurikulum })
    }
  }, [existing])

  const mutation = useMutation({
    mutationFn: (data: Partial<MataPelajaran>) =>
      isEdit
        ? mataPelajaranService.update(id!, data)
        : mataPelajaranService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['mata-pelajaran'] })
      toast.success(isEdit ? 'Mata pelajaran diperbarui' : 'Mata pelajaran ditambahkan')
      navigate('/sekolah/akademik/mata-pelajaran')
    },
    onError: (err) => {
      setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    mutation.mutate(form)
  }

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const formContent = (
    <div className={styles.fields}>
      <div className={styles.field}>
        <label className={styles.label}>Nama Mata Pelajaran <span className={styles.required}>*</span></label>
        <input
          className={styles.input}
          type="text"
          value={form.nama}
          onChange={(e) => handleChange('nama', e.target.value)}
          placeholder="e.g. Matematika"
          required
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Kode <span className={styles.required}>*</span></label>
        <input
          className={styles.input}
          type="text"
          value={form.kode}
          onChange={(e) => handleChange('kode', e.target.value)}
          placeholder="e.g. MTK"
          required
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Kurikulum</label>
        <input
          className={styles.input}
          type="text"
          value={form.kurikulum}
          onChange={(e) => handleChange('kurikulum', e.target.value)}
          placeholder="e.g. Merdeka"
        />
      </div>
    </div>
  )

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
      onBack={() => navigate('/sekolah/akademik/mata-pelajaran')}
      onCancel={() => navigate('/sekolah/akademik/mata-pelajaran')}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[{ id: 'form', label: 'Data Mata Pelajaran', content: formContent }]}
    />
  )
}
```

- [ ] **Step 3: Create shared CSS module for Akademik forms**

```css
/* src/pages/sekolah/akademik/AkademikForm.module.css */
.fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.required {
  color: var(--color-danger);
  margin-left: 2px;
}

.input,
.select,
.textarea {
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  color: var(--color-text);
  background: var(--color-surface);
  transition: border-color 0.15s;
}

.input:focus,
.select:focus,
.textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.textarea {
  height: auto;
  padding: 10px 12px;
  resize: vertical;
}

.select {
  appearance: none;
  cursor: pointer;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.tableWrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th {
  padding: 10px 12px;
  text-align: left;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--color-surface-alt);
  border-bottom: 1px solid var(--color-border);
}

.table td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.table tr:last-child td {
  border-bottom: none;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx tsc --noEmit --strict 2>&1 | grep -E "MataPelajaran|AkademikForm" | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/sekolah/akademik/MataPelajaranListPage.tsx \
        src/pages/sekolah/akademik/MataPelajaranFormPage.tsx \
        src/pages/sekolah/akademik/AkademikForm.module.css
git commit -m "feat(akademik): add MataPelajaran list and form pages"
```

---

## Task 4: Jadwal Pelajaran (List + Detail + Form)

**Files:**
- Create: `src/pages/sekolah/akademik/JadwalListPage.tsx`
- Create: `src/pages/sekolah/akademik/JadwalDetailPage.tsx`
- Create: `src/pages/sekolah/akademik/JadwalFormPage.tsx`

- [ ] **Step 1: Create JadwalListPage**

```tsx
// src/pages/sekolah/akademik/JadwalListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { jadwalService } from '@/services/sekolah/akademik.service'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { JadwalPelajaran } from '@/types/sekolah/akademik.types'

const COLUMNS: ColumnDef<JadwalPelajaran>[] = [
  { key: 'rombel_nama', label: 'Rombongan Belajar', sortable: true },
  { key: 'tahun_ajaran', label: 'Tahun Ajaran', sortable: true },
  { key: 'semester', label: 'Semester', sortable: true },
  { key: 'jumlah_slot', label: 'Jumlah Slot', sortable: true },
]

export default function JadwalListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<JadwalPelajaran>
      title="Jadwal Pelajaran"
      addLabel="Tambah Jadwal"
      onAdd={() => navigate('/sekolah/akademik/jadwal/new')}
      queryKey="jadwal-pelajaran"
      fetcher={jadwalService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari jadwal..."
      exportFilename="jadwal-pelajaran"
      onRowClick={(row) => navigate(`/sekolah/akademik/jadwal/${row.id}`)}
      deleteConfig={{
        onDelete: (row) => jadwalService.delete(row.id),
        dialogTitle: 'Hapus Jadwal Pelajaran?',
        dialogBody: (row) => (
          <>Jadwal untuk rombel <strong>{row.rombel_nama}</strong> akan dihapus permanen.</>
        ),
        successMessage: (row) => `Jadwal ${row.rombel_nama} berhasil dihapus`,
        errorMessage: 'Gagal menghapus jadwal',
      }}
    />
  )
}
```

- [ ] **Step 2: Create JadwalDetailPage**

```tsx
// src/pages/sekolah/akademik/JadwalDetailPage.tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit, Trash2 } from 'lucide-react'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { jadwalService } from '@/services/sekolah/akademik.service'
import { toast } from '@/widgets/Toast/Toast'
import type { JadwalPelajaran, SlotJadwal } from '@/types/sekolah/akademik.types'
import styles from './AkademikForm.module.css'

// ─── Slot Jadwal tab ─────────────────────────────────────────────────────────

function SlotJadwalTab({ slots }: { slots: SlotJadwal[] }) {
  const HARI_ORDER = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const sorted = [...slots].sort(
    (a, b) => HARI_ORDER.indexOf(a.hari) - HARI_ORDER.indexOf(b.hari),
  )

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Hari</th>
            <th>Jam</th>
            <th>Mata Pelajaran</th>
            <th>Guru</th>
            <th>Ruangan</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Belum ada slot jadwal
              </td>
            </tr>
          )}
          {sorted.map((slot) => (
            <tr key={slot.id}>
              <td>{slot.hari}</td>
              <td>{slot.jam_mulai} – {slot.jam_selesai}</td>
              <td>{slot.mata_pelajaran_nama}</td>
              <td>{slot.guru_nama}</td>
              <td>{slot.ruangan ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Info tab ────────────────────────────────────────────────────────────────

function InfoJadwalTab({ jadwal }: { jadwal: JadwalPelajaran }) {
  return (
    <div className={styles.fields}>
      <div className={styles.row}>
        <div className={styles.field}>
          <span className={styles.label}>Rombongan Belajar</span>
          <strong>{jadwal.rombel_nama}</strong>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Tahun Ajaran</span>
          <strong>{jadwal.tahun_ajaran}</strong>
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <span className={styles.label}>Semester</span>
          <strong>{jadwal.semester}</strong>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Jumlah Slot</span>
          <strong>{jadwal.jumlah_slot}</strong>
        </div>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function JadwalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: jadwal, isLoading, error } = useQuery<JadwalPelajaran>({
    queryKey: ['jadwal-pelajaran', id],
    queryFn: () => jadwalService.getById(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => jadwalService.delete(id!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['jadwal-pelajaran'] })
      toast.success('Jadwal berhasil dihapus')
      navigate('/sekolah/akademik/jadwal')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus jadwal')
    },
  })

  if (isLoading) return <div style={{ padding: 32 }}>Memuat...</div>
  if (error || !jadwal) return <div style={{ padding: 32 }}>Data tidak ditemukan</div>

  return (
    <DetailPageTemplate
      title={`Jadwal — ${jadwal.rombel_nama}`}
      code={`${jadwal.tahun_ajaran} / ${jadwal.semester}`}
      onBack={() => navigate('/sekolah/akademik/jadwal')}
      tabs={[
        {
          id: 'info',
          label: 'Info Jadwal',
          content: <InfoJadwalTab jadwal={jadwal} />,
        },
        {
          id: 'slot',
          label: 'Slot Jadwal',
          content: <SlotJadwalTab slots={(jadwal as JadwalPelajaran & { slot_jadwal?: SlotJadwal[] }).slot_jadwal ?? []} />,
        },
        {
          id: 'override',
          label: 'Override',
          content: (
            <div style={{ padding: 24, color: 'var(--color-text-muted)' }}>
              Belum ada jadwal override untuk periode ini.
            </div>
          ),
        },
      ]}
      actions={[
        {
          label: 'Edit',
          icon: <Edit size={14} />,
          onClick: () => navigate(`/sekolah/akademik/jadwal/${id}/edit`),
          variant: 'primary',
        },
        {
          label: 'Hapus',
          icon: <Trash2 size={14} />,
          onClick: () => deleteMutation.mutate(),
          variant: 'danger',
        },
      ]}
    />
  )
}
```

- [ ] **Step 3: Create JadwalFormPage**

```tsx
// src/pages/sekolah/akademik/JadwalFormPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { jadwalService } from '@/services/sekolah/akademik.service'
import { toast } from '@/widgets/Toast/Toast'
import type { JadwalPelajaran } from '@/types/sekolah/akademik.types'
import styles from './AkademikForm.module.css'

interface FormState {
  rombel: string
  rombel_nama: string
  tahun_ajaran: string
  semester: string
}

const EMPTY_FORM: FormState = {
  rombel: '',
  rombel_nama: '',
  tahun_ajaran: '',
  semester: '',
}

const SEMESTER_OPTIONS = ['Ganjil', 'Genap']

export default function JadwalFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: existing } = useQuery<JadwalPelajaran>({
    queryKey: ['jadwal-pelajaran', id],
    queryFn: () => jadwalService.getById(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      setForm({
        rombel: existing.rombel,
        rombel_nama: existing.rombel_nama,
        tahun_ajaran: existing.tahun_ajaran,
        semester: existing.semester,
      })
    }
  }, [existing])

  const mutation = useMutation({
    mutationFn: (data: Partial<JadwalPelajaran>) =>
      isEdit ? jadwalService.update(id!, data) : jadwalService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['jadwal-pelajaran'] })
      toast.success(isEdit ? 'Jadwal diperbarui' : 'Jadwal ditambahkan')
      navigate('/sekolah/akademik/jadwal')
    },
    onError: (err) => setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    mutation.mutate(form)
  }

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const formContent = (
    <div className={styles.fields}>
      <div className={styles.field}>
        <label className={styles.label}>Rombongan Belajar <span className={styles.required}>*</span></label>
        <input
          className={styles.input}
          type="text"
          value={form.rombel}
          onChange={(e) => handleChange('rombel', e.target.value)}
          placeholder="ID Rombel"
          required
        />
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Tahun Ajaran <span className={styles.required}>*</span></label>
          <input
            className={styles.input}
            type="text"
            value={form.tahun_ajaran}
            onChange={(e) => handleChange('tahun_ajaran', e.target.value)}
            placeholder="e.g. 2024/2025"
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Semester <span className={styles.required}>*</span></label>
          <select
            className={styles.select}
            value={form.semester}
            onChange={(e) => handleChange('semester', e.target.value)}
            required
          >
            <option value="">Pilih Semester</option>
            {SEMESTER_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Jadwal Pelajaran' : 'Tambah Jadwal Pelajaran'}
      onBack={() => navigate('/sekolah/akademik/jadwal')}
      onCancel={() => navigate('/sekolah/akademik/jadwal')}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[{ id: 'form', label: 'Info Jadwal', content: formContent }]}
    />
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx tsc --noEmit --strict 2>&1 | grep -E "Jadwal" | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/sekolah/akademik/JadwalListPage.tsx \
        src/pages/sekolah/akademik/JadwalDetailPage.tsx \
        src/pages/sekolah/akademik/JadwalFormPage.tsx
git commit -m "feat(akademik): add Jadwal Pelajaran list, detail, and form pages"
```

---

## Task 5: Absensi Siswa (List + Form)

**Files:**
- Create: `src/pages/sekolah/akademik/AbsensiSiswaListPage.tsx`
- Create: `src/pages/sekolah/akademik/AbsensiSiswaFormPage.tsx`

- [ ] **Step 1: Create AbsensiSiswaListPage**

```tsx
// src/pages/sekolah/akademik/AbsensiSiswaListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { absensiSiswaService } from '@/services/sekolah/akademik.service'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { AbsensiHarian } from '@/types/sekolah/akademik.types'

const COLUMNS: ColumnDef<AbsensiHarian>[] = [
  { key: 'tanggal', label: 'Tanggal', sortable: true },
  { key: 'rombel_nama', label: 'Rombongan Belajar', sortable: true },
  { key: 'tahun_ajaran', label: 'Tahun Ajaran', sortable: true },
  { key: 'semester', label: 'Semester', sortable: true },
  { key: 'jumlah_hadir', label: 'Hadir', sortable: true },
  { key: 'jumlah_sakit', label: 'Sakit', sortable: true },
  { key: 'jumlah_izin', label: 'Izin', sortable: true },
  { key: 'jumlah_alpha', label: 'Alpha', sortable: true },
]

const FILTER_DEFS: FilterDef[] = [
  { key: 'rombel', label: 'Rombongan Belajar', type: 'text' },
  { key: 'tanggal', label: 'Tanggal', type: 'date' },
  { key: 'semester', label: 'Semester', type: 'select', options: [
    { value: 'Ganjil', label: 'Ganjil' },
    { value: 'Genap', label: 'Genap' },
  ]},
]

export default function AbsensiSiswaListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<AbsensiHarian>
      title="Absensi Siswa"
      addLabel="Input Absensi"
      onAdd={() => navigate('/sekolah/akademik/absensi-siswa/new')}
      queryKey="absensi-siswa"
      fetcher={absensiSiswaService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari absensi..."
      exportFilename="absensi-siswa"
      filterDefs={FILTER_DEFS}
      defaultSort={{ key: 'tanggal', order: 'desc' }}
      onRowClick={(row) => navigate(`/sekolah/akademik/absensi-siswa/${row.id}/edit`)}
      deleteConfig={{
        onDelete: (row) => absensiSiswaService.delete(row.id),
        dialogTitle: 'Hapus Absensi?',
        dialogBody: (row) => (
          <>Absensi tanggal <strong>{row.tanggal}</strong> rombel <strong>{row.rombel_nama}</strong> akan dihapus.</>
        ),
        successMessage: (row) => `Absensi ${row.tanggal} berhasil dihapus`,
        errorMessage: 'Gagal menghapus absensi',
      }}
    />
  )
}
```

- [ ] **Step 2: Create AbsensiSiswaFormPage**

```tsx
// src/pages/sekolah/akademik/AbsensiSiswaFormPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { absensiSiswaService } from '@/services/sekolah/akademik.service'
import { toast } from '@/widgets/Toast/Toast'
import type {
  AbsensiHarian,
  DetailAbsensiHarian,
  StatusAbsensiSiswa,
} from '@/types/sekolah/akademik.types'
import styles from './AkademikForm.module.css'

const STATUS_OPTIONS: StatusAbsensiSiswa[] = ['Hadir', 'Sakit', 'Izin', 'Alpha', 'Terlambat']

interface FormState {
  rombel: string
  tanggal: string
  tahun_ajaran: string
  semester: string
  detail: Array<{
    siswa: string
    siswa_nama: string
    nis: string
    status: StatusAbsensiSiswa
    keterangan: string
  }>
}

const EMPTY_FORM: FormState = {
  rombel: '',
  tanggal: new Date().toISOString().split('T')[0],
  tahun_ajaran: '',
  semester: '',
  detail: [],
}

export default function AbsensiSiswaFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: existing } = useQuery<AbsensiHarian>({
    queryKey: ['absensi-siswa', id],
    queryFn: () => absensiSiswaService.getById(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      setForm({
        rombel: existing.rombel,
        tanggal: existing.tanggal,
        tahun_ajaran: existing.tahun_ajaran,
        semester: existing.semester,
        detail: existing.detail.map((d) => ({
          siswa: d.siswa,
          siswa_nama: d.siswa_nama,
          nis: d.nis,
          status: d.status,
          keterangan: d.keterangan ?? '',
        })),
      })
    }
  }, [existing])

  function handleDetailStatusChange(index: number, status: StatusAbsensiSiswa) {
    setForm((prev) => {
      const detail = [...prev.detail]
      detail[index] = { ...detail[index], status }
      return { ...prev, detail }
    })
  }

  function handleDetailKeteranganChange(index: number, keterangan: string) {
    setForm((prev) => {
      const detail = [...prev.detail]
      detail[index] = { ...detail[index], keterangan }
      return { ...prev, detail }
    })
  }

  const mutation = useMutation({
    mutationFn: (data: Partial<AbsensiHarian>) =>
      isEdit ? absensiSiswaService.update(id!, data) : absensiSiswaService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['absensi-siswa'] })
      toast.success(isEdit ? 'Absensi diperbarui' : 'Absensi disimpan')
      navigate('/sekolah/akademik/absensi-siswa')
    },
    onError: (err) => setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    mutation.mutate(form as unknown as Partial<AbsensiHarian>)
  }

  const headerContent = (
    <div className={styles.fields}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Rombongan Belajar <span className={styles.required}>*</span></label>
          <input
            className={styles.input}
            type="text"
            value={form.rombel}
            onChange={(e) => setForm((p) => ({ ...p, rombel: e.target.value }))}
            placeholder="ID Rombel"
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Tanggal <span className={styles.required}>*</span></label>
          <input
            className={styles.input}
            type="date"
            value={form.tanggal}
            onChange={(e) => setForm((p) => ({ ...p, tanggal: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Tahun Ajaran</label>
          <input
            className={styles.input}
            type="text"
            value={form.tahun_ajaran}
            onChange={(e) => setForm((p) => ({ ...p, tahun_ajaran: e.target.value }))}
            placeholder="e.g. 2024/2025"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Semester</label>
          <select
            className={styles.select}
            value={form.semester}
            onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))}
          >
            <option value="">Pilih Semester</option>
            <option value="Ganjil">Ganjil</option>
            <option value="Genap">Genap</option>
          </select>
        </div>
      </div>
    </div>
  )

  const detailContent = (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>NIS</th>
            <th>Nama Siswa</th>
            <th>Status</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {form.detail.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 24 }}>
                Pilih rombel terlebih dahulu untuk memuat daftar siswa
              </td>
            </tr>
          )}
          {form.detail.map((d, i) => (
            <tr key={d.siswa}>
              <td>{d.nis}</td>
              <td>{d.siswa_nama}</td>
              <td>
                <select
                  className={styles.select}
                  value={d.status}
                  onChange={(e) => handleDetailStatusChange(i, e.target.value as StatusAbsensiSiswa)}
                  style={{ minWidth: 120 }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  className={styles.input}
                  type="text"
                  value={d.keterangan}
                  onChange={(e) => handleDetailKeteranganChange(i, e.target.value)}
                  placeholder="Opsional"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Absensi Siswa' : 'Input Absensi Siswa'}
      onBack={() => navigate('/sekolah/akademik/absensi-siswa')}
      onCancel={() => navigate('/sekolah/akademik/absensi-siswa')}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[
        { id: 'header', label: 'Info Absensi', content: headerContent },
        { id: 'detail', label: 'Daftar Siswa', content: detailContent },
      ]}
    />
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx tsc --noEmit --strict 2>&1 | grep -E "AbsensiSiswa" | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/sekolah/akademik/AbsensiSiswaListPage.tsx \
        src/pages/sekolah/akademik/AbsensiSiswaFormPage.tsx
git commit -m "feat(akademik): add Absensi Siswa list and form pages"
```

---

## Task 6: Absensi Guru (List + Form)

**Files:**
- Create: `src/pages/sekolah/akademik/AbsensiGuruListPage.tsx`
- Create: `src/pages/sekolah/akademik/AbsensiGuruFormPage.tsx`

- [ ] **Step 1: Create AbsensiGuruListPage**

```tsx
// src/pages/sekolah/akademik/AbsensiGuruListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { absensiGuruService } from '@/services/sekolah/akademik.service'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { AbsensiGuru } from '@/types/sekolah/akademik.types'

const COLUMNS: ColumnDef<AbsensiGuru>[] = [
  { key: 'tanggal', label: 'Tanggal', sortable: true },
  { key: 'tahun_ajaran', label: 'Tahun Ajaran', sortable: true },
  { key: 'jumlah_guru', label: 'Jumlah Guru', sortable: true },
  { key: 'jumlah_hadir', label: 'Hadir', sortable: true },
  { key: 'keterangan', label: 'Keterangan' },
]

const FILTER_DEFS: FilterDef[] = [
  { key: 'tanggal', label: 'Tanggal', type: 'date' },
  { key: 'tahun_ajaran', label: 'Tahun Ajaran', type: 'text' },
]

export default function AbsensiGuruListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<AbsensiGuru>
      title="Absensi Guru"
      addLabel="Input Absensi Guru"
      onAdd={() => navigate('/sekolah/akademik/absensi-guru/new')}
      queryKey="absensi-guru"
      fetcher={absensiGuruService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari absensi guru..."
      exportFilename="absensi-guru"
      filterDefs={FILTER_DEFS}
      defaultSort={{ key: 'tanggal', order: 'desc' }}
      onRowClick={(row) => navigate(`/sekolah/akademik/absensi-guru/${row.id}/edit`)}
      deleteConfig={{
        onDelete: (row) => absensiGuruService.delete(row.id),
        dialogTitle: 'Hapus Absensi Guru?',
        dialogBody: (row) => (
          <>Absensi guru tanggal <strong>{row.tanggal}</strong> akan dihapus permanen.</>
        ),
        successMessage: (row) => `Absensi guru ${row.tanggal} berhasil dihapus`,
        errorMessage: 'Gagal menghapus absensi guru',
      }}
    />
  )
}
```

- [ ] **Step 2: Create AbsensiGuruFormPage**

```tsx
// src/pages/sekolah/akademik/AbsensiGuruFormPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { absensiGuruService } from '@/services/sekolah/akademik.service'
import { toast } from '@/widgets/Toast/Toast'
import type { AbsensiGuru, StatusAbsensiGuru } from '@/types/sekolah/akademik.types'
import styles from './AkademikForm.module.css'

const STATUS_OPTIONS: StatusAbsensiGuru[] = ['Hadir', 'Sakit', 'Izin', 'Alpha', 'Dinas Luar']

interface FormState {
  tanggal: string
  tahun_ajaran: string
  keterangan: string
  detail: Array<{
    guru: string
    guru_nama: string
    nip: string
    status: StatusAbsensiGuru
    keterangan: string
  }>
}

const EMPTY_FORM: FormState = {
  tanggal: new Date().toISOString().split('T')[0],
  tahun_ajaran: '',
  keterangan: '',
  detail: [],
}

export default function AbsensiGuruFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: existing } = useQuery<AbsensiGuru>({
    queryKey: ['absensi-guru', id],
    queryFn: () => absensiGuruService.getById(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      setForm({
        tanggal: existing.tanggal,
        tahun_ajaran: existing.tahun_ajaran,
        keterangan: existing.keterangan ?? '',
        detail: existing.detail.map((d) => ({
          guru: d.guru,
          guru_nama: d.guru_nama,
          nip: d.nip,
          status: d.status,
          keterangan: d.keterangan ?? '',
        })),
      })
    }
  }, [existing])

  function handleDetailStatusChange(index: number, status: StatusAbsensiGuru) {
    setForm((prev) => {
      const detail = [...prev.detail]
      detail[index] = { ...detail[index], status }
      return { ...prev, detail }
    })
  }

  function handleDetailKeteranganChange(index: number, keterangan: string) {
    setForm((prev) => {
      const detail = [...prev.detail]
      detail[index] = { ...detail[index], keterangan }
      return { ...prev, detail }
    })
  }

  const mutation = useMutation({
    mutationFn: (data: Partial<AbsensiGuru>) =>
      isEdit ? absensiGuruService.update(id!, data) : absensiGuruService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['absensi-guru'] })
      toast.success(isEdit ? 'Absensi guru diperbarui' : 'Absensi guru disimpan')
      navigate('/sekolah/akademik/absensi-guru')
    },
    onError: (err) => setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    mutation.mutate(form as unknown as Partial<AbsensiGuru>)
  }

  const headerContent = (
    <div className={styles.fields}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Tanggal <span className={styles.required}>*</span></label>
          <input
            className={styles.input}
            type="date"
            value={form.tanggal}
            onChange={(e) => setForm((p) => ({ ...p, tanggal: e.target.value }))}
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Tahun Ajaran</label>
          <input
            className={styles.input}
            type="text"
            value={form.tahun_ajaran}
            onChange={(e) => setForm((p) => ({ ...p, tahun_ajaran: e.target.value }))}
            placeholder="e.g. 2024/2025"
          />
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Keterangan</label>
        <textarea
          className={styles.textarea}
          value={form.keterangan}
          onChange={(e) => setForm((p) => ({ ...p, keterangan: e.target.value }))}
          rows={3}
          placeholder="Catatan tambahan (opsional)"
        />
      </div>
    </div>
  )

  const detailContent = (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>NIP</th>
            <th>Nama Guru</th>
            <th>Status</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {form.detail.length === 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 24 }}>
                Belum ada data guru. Simpan header dulu untuk memuat daftar guru.
              </td>
            </tr>
          )}
          {form.detail.map((d, i) => (
            <tr key={d.guru}>
              <td>{d.nip}</td>
              <td>{d.guru_nama}</td>
              <td>
                <select
                  className={styles.select}
                  value={d.status}
                  onChange={(e) => handleDetailStatusChange(i, e.target.value as StatusAbsensiGuru)}
                  style={{ minWidth: 130 }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </td>
              <td>
                <input
                  className={styles.input}
                  type="text"
                  value={d.keterangan}
                  onChange={(e) => handleDetailKeteranganChange(i, e.target.value)}
                  placeholder="Opsional"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Absensi Guru' : 'Input Absensi Guru'}
      onBack={() => navigate('/sekolah/akademik/absensi-guru')}
      onCancel={() => navigate('/sekolah/akademik/absensi-guru')}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[
        { id: 'header', label: 'Info Absensi', content: headerContent },
        { id: 'detail', label: 'Daftar Guru', content: detailContent },
      ]}
    />
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx tsc --noEmit --strict 2>&1 | grep -E "AbsensiGuru" | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/sekolah/akademik/AbsensiGuruListPage.tsx \
        src/pages/sekolah/akademik/AbsensiGuruFormPage.tsx
git commit -m "feat(akademik): add Absensi Guru list and form pages"
```

---

## Task 7: Penilaian — Entri Nilai (List + Form)

**Files:**
- Create: `src/pages/sekolah/akademik/PenilaianListPage.tsx`
- Create: `src/pages/sekolah/akademik/PenilaianFormPage.tsx`

- [ ] **Step 1: Create PenilaianListPage**

```tsx
// src/pages/sekolah/akademik/PenilaianListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { penilaianService } from '@/services/sekolah/akademik.service'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { EntriNilai } from '@/types/sekolah/akademik.types'

const COLUMNS: ColumnDef<EntriNilai>[] = [
  { key: 'mata_pelajaran_nama', label: 'Mata Pelajaran', sortable: true },
  { key: 'rombel_nama', label: 'Rombongan Belajar', sortable: true },
  { key: 'komponen', label: 'Komponen', sortable: true },
  { key: 'semester', label: 'Semester', sortable: true },
  { key: 'tahun_ajaran', label: 'Tahun Ajaran', sortable: true },
  { key: 'guru_nama', label: 'Guru', sortable: true },
  { key: 'jumlah_siswa', label: 'Jumlah Siswa', sortable: true },
]

const FILTER_DEFS: FilterDef[] = [
  { key: 'mata_pelajaran', label: 'Mata Pelajaran', type: 'text' },
  { key: 'rombel', label: 'Rombongan Belajar', type: 'text' },
  { key: 'semester', label: 'Semester', type: 'select', options: [
    { value: 'Ganjil', label: 'Ganjil' },
    { value: 'Genap', label: 'Genap' },
  ]},
]

export default function PenilaianListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<EntriNilai>
      title="Penilaian (Entri Nilai)"
      addLabel="Entri Nilai Baru"
      onAdd={() => navigate('/sekolah/akademik/penilaian/new')}
      queryKey="entri-nilai"
      fetcher={penilaianService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari entri nilai..."
      exportFilename="entri-nilai"
      filterDefs={FILTER_DEFS}
      onRowClick={(row) => navigate(`/sekolah/akademik/penilaian/${row.id}/edit`)}
      deleteConfig={{
        onDelete: (row) => penilaianService.delete(row.id),
        dialogTitle: 'Hapus Entri Nilai?',
        dialogBody: (row) => (
          <>Entri nilai <strong>{row.mata_pelajaran_nama}</strong> — <strong>{row.komponen}</strong> akan dihapus.</>
        ),
        successMessage: (row) => `Entri nilai ${row.komponen} berhasil dihapus`,
        errorMessage: 'Gagal menghapus entri nilai',
      }}
    />
  )
}
```

- [ ] **Step 2: Create PenilaianFormPage**

```tsx
// src/pages/sekolah/akademik/PenilaianFormPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { penilaianService } from '@/services/sekolah/akademik.service'
import { toast } from '@/widgets/Toast/Toast'
import type { EntriNilai } from '@/types/sekolah/akademik.types'
import styles from './AkademikForm.module.css'

const KOMPONEN_OPTIONS = ['UH1', 'UH2', 'UH3', 'UTS', 'UAS', 'Tugas', 'Praktik']
const SEMESTER_OPTIONS = ['Ganjil', 'Genap']

interface NilaiSiswa {
  siswa: string
  siswa_nama: string
  nis: string
  nilai: number | ''
}

interface FormState {
  mata_pelajaran: string
  rombel: string
  komponen: string
  semester: string
  tahun_ajaran: string
  guru: string
  nilai_siswa: NilaiSiswa[]
}

const EMPTY_FORM: FormState = {
  mata_pelajaran: '',
  rombel: '',
  komponen: '',
  semester: '',
  tahun_ajaran: '',
  guru: '',
  nilai_siswa: [],
}

export default function PenilaianFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: existing } = useQuery<EntriNilai>({
    queryKey: ['entri-nilai', id],
    queryFn: () => penilaianService.getById(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      setForm({
        mata_pelajaran: existing.mata_pelajaran,
        rombel: existing.rombel,
        komponen: existing.komponen,
        semester: existing.semester,
        tahun_ajaran: existing.tahun_ajaran,
        guru: existing.guru,
        nilai_siswa: [],
      })
    }
  }, [existing])

  function handleNilaiChange(index: number, nilai: string) {
    setForm((prev) => {
      const nilai_siswa = [...prev.nilai_siswa]
      nilai_siswa[index] = { ...nilai_siswa[index], nilai: nilai === '' ? '' : Number(nilai) }
      return { ...prev, nilai_siswa }
    })
  }

  const mutation = useMutation({
    mutationFn: (data: Partial<EntriNilai>) =>
      isEdit ? penilaianService.update(id!, data) : penilaianService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['entri-nilai'] })
      toast.success(isEdit ? 'Entri nilai diperbarui' : 'Entri nilai disimpan')
      navigate('/sekolah/akademik/penilaian')
    },
    onError: (err) => setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    mutation.mutate(form as unknown as Partial<EntriNilai>)
  }

  const headerContent = (
    <div className={styles.fields}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Mata Pelajaran <span className={styles.required}>*</span></label>
          <input
            className={styles.input}
            type="text"
            value={form.mata_pelajaran}
            onChange={(e) => setForm((p) => ({ ...p, mata_pelajaran: e.target.value }))}
            placeholder="ID Mata Pelajaran"
            required
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Rombongan Belajar <span className={styles.required}>*</span></label>
          <input
            className={styles.input}
            type="text"
            value={form.rombel}
            onChange={(e) => setForm((p) => ({ ...p, rombel: e.target.value }))}
            placeholder="ID Rombel"
            required
          />
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Komponen <span className={styles.required}>*</span></label>
          <select
            className={styles.select}
            value={form.komponen}
            onChange={(e) => setForm((p) => ({ ...p, komponen: e.target.value }))}
            required
          >
            <option value="">Pilih Komponen</option>
            {KOMPONEN_OPTIONS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Semester <span className={styles.required}>*</span></label>
          <select
            className={styles.select}
            value={form.semester}
            onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))}
            required
          >
            <option value="">Pilih Semester</option>
            {SEMESTER_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Tahun Ajaran</label>
          <input
            className={styles.input}
            type="text"
            value={form.tahun_ajaran}
            onChange={(e) => setForm((p) => ({ ...p, tahun_ajaran: e.target.value }))}
            placeholder="e.g. 2024/2025"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Guru Pengampu</label>
          <input
            className={styles.input}
            type="text"
            value={form.guru}
            onChange={(e) => setForm((p) => ({ ...p, guru: e.target.value }))}
            placeholder="ID Guru"
          />
        </div>
      </div>
    </div>
  )

  const nilaiContent = (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>NIS</th>
            <th>Nama Siswa</th>
            <th>Nilai (0–100)</th>
          </tr>
        </thead>
        <tbody>
          {form.nilai_siswa.length === 0 && (
            <tr>
              <td colSpan={3} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 24 }}>
                Pilih Mata Pelajaran dan Rombel untuk memuat daftar siswa
              </td>
            </tr>
          )}
          {form.nilai_siswa.map((s, i) => (
            <tr key={s.siswa}>
              <td>{s.nis}</td>
              <td>{s.siswa_nama}</td>
              <td>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  max={100}
                  value={s.nilai}
                  onChange={(e) => handleNilaiChange(i, e.target.value)}
                  placeholder="0–100"
                  style={{ width: 80 }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Entri Nilai' : 'Entri Nilai Baru'}
      onBack={() => navigate('/sekolah/akademik/penilaian')}
      onCancel={() => navigate('/sekolah/akademik/penilaian')}
      onSubmit={handleSubmit}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[
        { id: 'header', label: 'Info Penilaian', content: headerContent },
        { id: 'nilai', label: 'Nilai Siswa', content: nilaiContent },
      ]}
    />
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx tsc --noEmit --strict 2>&1 | grep -E "Penilaian" | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/sekolah/akademik/PenilaianListPage.tsx \
        src/pages/sekolah/akademik/PenilaianFormPage.tsx
git commit -m "feat(akademik): add Penilaian list and form pages"
```

---

## Task 8: Raport (List + Simple Detail)

**Files:**
- Create: `src/pages/sekolah/akademik/RaportListPage.tsx`
- Create: `src/pages/sekolah/akademik/RaportDetailPage.tsx`

- [ ] **Step 1: Create RaportListPage**

```tsx
// src/pages/sekolah/akademik/RaportListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { raportService } from '@/services/sekolah/akademik.service'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { Raport } from '@/types/sekolah/akademik.types'

const STATUS_LABEL: Record<string, string> = {
  Draft: 'Draft',
  Final: 'Final',
  Diterbitkan: 'Diterbitkan',
}

const COLUMNS: ColumnDef<Raport>[] = [
  { key: 'siswa_nama', label: 'Nama Siswa', sortable: true },
  { key: 'nis', label: 'NIS', sortable: true },
  { key: 'rombel_nama', label: 'Rombongan Belajar', sortable: true },
  { key: 'semester', label: 'Semester', sortable: true },
  { key: 'tahun_ajaran', label: 'Tahun Ajaran', sortable: true },
  { key: 'rata_rata', label: 'Rata-rata', sortable: true },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (row) => STATUS_LABEL[row.status] ?? row.status,
  },
]

const FILTER_DEFS: FilterDef[] = [
  { key: 'rombel', label: 'Rombongan Belajar', type: 'text' },
  { key: 'semester', label: 'Semester', type: 'select', options: [
    { value: 'Ganjil', label: 'Ganjil' },
    { value: 'Genap', label: 'Genap' },
  ]},
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: 'Draft', label: 'Draft' },
    { value: 'Final', label: 'Final' },
    { value: 'Diterbitkan', label: 'Diterbitkan' },
  ]},
]

export default function RaportListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<Raport>
      title="Raport"
      queryKey="raport"
      fetcher={raportService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari raport siswa..."
      exportFilename="raport"
      filterDefs={FILTER_DEFS}
      defaultSort={{ key: 'siswa_nama', order: 'asc' }}
      onRowClick={(row) => navigate(`/sekolah/akademik/raport/${row.id}`)}
    />
  )
}
```

- [ ] **Step 2: Create RaportDetailPage**

```tsx
// src/pages/sekolah/akademik/RaportDetailPage.tsx
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { raportService } from '@/services/sekolah/akademik.service'
import type { Raport, RaportMapel } from '@/types/sekolah/akademik.types'
import styles from './AkademikForm.module.css'

// ─── Info Raport tab ─────────────────────────────────────────────────────────

function InfoRaportTab({ raport }: { raport: Raport }) {
  return (
    <div className={styles.fields}>
      <div className={styles.row}>
        <div className={styles.field}>
          <span className={styles.label}>Nama Siswa</span>
          <strong>{raport.siswa_nama}</strong>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>NIS</span>
          <strong>{raport.nis}</strong>
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <span className={styles.label}>Rombongan Belajar</span>
          <strong>{raport.rombel_nama}</strong>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Semester</span>
          <strong>{raport.semester}</strong>
        </div>
      </div>
      <div className={styles.row}>
        <div className={styles.field}>
          <span className={styles.label}>Tahun Ajaran</span>
          <strong>{raport.tahun_ajaran}</strong>
        </div>
        <div className={styles.field}>
          <span className={styles.label}>Rata-rata</span>
          <strong>{raport.rata_rata.toFixed(2)}</strong>
        </div>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Status</span>
        <strong>{raport.status}</strong>
      </div>
    </div>
  )
}

// ─── Nilai per Mapel tab ─────────────────────────────────────────────────────

function NilaiMapelTab({ mapel }: { mapel: RaportMapel[] }) {
  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Mata Pelajaran</th>
            <th>KKM</th>
            <th>Nilai Akhir</th>
            <th>Predikat</th>
            <th>Catatan</th>
          </tr>
        </thead>
        <tbody>
          {mapel.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Belum ada data nilai
              </td>
            </tr>
          )}
          {mapel.map((m) => (
            <tr key={m.id}>
              <td>{m.mata_pelajaran_nama}</td>
              <td>{m.kkm}</td>
              <td style={{ fontWeight: m.nilai_akhir < m.kkm ? 600 : undefined, color: m.nilai_akhir < m.kkm ? 'var(--color-danger)' : undefined }}>
                {m.nilai_akhir}
              </td>
              <td>{m.predikat}</td>
              <td>{m.catatan ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RaportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: raport, isLoading, error } = useQuery<Raport>({
    queryKey: ['raport', id],
    queryFn: () => raportService.getById(id!),
    enabled: !!id,
  })

  if (isLoading) return <div style={{ padding: 32 }}>Memuat...</div>
  if (error || !raport) return <div style={{ padding: 32 }}>Data raport tidak ditemukan</div>

  return (
    <DetailPageTemplate
      title={raport.siswa_nama}
      code={raport.nis}
      onBack={() => navigate('/sekolah/akademik/raport')}
      badges={
        <span
          style={{
            padding: '2px 10px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            background: raport.status === 'Diterbitkan'
              ? 'var(--color-success-light)'
              : raport.status === 'Final'
              ? 'var(--color-warning-light)'
              : 'var(--color-surface-alt)',
            color: raport.status === 'Diterbitkan'
              ? 'var(--color-success)'
              : raport.status === 'Final'
              ? 'var(--color-warning)'
              : 'var(--color-text-secondary)',
          }}
        >
          {raport.status}
        </span>
      }
      tabs={[
        {
          id: 'info',
          label: 'Info Raport',
          content: <InfoRaportTab raport={raport} />,
        },
        {
          id: 'nilai',
          label: 'Nilai per Mapel',
          content: <NilaiMapelTab mapel={raport.mapel} />,
        },
      ]}
      actions={[]}
    />
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx tsc --noEmit --strict 2>&1 | grep -E "Raport" | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/sekolah/akademik/RaportListPage.tsx \
        src/pages/sekolah/akademik/RaportDetailPage.tsx
git commit -m "feat(akademik): add Raport list and detail pages"
```

---

## Task 9: Laporan Dinas (Filter Form + Export)

**Files:**
- Create: `src/pages/sekolah/akademik/LaporanDinasPage.tsx`
- Create: `src/pages/sekolah/akademik/LaporanDinas.module.css`

- [ ] **Step 1: Create LaporanDinasPage**

```tsx
// src/pages/sekolah/akademik/LaporanDinasPage.tsx
import { useState } from 'react'
import { FileSpreadsheet, FileText, Code2, Loader2 } from 'lucide-react'
import { PageHeader } from '@/layouts/PageHeader/PageHeader'
import { PageWrapper } from '@/widgets/PageWrapper/PageWrapper'
import { laporanDinasService } from '@/services/sekolah/akademik.service'
import { toast } from '@/widgets/Toast/Toast'
import type {
  LaporanDinasReportName,
  LaporanDinasFilters,
} from '@/types/sekolah/akademik.types'
import styles from './LaporanDinas.module.css'

const REPORT_OPTIONS: { value: LaporanDinasReportName; label: string }[] = [
  { value: 'Rekap Absensi Siswa', label: 'Rekap Absensi Siswa' },
  { value: 'Rekap Absensi Guru', label: 'Rekap Absensi Guru' },
  { value: 'Laporan TPG', label: 'Laporan TPG (Tunjangan Profesi Guru)' },
]

// Fields shown per report
const REPORT_FILTER_FIELDS: Record<LaporanDinasReportName, (keyof LaporanDinasFilters)[]> = {
  'Rekap Absensi Siswa': ['sekolah', 'tahun_ajaran', 'semester', 'rombel'],
  'Rekap Absensi Guru': ['sekolah', 'bulan', 'tahun_ajaran'],
  'Laporan TPG': ['sekolah', 'tahun_ajaran', 'semester'],
}

const SEMESTER_OPTIONS = ['Ganjil', 'Genap']

const FIELD_LABELS: Record<keyof LaporanDinasFilters, string> = {
  sekolah: 'Sekolah',
  tahun_ajaran: 'Tahun Ajaran',
  semester: 'Semester',
  rombel: 'Rombongan Belajar',
  bulan: 'Bulan (YYYY-MM)',
}

type ExportFormat = 'xlsx' | 'pdf' | 'json'

export default function LaporanDinasPage() {
  const [reportName, setReportName] = useState<LaporanDinasReportName | ''>('')
  const [filters, setFilters] = useState<LaporanDinasFilters>({})
  const [loadingFormat, setLoadingFormat] = useState<ExportFormat | null>(null)

  const activeFields = reportName ? REPORT_FILTER_FIELDS[reportName] : []

  function handleFilterChange(field: keyof LaporanDinasFilters, value: string) {
    setFilters((prev) => ({ ...prev, [field]: value || undefined }))
  }

  function handleReportChange(value: string) {
    setReportName(value as LaporanDinasReportName | '')
    setFilters({})  // reset filters when report changes
  }

  async function handleExport(format: ExportFormat) {
    if (!reportName) {
      toast.error('Pilih jenis laporan terlebih dahulu')
      return
    }
    setLoadingFormat(format)
    try {
      if (format === 'xlsx') {
        await laporanDinasService.exportXlsx(reportName, filters)
      } else if (format === 'pdf') {
        await laporanDinasService.exportPdf(reportName, filters)
      } else {
        await laporanDinasService.exportJson(reportName, filters)
      }
      toast.success(`Laporan berhasil diunduh (${format.toUpperCase()})`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Gagal mengunduh laporan ${format.toUpperCase()}`)
    } finally {
      setLoadingFormat(null)
    }
  }

  return (
    <>
      <PageHeader title="Laporan Dinas" />
      <PageWrapper error={null} onRetry={() => {}}>
        <div className={styles.container}>
          {/* Report selector */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Pilih Jenis Laporan</h2>
            <div className={styles.field}>
              <label className={styles.label}>Jenis Laporan <span className={styles.required}>*</span></label>
              <select
                className={styles.select}
                value={reportName}
                onChange={(e) => handleReportChange(e.target.value)}
              >
                <option value="">— Pilih laporan —</option>
                {REPORT_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter fields — only shown after report is selected */}
          {reportName && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Filter Laporan</h2>
              <div className={styles.filterGrid}>
                {activeFields.map((field) => (
                  <div key={field} className={styles.field}>
                    <label className={styles.label}>{FIELD_LABELS[field]}</label>
                    {field === 'semester' ? (
                      <select
                        className={styles.select}
                        value={filters.semester ?? ''}
                        onChange={(e) => handleFilterChange('semester', e.target.value)}
                      >
                        <option value="">Semua Semester</option>
                        {SEMESTER_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className={styles.input}
                        type={field === 'bulan' ? 'month' : 'text'}
                        value={(filters[field] as string | undefined) ?? ''}
                        onChange={(e) => handleFilterChange(field, e.target.value)}
                        placeholder={field === 'bulan' ? 'YYYY-MM' : FIELD_LABELS[field]}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export buttons */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Unduh Laporan</h2>
            <p className={styles.exportHint}>
              Pilih format laporan yang ingin diunduh. Filter yang telah diisi akan diterapkan secara otomatis.
            </p>
            <div className={styles.exportButtons}>
              <button
                className={styles.exportBtn}
                onClick={() => void handleExport('xlsx')}
                disabled={!reportName || loadingFormat !== null}
              >
                {loadingFormat === 'xlsx'
                  ? <Loader2 size={18} className={styles.spin} />
                  : <FileSpreadsheet size={18} />
                }
                Excel (.xlsx)
              </button>
              <button
                className={styles.exportBtn}
                onClick={() => void handleExport('pdf')}
                disabled={!reportName || loadingFormat !== null}
              >
                {loadingFormat === 'pdf'
                  ? <Loader2 size={18} className={styles.spin} />
                  : <FileText size={18} />
                }
                PDF
              </button>
              <button
                className={styles.exportBtn}
                onClick={() => void handleExport('json')}
                disabled={!reportName || loadingFormat !== null}
              >
                {loadingFormat === 'json'
                  ? <Loader2 size={18} className={styles.spin} />
                  : <Code2 size={18} />
                }
                JSON (Data Dinas)
              </button>
            </div>
          </div>
        </div>
      </PageWrapper>
    </>
  )
}
```

- [ ] **Step 2: Create LaporanDinas CSS module**

```css
/* src/pages/sekolah/akademik/LaporanDinas.module.css */
.container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px;
  max-width: 760px;
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cardTitle {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.filterGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.required {
  color: var(--color-danger);
  margin-left: 2px;
}

.input,
.select {
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  color: var(--color-text);
  background: var(--color-surface);
  transition: border-color 0.15s;
}

.input:focus,
.select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.select {
  appearance: none;
  cursor: pointer;
}

.exportHint {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
}

.exportButtons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.exportBtn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.exportBtn:hover:not(:disabled) {
  background: var(--color-surface-alt);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.exportBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 1s linear infinite;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx tsc --noEmit --strict 2>&1 | grep -E "LaporanDinas" | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/sekolah/akademik/LaporanDinasPage.tsx \
        src/pages/sekolah/akademik/LaporanDinas.module.css
git commit -m "feat(akademik): add Laporan Dinas filter and export page"
```

---

## Task 10: Route Registration

**Files:**
- Modify: `src/app/routes.sekolah.tsx` — add all 15 akademik routes

> **Note:** This task assumes `routes.sekolah.tsx` was created in the infra plan. If the file does not yet exist, create it with the sekolah route block shown below and import it in `routes.tsx`.

- [ ] **Step 1: Add akademik lazy imports to routes.sekolah.tsx**

Open `src/app/routes.sekolah.tsx`. Add the following lazy imports at the top of the file alongside the existing sekolah imports:

```tsx
// ── Akademik ─────────────────────────────────────────────────────────────────
const MataPelajaranListPage  = lazy(() => import('@/pages/sekolah/akademik/MataPelajaranListPage'))
const MataPelajaranFormPage  = lazy(() => import('@/pages/sekolah/akademik/MataPelajaranFormPage'))
const JadwalListPage         = lazy(() => import('@/pages/sekolah/akademik/JadwalListPage'))
const JadwalDetailPage       = lazy(() => import('@/pages/sekolah/akademik/JadwalDetailPage'))
const JadwalFormPage         = lazy(() => import('@/pages/sekolah/akademik/JadwalFormPage'))
const AbsensiSiswaListPage   = lazy(() => import('@/pages/sekolah/akademik/AbsensiSiswaListPage'))
const AbsensiSiswaFormPage   = lazy(() => import('@/pages/sekolah/akademik/AbsensiSiswaFormPage'))
const AbsensiGuruListPage    = lazy(() => import('@/pages/sekolah/akademik/AbsensiGuruListPage'))
const AbsensiGuruFormPage    = lazy(() => import('@/pages/sekolah/akademik/AbsensiGuruFormPage'))
const PenilaianListPage      = lazy(() => import('@/pages/sekolah/akademik/PenilaianListPage'))
const PenilaianFormPage      = lazy(() => import('@/pages/sekolah/akademik/PenilaianFormPage'))
const RaportListPage         = lazy(() => import('@/pages/sekolah/akademik/RaportListPage'))
const RaportDetailPage       = lazy(() => import('@/pages/sekolah/akademik/RaportDetailPage'))
const LaporanDinasPage       = lazy(() => import('@/pages/sekolah/akademik/LaporanDinasPage'))
```

- [ ] **Step 2: Add akademik child routes inside the /sekolah route block**

Inside the `children` array of the `/sekolah` route (under AppShell context="sekolah"), add:

```tsx
// ── Akademik ─────────────────────────────────────────────────────────────────
{ path: 'akademik/mata-pelajaran',           element: <S><MataPelajaranListPage /></S> },
{ path: 'akademik/mata-pelajaran/new',       element: <S><MataPelajaranFormPage /></S> },
{ path: 'akademik/mata-pelajaran/:id/edit',  element: <S><MataPelajaranFormPage /></S> },

{ path: 'akademik/jadwal',                   element: <S><JadwalListPage /></S> },
{ path: 'akademik/jadwal/new',               element: <S><JadwalFormPage /></S> },
{ path: 'akademik/jadwal/:id',               element: <S><JadwalDetailPage /></S> },
{ path: 'akademik/jadwal/:id/edit',          element: <S><JadwalFormPage /></S> },

{ path: 'akademik/absensi-siswa',            element: <S><AbsensiSiswaListPage /></S> },
{ path: 'akademik/absensi-siswa/new',        element: <S><AbsensiSiswaFormPage /></S> },
{ path: 'akademik/absensi-siswa/:id/edit',   element: <S><AbsensiSiswaFormPage /></S> },

{ path: 'akademik/absensi-guru',             element: <S><AbsensiGuruListPage /></S> },
{ path: 'akademik/absensi-guru/new',         element: <S><AbsensiGuruFormPage /></S> },
{ path: 'akademik/absensi-guru/:id/edit',    element: <S><AbsensiGuruFormPage /></S> },

{ path: 'akademik/penilaian',                element: <S><PenilaianListPage /></S> },
{ path: 'akademik/penilaian/new',            element: <S><PenilaianFormPage /></S> },
{ path: 'akademik/penilaian/:id/edit',       element: <S><PenilaianFormPage /></S> },

{ path: 'akademik/raport',                   element: <S><RaportListPage /></S> },
{ path: 'akademik/raport/:id',               element: <S><RaportDetailPage /></S> },

{ path: 'akademik/laporan-dinas',            element: <S><LaporanDinasPage /></S> },
```

- [ ] **Step 3: Verify AppSubNav config includes Akademik entries**

Open `src/layouts/AppSubNav/subnav.config.ts`. Confirm the `sekolah.akademik` array contains all 7 entries:

```ts
akademik: [
  { key: 'mata-pelajaran', label: 'Mata Pelajaran',   path: '/sekolah/akademik/mata-pelajaran' },
  { key: 'jadwal',         label: 'Jadwal Pelajaran',  path: '/sekolah/akademik/jadwal' },
  { key: 'absensi-siswa',  label: 'Absensi Siswa',     path: '/sekolah/akademik/absensi-siswa' },
  { key: 'absensi-guru',   label: 'Absensi Guru',      path: '/sekolah/akademik/absensi-guru' },
  { key: 'penilaian',      label: 'Penilaian',          path: '/sekolah/akademik/penilaian' },
  { key: 'raport',         label: 'Raport',             path: '/sekolah/akademik/raport' },
  { key: 'laporan-dinas',  label: 'Laporan Dinas',      path: '/sekolah/akademik/laporan-dinas' },
],
```

If the entries are missing, add them.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx tsc --noEmit --strict 2>&1 | head -30
```

Expected: zero errors.

- [ ] **Step 5: Run dev server and verify all routes navigate without 404**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npm run dev
```

Navigate in the browser to each route manually:
- `/sekolah/akademik/mata-pelajaran` — list renders
- `/sekolah/akademik/mata-pelajaran/new` — form renders
- `/sekolah/akademik/jadwal` — list renders
- `/sekolah/akademik/jadwal/new` — form renders
- `/sekolah/akademik/absensi-siswa` — list with filter button renders
- `/sekolah/akademik/absensi-guru` — list renders
- `/sekolah/akademik/penilaian` — list renders
- `/sekolah/akademik/raport` — list renders
- `/sekolah/akademik/laporan-dinas` — filter form + 3 export buttons render

Expected: no blank pages, no console errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/routes.sekolah.tsx src/layouts/AppSubNav/subnav.config.ts
git commit -m "feat(akademik): register all 19 akademik routes and subnav entries"
```

---

## Self-Review Checklist

### Spec coverage

| Spec requirement | Task |
|---|---|
| Mata Pelajaran List + Form | Task 3 |
| Jadwal Pelajaran Simple Detail (Slot, Override tabs) | Task 4 |
| Absensi Siswa List + Form (filter by rombel+tanggal) | Task 5 |
| Absensi Guru List + Form | Task 6 |
| Penilaian List + Form | Task 7 |
| Raport Simple Detail (Info, Nilai per Mapel tabs) | Task 8 |
| Laporan Dinas: filter form + XLSX/PDF/JSON export | Task 9 |
| Route registration under /sekolah/akademik/* | Task 10 |
| Types for all doctypes | Task 1 |
| Services using createEntityService | Task 2 |

### Type consistency check

- `mataPelajaranService`, `jadwalService`, `absensiSiswaService`, `absensiGuruService`, `penilaianService`, `raportService`, `laporanDinasService` — all defined in Task 2 and used by name in Tasks 3–9. Names match.
- `MataPelajaran`, `JadwalPelajaran`, `SlotJadwal`, `AbsensiHarian`, `DetailAbsensiHarian`, `AbsensiGuru`, `DetailAbsensiGuru`, `EntriNilai`, `Raport`, `RaportMapel`, `LaporanDinasReportName`, `LaporanDinasFilters` — all defined in Task 1 and imported by exact same name in Tasks 3–9. Names match.
- `StatusAbsensiSiswa` used in Task 5 — defined in Task 1.
- `StatusAbsensiGuru` used in Task 6 — defined in Task 1.
- `AkademikForm.module.css` used in Tasks 3–8. Created in Task 3.
- `LaporanDinas.module.css` used in Task 9. Created in Task 9.

### Placeholder scan

No TBD, TODO, or "similar to Task N" found. All code blocks contain complete, copy-pasteable code.
