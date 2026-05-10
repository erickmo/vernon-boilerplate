# Sekolah — Perpustakaan & Pengaturan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Perpustakaan and Pengaturan modules for the Sekolah dashboard — types, services, and all page components (ListPage, DetailPage, FormPage) following the Simple Detail and List+Form patterns from the design spec.

**Architecture:** Each entity has a typed service created with `createEntityService`, page components consume templates (`ListPageTemplate`, `DetailPageTemplate`, `FormPageTemplate`), and Frappe API calls go to `POST /api/method/sekolahpro.<module>.api.<endpoint>`. Types live in `src/types/sekolah/`, services in `src/services/sekolah/`, pages in `src/pages/sekolah/perpustakaan/` and `src/pages/sekolah/pengaturan/`.

**Tech Stack:** React 18, TypeScript (strict), TanStack Query v5, CSS Modules, React Router 6

**Prerequisite:** Phase 1 infra-plan complete — `AppSubNav`, `routes.sekolah.tsx`, `AppShell` update all exist.

---

## Phase 4: Perpustakaan Module

### Task 4.1 — Types: `src/types/sekolah/perpustakaan.types.ts`

- [ ] Create file with all Perpustakaan entity types

```ts
// src/types/sekolah/perpustakaan.types.ts

export type StatusEksemplar = 'Tersedia' | 'Dipinjam' | 'Dipesan' | 'Rusak' | 'Hilang'
export type StatusReservasi = 'Menunggu' | 'Aktif' | 'Selesai' | 'Dibatalkan'
export type StatusPeminjaman = 'Aktif' | 'Dikembalikan' | 'Terlambat'

export interface KategoriBuku {
  id: string
  nama: string
  deskripsi?: string
}

export interface Buku {
  id: string
  judul: string
  penulis: string
  isbn: string
  penerbit: string
  tahun_terbit: number
  kategori: string
  kategori_nama?: string
  deskripsi?: string
  stok_total: number
  stok_tersedia: number
  created_at: string
  updated_at: string
}

export interface EksemplarBuku {
  id: string
  buku_id: string
  kode_eksemplar: string
  kondisi: string
  status: StatusEksemplar
  lokasi_rak?: string
}

export interface AnggotaPerpustakaan {
  id: string
  siswa_id: string
  siswa_nama: string
  nis: string
  tanggal_daftar: string
  status: 'Aktif' | 'Tidak Aktif'
  jumlah_buku_dipinjam: number
}

export interface ItemPeminjaman {
  id: string
  peminjaman_id: string
  eksemplar_id: string
  kode_eksemplar: string
  judul_buku: string
}

export interface PeminjamanBuku {
  id: string
  nomor: string
  anggota_id: string
  anggota_nama: string
  nis: string
  tanggal_pinjam: string
  jatuh_tempo: string
  tanggal_kembali?: string
  status: StatusPeminjaman
  items: ItemPeminjaman[]
  created_at: string
}

export interface PengembalianBuku {
  id: string
  peminjaman_id: string
  nomor_peminjaman: string
  anggota_nama: string
  tanggal_kembali_rencana: string
  tanggal_kembali_aktual: string
  keterlambatan_hari: number
  denda_total: number
  created_at: string
}

export interface DendaPerpustakaan {
  id: string
  anggota_id: string
  anggota_nama: string
  peminjaman_id: string
  nomor_peminjaman: string
  jumlah_denda: number
  status_lunas: boolean
  tanggal_lunas?: string
  created_at: string
}

export interface ReservasiBuku {
  id: string
  buku_id: string
  judul_buku: string
  anggota_id: string
  anggota_nama: string
  status: StatusReservasi
  tanggal_reservasi: string
  tanggal_aktif?: string
  tanggal_selesai?: string
}
```

---

### Task 4.2 — Service: `src/services/sekolah/perpustakaan.service.ts`

- [ ] Create service file for all Perpustakaan entities

```ts
// src/services/sekolah/perpustakaan.service.ts

import { createEntityService } from '@/services/createEntityService'
import { apiClient } from '@/services/api.client'
import type {
  Buku, EksemplarBuku, KategoriBuku,
  AnggotaPerpustakaan, PeminjamanBuku, PengembalianBuku,
  DendaPerpustakaan, ReservasiBuku,
} from '@/types/sekolah/perpustakaan.types'

const BASE = '/api/method/sekolahpro.perpustakaan.api'

export const bukuService = createEntityService<Buku>(`${BASE}.buku`)
export const eksemplarService = createEntityService<EksemplarBuku>(`${BASE}.eksemplar_buku`)
export const kategoriBukuService = createEntityService<KategoriBuku>(`${BASE}.kategori_buku`)
export const anggotaPerpustakaanService = createEntityService<AnggotaPerpustakaan>(`${BASE}.anggota_perpustakaan`)
export const peminjamanService = createEntityService<PeminjamanBuku>(`${BASE}.peminjaman_buku`)
export const pengembalianService = createEntityService<PengembalianBuku>(`${BASE}.pengembalian_buku`)
export const dendaService = createEntityService<DendaPerpustakaan>(`${BASE}.denda_perpustakaan`)
export const reservasiService = createEntityService<ReservasiBuku>(`${BASE}.reservasi_buku`)

/** Fetch eksemplar list for a specific buku */
export async function getEksemplarByBuku(bukuId: string): Promise<EksemplarBuku[]> {
  const res = await apiClient.get<{ items: EksemplarBuku[] }>(
    `${BASE}.eksemplar_buku?buku_id=${bukuId}&limit=200`,
  )
  return res.items
}

/** Fetch peminjaman history for a specific eksemplar or buku */
export async function getPeminjamanHistoryByBuku(bukuId: string): Promise<PeminjamanBuku[]> {
  const res = await apiClient.get<{ items: PeminjamanBuku[] }>(
    `${BASE}.peminjaman_buku?buku_id=${bukuId}&limit=50`,
  )
  return res.items
}

/** Fetch all denda for a specific peminjaman */
export async function getDendaByPeminjaman(peminjamanId: string): Promise<DendaPerpustakaan[]> {
  const res = await apiClient.get<{ items: DendaPerpustakaan[] }>(
    `${BASE}.denda_perpustakaan?peminjaman_id=${peminjamanId}&limit=50`,
  )
  return res.items
}
```

---

### Task 4.3 — Buku: ListPage

- [ ] Create `src/pages/sekolah/perpustakaan/BukuListPage.tsx`

```tsx
// src/pages/sekolah/perpustakaan/BukuListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { bukuService } from '@/services/sekolah/perpustakaan.service'
import type { Buku } from '@/types/sekolah/perpustakaan.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const BUKU_COLUMNS: ColumnDef<Buku>[] = [
  { key: 'judul', label: 'Judul', sortable: true },
  { key: 'penulis', label: 'Penulis', sortable: true },
  { key: 'isbn', label: 'ISBN' },
  { key: 'kategori_nama', label: 'Kategori' },
  {
    key: 'stok_tersedia',
    label: 'Stok Tersedia',
    render: (row) => (
      <span style={{ color: row.stok_tersedia === 0 ? 'var(--color-danger)' : 'inherit' }}>
        {row.stok_tersedia} / {row.stok_total}
      </span>
    ),
  },
]

export function BukuListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<Buku>
      title="Katalog Buku"
      queryKey="perpustakaan-buku"
      fetcher={bukuService.list}
      columns={BUKU_COLUMNS}
      addLabel="Tambah Buku"
      onAdd={() => navigate('/sekolah/perpustakaan/buku/new')}
      onRowClick={(row) => navigate(`/sekolah/perpustakaan/buku/${row.id}`)}
      searchPlaceholder="Cari judul, penulis, atau ISBN..."
      exportFilename="katalog-buku"
      deleteConfig={{
        onDelete: (row) => bukuService.delete(row.id),
        dialogTitle: 'Hapus Buku?',
        dialogBody: (row) => `Buku "${row.judul}" akan dihapus secara permanen.`,
        successMessage: (row) => `Buku "${row.judul}" berhasil dihapus.`,
      }}
    />
  )
}
```

---

### Task 4.4 — Buku: DetailPage (Simple Detail — 2 tabs)

- [ ] Create `src/pages/sekolah/perpustakaan/BukuDetailPage.tsx`

```tsx
// src/pages/sekolah/perpustakaan/BukuDetailPage.tsx

import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Edit, Trash2 } from 'lucide-react'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { bukuService, getEksemplarByBuku, getPeminjamanHistoryByBuku } from '@/services/sekolah/perpustakaan.service'
import type { Buku, EksemplarBuku, PeminjamanBuku } from '@/types/sekolah/perpustakaan.types'
import styles from './BukuDetailPage.module.css'

// ─── Tab: Info Buku ──────────────────────────────────────────────────────────

function InfoBukuTab({ buku }: { buku: Buku }) {
  return (
    <div className={styles.infoGrid}>
      <div className={styles.field}><span className={styles.label}>Judul</span><span className={styles.value}>{buku.judul}</span></div>
      <div className={styles.field}><span className={styles.label}>Penulis</span><span className={styles.value}>{buku.penulis}</span></div>
      <div className={styles.field}><span className={styles.label}>ISBN</span><span className={styles.value}>{buku.isbn}</span></div>
      <div className={styles.field}><span className={styles.label}>Penerbit</span><span className={styles.value}>{buku.penerbit}</span></div>
      <div className={styles.field}><span className={styles.label}>Tahun Terbit</span><span className={styles.value}>{buku.tahun_terbit}</span></div>
      <div className={styles.field}><span className={styles.label}>Kategori</span><span className={styles.value}>{buku.kategori_nama ?? buku.kategori}</span></div>
      <div className={styles.field}><span className={styles.label}>Stok Total</span><span className={styles.value}>{buku.stok_total}</span></div>
      <div className={styles.field}><span className={styles.label}>Stok Tersedia</span><span className={styles.value}>{buku.stok_tersedia}</span></div>
      {buku.deskripsi && (
        <div className={`${styles.field} ${styles.fullWidth}`}>
          <span className={styles.label}>Deskripsi</span>
          <span className={styles.value}>{buku.deskripsi}</span>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Eksemplar & Riwayat ────────────────────────────────────────────────

function EksemplarRiwayatTab({ bukuId }: { bukuId: string }) {
  const { data: eksemplarList = [], isLoading: loadingEksemplar } = useQuery({
    queryKey: ['eksemplar-by-buku', bukuId],
    queryFn: () => getEksemplarByBuku(bukuId),
  })

  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['peminjaman-history-buku', bukuId],
    queryFn: () => getPeminjamanHistoryByBuku(bukuId),
  })

  const STATUS_COLOR: Record<string, string> = {
    Tersedia: 'var(--color-success)',
    Dipinjam: 'var(--color-warning)',
    Dipesan: 'var(--color-info)',
    Rusak: 'var(--color-danger)',
    Hilang: 'var(--color-danger)',
  }

  return (
    <div className={styles.eksemplarSection}>
      <h3 className={styles.sectionTitle}>Eksemplar Buku</h3>
      {loadingEksemplar ? (
        <p className={styles.loadingText}>Memuat data eksemplar...</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Kode Eksemplar</th>
              <th>Kondisi</th>
              <th>Status</th>
              <th>Lokasi Rak</th>
            </tr>
          </thead>
          <tbody>
            {eksemplarList.length === 0 ? (
              <tr><td colSpan={4} className={styles.emptyCell}>Belum ada eksemplar</td></tr>
            ) : (
              eksemplarList.map((eks: EksemplarBuku) => (
                <tr key={eks.id}>
                  <td>{eks.kode_eksemplar}</td>
                  <td>{eks.kondisi}</td>
                  <td>
                    <span style={{ color: STATUS_COLOR[eks.status] ?? 'inherit' }}>{eks.status}</span>
                  </td>
                  <td>{eks.lokasi_rak ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <h3 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>Riwayat Peminjaman</h3>
      {loadingHistory ? (
        <p className={styles.loadingText}>Memuat riwayat...</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>No. Peminjaman</th>
              <th>Anggota</th>
              <th>Tanggal Pinjam</th>
              <th>Jatuh Tempo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr><td colSpan={5} className={styles.emptyCell}>Belum ada riwayat peminjaman</td></tr>
            ) : (
              history.map((p: PeminjamanBuku) => (
                <tr key={p.id}>
                  <td>{p.nomor}</td>
                  <td>{p.anggota_nama}</td>
                  <td>{p.tanggal_pinjam}</td>
                  <td>{p.jatuh_tempo}</td>
                  <td>{p.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function BukuDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: buku, isLoading, error } = useQuery({
    queryKey: ['buku', id],
    queryFn: () => bukuService.getById(id!),
    enabled: !!id,
  })

  if (isLoading) return <p>Memuat data buku...</p>
  if (error || !buku) return <p>Buku tidak ditemukan.</p>

  return (
    <DetailPageTemplate
      title={buku.judul}
      code={buku.isbn}
      onBack={() => navigate('/sekolah/perpustakaan/buku')}
      backLabel="Katalog Buku"
      tabs={[
        { id: 'info', label: 'Info Buku', content: <InfoBukuTab buku={buku} /> },
        { id: 'eksemplar', label: 'Eksemplar & Riwayat', content: <EksemplarRiwayatTab bukuId={buku.id} /> },
      ]}
      actions={[
        {
          label: 'Edit',
          icon: <Edit size={14} />,
          onClick: () => navigate(`/sekolah/perpustakaan/buku/${id}/edit`),
          variant: 'primary',
        },
        {
          label: 'Hapus',
          icon: <Trash2 size={14} />,
          onClick: async () => {
            if (window.confirm(`Hapus buku "${buku.judul}"?`)) {
              await bukuService.delete(buku.id)
              navigate('/sekolah/perpustakaan/buku')
            }
          },
          variant: 'danger',
        },
      ]}
    />
  )
}
```

- [ ] Create `src/pages/sekolah/perpustakaan/BukuDetailPage.module.css`

```css
/* BukuDetailPage.module.css */

.infoGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem 2rem;
  padding: 1.5rem;
}

.fullWidth {
  grid-column: 1 / -1;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
}

.value {
  font-size: 0.9375rem;
  color: var(--color-text-primary);
}

.eksemplarSection {
  padding: 1.5rem;
}

.sectionTitle {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0 0 0.75rem;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.table th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  color: var(--color-text-secondary);
  font-weight: 600;
  border-bottom: 1px solid var(--color-border);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.table td {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--color-border-light, var(--color-border));
  color: var(--color-text-primary);
}

.table tr:last-child td {
  border-bottom: none;
}

.emptyCell {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 1.5rem !important;
}

.loadingText {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}
```

---

### Task 4.5 — Buku: FormPage

- [ ] Create `src/pages/sekolah/perpustakaan/BukuFormPage.tsx`

```tsx
// src/pages/sekolah/perpustakaan/BukuFormPage.tsx

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { bukuService, kategoriBukuService } from '@/services/sekolah/perpustakaan.service'
import { toast } from '@/widgets/Toast/Toast'
import type { Buku } from '@/types/sekolah/perpustakaan.types'
import styles from './BukuFormPage.module.css'

interface BukuFormData {
  judul: string
  penulis: string
  isbn: string
  penerbit: string
  tahun_terbit: string
  kategori: string
  deskripsi: string
}

const EMPTY_FORM: BukuFormData = {
  judul: '',
  penulis: '',
  isbn: '',
  penerbit: '',
  tahun_terbit: '',
  kategori: '',
  deskripsi: '',
}

function BukuFormFields({
  form,
  onChange,
  kategoriOptions,
}: {
  form: BukuFormData
  onChange: (key: keyof BukuFormData, value: string) => void
  kategoriOptions: { id: string; nama: string }[]
}) {
  return (
    <div className={styles.fields}>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="judul">Judul <span className={styles.required}>*</span></label>
        <input
          id="judul"
          className={styles.input}
          value={form.judul}
          onChange={(e) => onChange('judul', e.target.value)}
          required
          placeholder="Masukkan judul buku"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="penulis">Penulis <span className={styles.required}>*</span></label>
        <input
          id="penulis"
          className={styles.input}
          value={form.penulis}
          onChange={(e) => onChange('penulis', e.target.value)}
          required
          placeholder="Nama penulis"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="isbn">ISBN</label>
        <input
          id="isbn"
          className={styles.input}
          value={form.isbn}
          onChange={(e) => onChange('isbn', e.target.value)}
          placeholder="978-xxx-xxx-xxx-x"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="penerbit">Penerbit</label>
        <input
          id="penerbit"
          className={styles.input}
          value={form.penerbit}
          onChange={(e) => onChange('penerbit', e.target.value)}
          placeholder="Nama penerbit"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="tahun_terbit">Tahun Terbit</label>
        <input
          id="tahun_terbit"
          className={styles.input}
          type="number"
          min={1900}
          max={2100}
          value={form.tahun_terbit}
          onChange={(e) => onChange('tahun_terbit', e.target.value)}
          placeholder="2024"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="kategori">Kategori</label>
        <select
          id="kategori"
          className={styles.select}
          value={form.kategori}
          onChange={(e) => onChange('kategori', e.target.value)}
        >
          <option value="">— Pilih Kategori —</option>
          {kategoriOptions.map((k) => (
            <option key={k.id} value={k.id}>{k.nama}</option>
          ))}
        </select>
      </div>

      <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
        <label className={styles.label} htmlFor="deskripsi">Deskripsi</label>
        <textarea
          id="deskripsi"
          className={styles.textarea}
          value={form.deskripsi}
          onChange={(e) => onChange('deskripsi', e.target.value)}
          rows={4}
          placeholder="Sinopsis atau keterangan buku"
        />
      </div>
    </div>
  )
}

export function BukuFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [form, setForm] = useState<BukuFormData>(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: buku } = useQuery({
    queryKey: ['buku', id],
    queryFn: () => bukuService.getById(id!),
    enabled: isEdit,
  })

  const { data: kategoriRes } = useQuery({
    queryKey: ['kategori-buku'],
    queryFn: () => kategoriBukuService.list({ limit: 200 }),
  })
  const kategoriOptions = kategoriRes?.items ?? []

  useEffect(() => {
    if (buku) {
      setForm({
        judul: buku.judul,
        penulis: buku.penulis,
        isbn: buku.isbn,
        penerbit: buku.penerbit,
        tahun_terbit: String(buku.tahun_terbit),
        kategori: buku.kategori,
        deskripsi: buku.deskripsi ?? '',
      })
    }
  }, [buku])

  function handleChange(key: keyof BukuFormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      const payload: Partial<Buku> = {
        ...form,
        tahun_terbit: Number(form.tahun_terbit) || undefined,
      }
      if (isEdit) {
        await bukuService.update(id!, payload)
        await queryClient.invalidateQueries({ queryKey: ['buku', id] })
        toast.success('Data buku berhasil diperbarui')
        navigate(`/sekolah/perpustakaan/buku/${id}`)
      } else {
        const created = await bukuService.create(payload)
        await queryClient.invalidateQueries({ queryKey: ['perpustakaan-buku'] })
        toast.success('Buku berhasil ditambahkan')
        navigate(`/sekolah/perpustakaan/buku/${(created as Buku).id}`)
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal menyimpan data buku')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Buku' : 'Tambah Buku'}
      onBack={() => navigate(isEdit ? `/sekolah/perpustakaan/buku/${id}` : '/sekolah/perpustakaan/buku')}
      backLabel={isEdit ? 'Detail Buku' : 'Katalog Buku'}
      tabs={[{
        id: 'form',
        label: 'Data Buku',
        content: (
          <BukuFormFields
            form={form}
            onChange={handleChange}
            kategoriOptions={kategoriOptions}
          />
        ),
      }]}
      onSubmit={handleSubmit}
      onCancel={() => navigate(isEdit ? `/sekolah/perpustakaan/buku/${id}` : '/sekolah/perpustakaan/buku')}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Perbarui' : 'Simpan'}
      serverError={serverError}
    />
  )
}
```

- [ ] Create `src/pages/sekolah/perpustakaan/BukuFormPage.module.css`

```css
/* BukuFormPage.module.css */

.fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem 2rem;
  padding: 1.5rem;
}

.fullWidth {
  grid-column: 1 / -1;
}

.fieldGroup {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.required {
  color: var(--color-danger);
  margin-left: 0.125rem;
}

.input,
.select,
.textarea {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  background: var(--color-surface);
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
}

.input:focus,
.select:focus,
.textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha, rgba(59,130,246,0.12));
}

.textarea {
  resize: vertical;
  min-height: 100px;
}
```

---

### Task 4.6 — Anggota Perpustakaan: ListPage + FormPage

- [ ] Create `src/pages/sekolah/perpustakaan/AnggotaPerpustakaanListPage.tsx`

```tsx
// src/pages/sekolah/perpustakaan/AnggotaPerpustakaanListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { anggotaPerpustakaanService } from '@/services/sekolah/perpustakaan.service'
import type { AnggotaPerpustakaan } from '@/types/sekolah/perpustakaan.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const COLUMNS: ColumnDef<AnggotaPerpustakaan>[] = [
  { key: 'siswa_nama', label: 'Nama Siswa', sortable: true },
  { key: 'nis', label: 'NIS' },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <span style={{ color: row.status === 'Aktif' ? 'var(--color-success)' : 'var(--color-danger)' }}>
        {row.status}
      </span>
    ),
  },
  { key: 'jumlah_buku_dipinjam', label: 'Buku Dipinjam' },
  { key: 'tanggal_daftar', label: 'Tanggal Daftar' },
]

export function AnggotaPerpustakaanListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<AnggotaPerpustakaan>
      title="Anggota Perpustakaan"
      queryKey="anggota-perpustakaan"
      fetcher={anggotaPerpustakaanService.list}
      columns={COLUMNS}
      addLabel="Daftarkan Anggota"
      onAdd={() => navigate('/sekolah/perpustakaan/anggota/new')}
      onRowClick={(row) => navigate(`/sekolah/perpustakaan/anggota/${row.id}/edit`)}
      searchPlaceholder="Cari nama atau NIS..."
      exportFilename="anggota-perpustakaan"
      deleteConfig={{
        onDelete: (row) => anggotaPerpustakaanService.delete(row.id),
        dialogTitle: 'Hapus Anggota?',
        dialogBody: (row) => `Anggota "${row.siswa_nama}" akan dihapus dari perpustakaan.`,
        successMessage: (row) => `Anggota "${row.siswa_nama}" berhasil dihapus.`,
      }}
    />
  )
}
```

- [ ] Create `src/pages/sekolah/perpustakaan/AnggotaPerpustakaanFormPage.tsx`

```tsx
// src/pages/sekolah/perpustakaan/AnggotaPerpustakaanFormPage.tsx

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { anggotaPerpustakaanService } from '@/services/sekolah/perpustakaan.service'
import { toast } from '@/widgets/Toast/Toast'
import type { AnggotaPerpustakaan } from '@/types/sekolah/perpustakaan.types'
import styles from './BukuFormPage.module.css'

interface FormData {
  siswa_id: string
  siswa_nama: string
  tanggal_daftar: string
  status: 'Aktif' | 'Tidak Aktif'
}

const EMPTY: FormData = { siswa_id: '', siswa_nama: '', tanggal_daftar: '', status: 'Aktif' }

function AnggotaFormFields({ form, onChange }: { form: FormData; onChange: (k: keyof FormData, v: string) => void }) {
  return (
    <div className={styles.fields}>
      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="siswa_nama">Nama Siswa <span className={styles.required}>*</span></label>
        {/* In production: replace with a searchable select component linked to siswaService.list */}
        <input
          id="siswa_nama"
          className={styles.input}
          value={form.siswa_nama}
          onChange={(e) => onChange('siswa_nama', e.target.value)}
          required
          placeholder="Cari nama siswa..."
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="tanggal_daftar">Tanggal Daftar <span className={styles.required}>*</span></label>
        <input
          id="tanggal_daftar"
          className={styles.input}
          type="date"
          value={form.tanggal_daftar}
          onChange={(e) => onChange('tanggal_daftar', e.target.value)}
          required
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="status">Status</label>
        <select id="status" className={styles.select} value={form.status} onChange={(e) => onChange('status', e.target.value)}>
          <option value="Aktif">Aktif</option>
          <option value="Tidak Aktif">Tidak Aktif</option>
        </select>
      </div>
    </div>
  )
}

export function AnggotaPerpustakaanFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [form, setForm] = useState<FormData>(EMPTY)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: anggota } = useQuery({
    queryKey: ['anggota-perpustakaan', id],
    queryFn: () => anggotaPerpustakaanService.getById(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (anggota) {
      setForm({
        siswa_id: anggota.siswa_id,
        siswa_nama: anggota.siswa_nama,
        tanggal_daftar: anggota.tanggal_daftar,
        status: anggota.status,
      })
    }
  }, [anggota])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      if (isEdit) {
        await anggotaPerpustakaanService.update(id!, form as Partial<AnggotaPerpustakaan>)
        await queryClient.invalidateQueries({ queryKey: ['anggota-perpustakaan'] })
        toast.success('Data anggota berhasil diperbarui')
      } else {
        await anggotaPerpustakaanService.create(form as Partial<AnggotaPerpustakaan>)
        await queryClient.invalidateQueries({ queryKey: ['anggota-perpustakaan'] })
        toast.success('Anggota berhasil didaftarkan')
      }
      navigate('/sekolah/perpustakaan/anggota')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal menyimpan data anggota')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Anggota' : 'Daftarkan Anggota'}
      onBack={() => navigate('/sekolah/perpustakaan/anggota')}
      backLabel="Anggota Perpustakaan"
      tabs={[{
        id: 'form',
        label: 'Data Anggota',
        content: <AnggotaFormFields form={form} onChange={(k, v) => setForm((p) => ({ ...p, [k]: v }))} />,
      }]}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/sekolah/perpustakaan/anggota')}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Perbarui' : 'Daftarkan'}
      serverError={serverError}
    />
  )
}
```

---

### Task 4.7 — Peminjaman Buku: ListPage + DetailPage (Simple Detail) + FormPage

- [ ] Create `src/pages/sekolah/perpustakaan/PeminjamanListPage.tsx`

```tsx
// src/pages/sekolah/perpustakaan/PeminjamanListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { peminjamanService } from '@/services/sekolah/perpustakaan.service'
import type { PeminjamanBuku } from '@/types/sekolah/perpustakaan.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const STATUS_COLOR: Record<string, string> = {
  Aktif: 'var(--color-info)',
  Dikembalikan: 'var(--color-success)',
  Terlambat: 'var(--color-danger)',
}

const COLUMNS: ColumnDef<PeminjamanBuku>[] = [
  { key: 'nomor', label: 'No. Peminjaman', sortable: true },
  { key: 'anggota_nama', label: 'Anggota', sortable: true },
  { key: 'tanggal_pinjam', label: 'Tanggal Pinjam', sortable: true },
  { key: 'jatuh_tempo', label: 'Jatuh Tempo' },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <span style={{ color: STATUS_COLOR[row.status] ?? 'inherit', fontWeight: 600 }}>{row.status}</span>
    ),
  },
]

export function PeminjamanListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<PeminjamanBuku>
      title="Peminjaman Buku"
      queryKey="peminjaman-buku"
      fetcher={peminjamanService.list}
      columns={COLUMNS}
      addLabel="Buat Peminjaman"
      onAdd={() => navigate('/sekolah/perpustakaan/peminjaman/new')}
      onRowClick={(row) => navigate(`/sekolah/perpustakaan/peminjaman/${row.id}`)}
      searchPlaceholder="Cari nomor atau anggota..."
      exportFilename="peminjaman-buku"
      defaultSort={{ key: 'tanggal_pinjam', order: 'desc' }}
    />
  )
}
```

- [ ] Create `src/pages/sekolah/perpustakaan/PeminjamanDetailPage.tsx`

```tsx
// src/pages/sekolah/perpustakaan/PeminjamanDetailPage.tsx

import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { peminjamanService } from '@/services/sekolah/perpustakaan.service'
import type { PeminjamanBuku, ItemPeminjaman } from '@/types/sekolah/perpustakaan.types'
import styles from './BukuDetailPage.module.css'

function InfoPeminjamanTab({ peminjaman }: { peminjaman: PeminjamanBuku }) {
  return (
    <div className={styles.infoGrid}>
      <div className={styles.field}><span className={styles.label}>No. Peminjaman</span><span className={styles.value}>{peminjaman.nomor}</span></div>
      <div className={styles.field}><span className={styles.label}>Anggota</span><span className={styles.value}>{peminjaman.anggota_nama}</span></div>
      <div className={styles.field}><span className={styles.label}>NIS</span><span className={styles.value}>{peminjaman.nis}</span></div>
      <div className={styles.field}><span className={styles.label}>Status</span><span className={styles.value}>{peminjaman.status}</span></div>
      <div className={styles.field}><span className={styles.label}>Tanggal Pinjam</span><span className={styles.value}>{peminjaman.tanggal_pinjam}</span></div>
      <div className={styles.field}><span className={styles.label}>Jatuh Tempo</span><span className={styles.value}>{peminjaman.jatuh_tempo}</span></div>
      {peminjaman.tanggal_kembali && (
        <div className={styles.field}><span className={styles.label}>Tanggal Kembali</span><span className={styles.value}>{peminjaman.tanggal_kembali}</span></div>
      )}
    </div>
  )
}

function ItemBukuTab({ items }: { items: ItemPeminjaman[] }) {
  return (
    <div className={styles.eksemplarSection}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Kode Eksemplar</th>
            <th>Judul Buku</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={2} className={styles.emptyCell}>Tidak ada item</td></tr>
          ) : (
            items.map((item: ItemPeminjaman) => (
              <tr key={item.id}>
                <td>{item.kode_eksemplar}</td>
                <td>{item.judul_buku}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export function PeminjamanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: peminjaman, isLoading, error } = useQuery({
    queryKey: ['peminjaman-buku', id],
    queryFn: () => peminjamanService.getById(id!),
    enabled: !!id,
  })

  if (isLoading) return <p>Memuat data peminjaman...</p>
  if (error || !peminjaman) return <p>Peminjaman tidak ditemukan.</p>

  return (
    <DetailPageTemplate
      title={peminjaman.nomor}
      code={peminjaman.anggota_nama}
      onBack={() => navigate('/sekolah/perpustakaan/peminjaman')}
      backLabel="Peminjaman Buku"
      tabs={[
        { id: 'info', label: 'Info Peminjaman', content: <InfoPeminjamanTab peminjaman={peminjaman} /> },
        { id: 'items', label: 'Item Buku', content: <ItemBukuTab items={peminjaman.items} /> },
      ]}
      actions={[
        {
          label: 'Edit',
          onClick: () => navigate(`/sekolah/perpustakaan/peminjaman/${id}/edit`),
          variant: 'primary',
        },
      ]}
    />
  )
}
```

- [ ] Create `src/pages/sekolah/perpustakaan/PeminjamanFormPage.tsx`

```tsx
// src/pages/sekolah/perpustakaan/PeminjamanFormPage.tsx

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { peminjamanService, anggotaPerpustakaanService, eksemplarService } from '@/services/sekolah/perpustakaan.service'
import { toast } from '@/widgets/Toast/Toast'
import type { PeminjamanBuku } from '@/types/sekolah/perpustakaan.types'
import styles from './PeminjamanFormPage.module.css'

interface PeminjamanFormData {
  anggota_id: string
  anggota_nama: string
  tanggal_pinjam: string
  jatuh_tempo: string
  eksemplar_ids: string[]
}

const EMPTY: PeminjamanFormData = {
  anggota_id: '',
  anggota_nama: '',
  tanggal_pinjam: new Date().toISOString().split('T')[0],
  jatuh_tempo: '',
  eksemplar_ids: [],
}

function PeminjamanFormFields({
  form,
  onChange,
  onAddEksemplar,
  onRemoveEksemplar,
  anggotaOptions,
  eksemplarOptions,
}: {
  form: PeminjamanFormData
  onChange: (k: keyof PeminjamanFormData, v: string) => void
  onAddEksemplar: (id: string) => void
  onRemoveEksemplar: (id: string) => void
  anggotaOptions: { id: string; siswa_nama: string }[]
  eksemplarOptions: { id: string; kode_eksemplar: string; judul_buku?: string }[]
}) {
  return (
    <div className={styles.fields}>
      <div className={styles.fieldGroup}>
        <label className={styles.label}>Anggota <span className={styles.required}>*</span></label>
        <select
          className={styles.select}
          value={form.anggota_id}
          onChange={(e) => {
            const opt = anggotaOptions.find((a) => a.id === e.target.value)
            onChange('anggota_id', e.target.value)
            if (opt) onChange('anggota_nama', opt.siswa_nama)
          }}
          required
        >
          <option value="">— Pilih Anggota —</option>
          {anggotaOptions.map((a) => (
            <option key={a.id} value={a.id}>{a.siswa_nama}</option>
          ))}
        </select>
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Tanggal Pinjam <span className={styles.required}>*</span></label>
        <input
          className={styles.input}
          type="date"
          value={form.tanggal_pinjam}
          onChange={(e) => onChange('tanggal_pinjam', e.target.value)}
          required
        />
      </div>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Jatuh Tempo <span className={styles.required}>*</span></label>
        <input
          className={styles.input}
          type="date"
          value={form.jatuh_tempo}
          onChange={(e) => onChange('jatuh_tempo', e.target.value)}
          required
        />
      </div>

      <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
        <label className={styles.label}>Eksemplar Buku</label>
        <div className={styles.eksemplarPicker}>
          <select
            className={styles.select}
            onChange={(e) => { if (e.target.value) { onAddEksemplar(e.target.value); e.target.value = '' } }}
          >
            <option value="">+ Tambah eksemplar...</option>
            {eksemplarOptions
              .filter((e) => !form.eksemplar_ids.includes(e.id))
              .map((e) => (
                <option key={e.id} value={e.id}>{e.kode_eksemplar}</option>
              ))
            }
          </select>
          {form.eksemplar_ids.length > 0 && (
            <div className={styles.eksemplarList}>
              {form.eksemplar_ids.map((eksId) => {
                const eks = eksemplarOptions.find((e) => e.id === eksId)
                return (
                  <div key={eksId} className={styles.eksemplarItem}>
                    <span>{eks?.kode_eksemplar ?? eksId}</span>
                    <button type="button" onClick={() => onRemoveEksemplar(eksId)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function PeminjamanFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [form, setForm] = useState<PeminjamanFormData>(EMPTY)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: peminjaman } = useQuery({
    queryKey: ['peminjaman-buku', id],
    queryFn: () => peminjamanService.getById(id!),
    enabled: isEdit,
  })

  const { data: anggotaRes } = useQuery({
    queryKey: ['anggota-perpustakaan'],
    queryFn: () => anggotaPerpustakaanService.list({ limit: 500 }),
  })

  const { data: eksemplarRes } = useQuery({
    queryKey: ['eksemplar-tersedia'],
    queryFn: () => eksemplarService.list({ status: 'Tersedia', limit: 500 }),
  })

  const anggotaOptions = anggotaRes?.items ?? []
  const eksemplarOptions = eksemplarRes?.items ?? []

  useEffect(() => {
    if (peminjaman) {
      setForm({
        anggota_id: peminjaman.anggota_id,
        anggota_nama: peminjaman.anggota_nama,
        tanggal_pinjam: peminjaman.tanggal_pinjam,
        jatuh_tempo: peminjaman.jatuh_tempo,
        eksemplar_ids: peminjaman.items.map((i) => i.eksemplar_id),
      })
    }
  }, [peminjaman])

  function handleChange(k: keyof PeminjamanFormData, v: string) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  function handleAddEksemplar(eksId: string) {
    setForm((p) => ({ ...p, eksemplar_ids: [...p.eksemplar_ids, eksId] }))
  }

  function handleRemoveEksemplar(eksId: string) {
    setForm((p) => ({ ...p, eksemplar_ids: p.eksemplar_ids.filter((e) => e !== eksId) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      if (isEdit) {
        await peminjamanService.update(id!, form as Partial<PeminjamanBuku>)
        await queryClient.invalidateQueries({ queryKey: ['peminjaman-buku'] })
        toast.success('Data peminjaman berhasil diperbarui')
        navigate(`/sekolah/perpustakaan/peminjaman/${id}`)
      } else {
        const created = await peminjamanService.create(form as Partial<PeminjamanBuku>)
        await queryClient.invalidateQueries({ queryKey: ['peminjaman-buku'] })
        toast.success('Peminjaman berhasil dibuat')
        navigate(`/sekolah/perpustakaan/peminjaman/${(created as PeminjamanBuku).id}`)
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal menyimpan peminjaman')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Peminjaman' : 'Buat Peminjaman'}
      onBack={() => navigate(isEdit ? `/sekolah/perpustakaan/peminjaman/${id}` : '/sekolah/perpustakaan/peminjaman')}
      backLabel="Peminjaman Buku"
      tabs={[{
        id: 'form',
        label: 'Data Peminjaman',
        content: (
          <PeminjamanFormFields
            form={form}
            onChange={handleChange}
            onAddEksemplar={handleAddEksemplar}
            onRemoveEksemplar={handleRemoveEksemplar}
            anggotaOptions={anggotaOptions}
            eksemplarOptions={eksemplarOptions}
          />
        ),
      }]}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/sekolah/perpustakaan/peminjaman')}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Perbarui' : 'Buat Peminjaman'}
      serverError={serverError}
    />
  )
}
```

- [ ] Create `src/pages/sekolah/perpustakaan/PeminjamanFormPage.module.css`

```css
/* PeminjamanFormPage.module.css */

.fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem 2rem;
  padding: 1.5rem;
}

.fullWidth { grid-column: 1 / -1; }

.fieldGroup {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.label { font-size: 0.8125rem; font-weight: 600; color: var(--color-text-secondary); }
.required { color: var(--color-danger); margin-left: 0.125rem; }

.input,
.select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  background: var(--color-surface);
  width: 100%;
  box-sizing: border-box;
}

.input:focus, .select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha, rgba(59,130,246,0.12));
}

.eksemplarPicker {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.eksemplarList {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.eksemplarItem {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  background: var(--color-primary-alpha, rgba(59,130,246,0.1));
  border: 1px solid var(--color-primary);
  border-radius: 100px;
  font-size: 0.8125rem;
  color: var(--color-primary);
}

.eksemplarItem button {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--color-danger);
  padding: 0;
}
```

---

### Task 4.8 — Pengembalian Buku: ListPage + FormPage

- [ ] Create `src/pages/sekolah/perpustakaan/PengembalianListPage.tsx`

```tsx
// src/pages/sekolah/perpustakaan/PengembalianListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { pengembalianService } from '@/services/sekolah/perpustakaan.service'
import type { PengembalianBuku } from '@/types/sekolah/perpustakaan.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const COLUMNS: ColumnDef<PengembalianBuku>[] = [
  { key: 'nomor_peminjaman', label: 'Ref Peminjaman', sortable: true },
  { key: 'anggota_nama', label: 'Anggota', sortable: true },
  { key: 'tanggal_kembali_aktual', label: 'Tanggal Kembali', sortable: true },
  {
    key: 'keterlambatan_hari',
    label: 'Keterlambatan',
    render: (row) => (
      <span style={{ color: row.keterlambatan_hari > 0 ? 'var(--color-danger)' : 'inherit' }}>
        {row.keterlambatan_hari > 0 ? `${row.keterlambatan_hari} hari` : 'Tepat waktu'}
      </span>
    ),
  },
  {
    key: 'denda_total',
    label: 'Denda',
    render: (row) => (
      row.denda_total > 0
        ? <span style={{ color: 'var(--color-danger)' }}>Rp {row.denda_total.toLocaleString('id-ID')}</span>
        : <span>—</span>
    ),
  },
]

export function PengembalianListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<PengembalianBuku>
      title="Pengembalian Buku"
      queryKey="pengembalian-buku"
      fetcher={pengembalianService.list}
      columns={COLUMNS}
      addLabel="Catat Pengembalian"
      onAdd={() => navigate('/sekolah/perpustakaan/pengembalian/new')}
      onRowClick={(row) => navigate(`/sekolah/perpustakaan/pengembalian/${row.id}/edit`)}
      searchPlaceholder="Cari ref peminjaman atau anggota..."
      exportFilename="pengembalian-buku"
      defaultSort={{ key: 'tanggal_kembali_aktual', order: 'desc' }}
    />
  )
}
```

- [ ] Create `src/pages/sekolah/perpustakaan/PengembalianFormPage.tsx`

```tsx
// src/pages/sekolah/perpustakaan/PengembalianFormPage.tsx

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { pengembalianService, peminjamanService } from '@/services/sekolah/perpustakaan.service'
import { toast } from '@/widgets/Toast/Toast'
import type { PengembalianBuku } from '@/types/sekolah/perpustakaan.types'
import styles from './BukuFormPage.module.css'

interface FormData {
  peminjaman_id: string
  tanggal_kembali_aktual: string
}

const EMPTY: FormData = {
  peminjaman_id: '',
  tanggal_kembali_aktual: new Date().toISOString().split('T')[0],
}

export function PengembalianFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [form, setForm] = useState<FormData>(EMPTY)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: pengembalian } = useQuery({
    queryKey: ['pengembalian-buku', id],
    queryFn: () => pengembalianService.getById(id!),
    enabled: isEdit,
  })

  // Only show active/terlambat peminjaman (not yet returned)
  const { data: peminjamanRes } = useQuery({
    queryKey: ['peminjaman-aktif'],
    queryFn: () => peminjamanService.list({ status: 'Aktif', limit: 500 }),
    enabled: !isEdit,
  })
  const peminjamanOptions = peminjamanRes?.items ?? []

  useEffect(() => {
    if (pengembalian) {
      setForm({
        peminjaman_id: pengembalian.peminjaman_id,
        tanggal_kembali_aktual: pengembalian.tanggal_kembali_aktual,
      })
    }
  }, [pengembalian])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      if (isEdit) {
        await pengembalianService.update(id!, form as Partial<PengembalianBuku>)
        toast.success('Data pengembalian berhasil diperbarui')
      } else {
        await pengembalianService.create(form as Partial<PengembalianBuku>)
        toast.success('Pengembalian berhasil dicatat')
      }
      await queryClient.invalidateQueries({ queryKey: ['pengembalian-buku'] })
      await queryClient.invalidateQueries({ queryKey: ['peminjaman-buku'] })
      navigate('/sekolah/perpustakaan/pengembalian')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal menyimpan pengembalian')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Pengembalian' : 'Catat Pengembalian'}
      onBack={() => navigate('/sekolah/perpustakaan/pengembalian')}
      backLabel="Pengembalian Buku"
      tabs={[{
        id: 'form',
        label: 'Data Pengembalian',
        content: (
          <div className={styles.fields}>
            {!isEdit && (
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Peminjaman <span className={styles.required}>*</span></label>
                <select
                  className={styles.select}
                  value={form.peminjaman_id}
                  onChange={(e) => setForm((p) => ({ ...p, peminjaman_id: e.target.value }))}
                  required
                >
                  <option value="">— Pilih Peminjaman —</option>
                  {peminjamanOptions.map((p) => (
                    <option key={p.id} value={p.id}>{p.nomor} — {p.anggota_nama}</option>
                  ))}
                </select>
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Tanggal Kembali Aktual <span className={styles.required}>*</span></label>
              <input
                className={styles.input}
                type="date"
                value={form.tanggal_kembali_aktual}
                onChange={(e) => setForm((p) => ({ ...p, tanggal_kembali_aktual: e.target.value }))}
                required
              />
            </div>

            <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: 0 }}>
                Denda keterlambatan akan dihitung otomatis oleh server berdasarkan tanggal jatuh tempo peminjaman dan tarif denda dari Pengaturan Perpustakaan.
              </p>
            </div>
          </div>
        ),
      }]}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/sekolah/perpustakaan/pengembalian')}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Perbarui' : 'Catat Pengembalian'}
      serverError={serverError}
    />
  )
}
```

---

### Task 4.9 — Denda Perpustakaan: ListPage (read-mostly)

- [ ] Create `src/pages/sekolah/perpustakaan/DendaListPage.tsx`

```tsx
// src/pages/sekolah/perpustakaan/DendaListPage.tsx

import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { dendaService } from '@/services/sekolah/perpustakaan.service'
import type { DendaPerpustakaan } from '@/types/sekolah/perpustakaan.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const COLUMNS: ColumnDef<DendaPerpustakaan>[] = [
  { key: 'anggota_nama', label: 'Anggota', sortable: true },
  { key: 'nomor_peminjaman', label: 'Ref Peminjaman' },
  {
    key: 'jumlah_denda',
    label: 'Jumlah Denda',
    render: (row) => `Rp ${row.jumlah_denda.toLocaleString('id-ID')}`,
  },
  {
    key: 'status_lunas',
    label: 'Status',
    render: (row) => (
      <span style={{ color: row.status_lunas ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
        {row.status_lunas ? 'Lunas' : 'Belum Lunas'}
      </span>
    ),
  },
  { key: 'tanggal_lunas', label: 'Tanggal Lunas', render: (row) => row.tanggal_lunas ?? '—' },
]

export function DendaListPage() {
  return (
    <ListPageTemplate<DendaPerpustakaan>
      title="Denda Perpustakaan"
      queryKey="denda-perpustakaan"
      fetcher={dendaService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari anggota atau peminjaman..."
      exportFilename="denda-perpustakaan"
      readonly
      helpTitle="Denda Perpustakaan"
      helpText="Denda dibuat otomatis saat pengembalian terlambat. Tandai lunas melalui menu aksi di baris yang bersangkutan."
    />
  )
}
```

---

### Task 4.10 — Reservasi Buku: ListPage + FormPage

- [ ] Create `src/pages/sekolah/perpustakaan/ReservasiListPage.tsx`

```tsx
// src/pages/sekolah/perpustakaan/ReservasiListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { reservasiService } from '@/services/sekolah/perpustakaan.service'
import type { ReservasiBuku } from '@/types/sekolah/perpustakaan.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const STATUS_COLOR: Record<string, string> = {
  Menunggu: 'var(--color-warning)',
  Aktif: 'var(--color-info)',
  Selesai: 'var(--color-success)',
  Dibatalkan: 'var(--color-text-secondary)',
}

const COLUMNS: ColumnDef<ReservasiBuku>[] = [
  { key: 'judul_buku', label: 'Buku', sortable: true },
  { key: 'anggota_nama', label: 'Anggota', sortable: true },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <span style={{ color: STATUS_COLOR[row.status] ?? 'inherit', fontWeight: 600 }}>{row.status}</span>
    ),
  },
  { key: 'tanggal_reservasi', label: 'Tanggal Reservasi', sortable: true },
]

export function ReservasiListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<ReservasiBuku>
      title="Reservasi Buku"
      queryKey="reservasi-buku"
      fetcher={reservasiService.list}
      columns={COLUMNS}
      addLabel="Buat Reservasi"
      onAdd={() => navigate('/sekolah/perpustakaan/reservasi/new')}
      onRowClick={(row) => navigate(`/sekolah/perpustakaan/reservasi/${row.id}/edit`)}
      searchPlaceholder="Cari buku atau anggota..."
      exportFilename="reservasi-buku"
      deleteConfig={{
        onDelete: (row) => reservasiService.delete(row.id),
        dialogTitle: 'Batalkan Reservasi?',
        dialogBody: (row) => `Reservasi buku "${row.judul_buku}" oleh ${row.anggota_nama} akan dihapus.`,
        successMessage: (row) => `Reservasi "${row.judul_buku}" berhasil dibatalkan.`,
      }}
    />
  )
}
```

- [ ] Create `src/pages/sekolah/perpustakaan/ReservasiFormPage.tsx`

```tsx
// src/pages/sekolah/perpustakaan/ReservasiFormPage.tsx

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { reservasiService, bukuService, anggotaPerpustakaanService } from '@/services/sekolah/perpustakaan.service'
import { toast } from '@/widgets/Toast/Toast'
import type { ReservasiBuku } from '@/types/sekolah/perpustakaan.types'
import styles from './BukuFormPage.module.css'

interface FormData { buku_id: string; anggota_id: string }
const EMPTY: FormData = { buku_id: '', anggota_id: '' }

export function ReservasiFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [form, setForm] = useState<FormData>(EMPTY)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: reservasi } = useQuery({
    queryKey: ['reservasi-buku', id],
    queryFn: () => reservasiService.getById(id!),
    enabled: isEdit,
  })

  const { data: bukuRes } = useQuery({
    queryKey: ['perpustakaan-buku'],
    queryFn: () => bukuService.list({ limit: 500 }),
  })

  const { data: anggotaRes } = useQuery({
    queryKey: ['anggota-perpustakaan'],
    queryFn: () => anggotaPerpustakaanService.list({ limit: 500 }),
  })

  const bukuOptions = bukuRes?.items ?? []
  const anggotaOptions = anggotaRes?.items ?? []

  useEffect(() => {
    if (reservasi) setForm({ buku_id: reservasi.buku_id, anggota_id: reservasi.anggota_id })
  }, [reservasi])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      if (isEdit) {
        await reservasiService.update(id!, form as Partial<ReservasiBuku>)
        toast.success('Reservasi berhasil diperbarui')
      } else {
        await reservasiService.create(form as Partial<ReservasiBuku>)
        toast.success('Reservasi berhasil dibuat')
      }
      await queryClient.invalidateQueries({ queryKey: ['reservasi-buku'] })
      navigate('/sekolah/perpustakaan/reservasi')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal menyimpan reservasi')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Reservasi' : 'Buat Reservasi'}
      onBack={() => navigate('/sekolah/perpustakaan/reservasi')}
      backLabel="Reservasi Buku"
      tabs={[{
        id: 'form',
        label: 'Data Reservasi',
        content: (
          <div className={styles.fields}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Buku <span className={styles.required}>*</span></label>
              <select
                className={styles.select}
                value={form.buku_id}
                onChange={(e) => setForm((p) => ({ ...p, buku_id: e.target.value }))}
                required
              >
                <option value="">— Pilih Buku —</option>
                {bukuOptions.map((b) => (
                  <option key={b.id} value={b.id}>{b.judul}</option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Anggota <span className={styles.required}>*</span></label>
              <select
                className={styles.select}
                value={form.anggota_id}
                onChange={(e) => setForm((p) => ({ ...p, anggota_id: e.target.value }))}
                required
              >
                <option value="">— Pilih Anggota —</option>
                {anggotaOptions.map((a) => (
                  <option key={a.id} value={a.id}>{a.siswa_nama}</option>
                ))}
              </select>
            </div>
          </div>
        ),
      }]}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/sekolah/perpustakaan/reservasi')}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Perbarui' : 'Buat Reservasi'}
      serverError={serverError}
    />
  )
}
```

---

### Task 4.11 — Routes: Perpustakaan (add to `src/app/routes.sekolah.tsx`)

- [ ] Add Perpustakaan routes to the sekolah routes file

```tsx
// Add to src/app/routes.sekolah.tsx — inside the /sekolah route group

// Perpustakaan
{ path: 'perpustakaan/buku',              element: <BukuListPage /> },
{ path: 'perpustakaan/buku/new',          element: <BukuFormPage /> },
{ path: 'perpustakaan/buku/:id',          element: <BukuDetailPage /> },
{ path: 'perpustakaan/buku/:id/edit',     element: <BukuFormPage /> },
{ path: 'perpustakaan/anggota',           element: <AnggotaPerpustakaanListPage /> },
{ path: 'perpustakaan/anggota/new',       element: <AnggotaPerpustakaanFormPage /> },
{ path: 'perpustakaan/anggota/:id/edit',  element: <AnggotaPerpustakaanFormPage /> },
{ path: 'perpustakaan/peminjaman',        element: <PeminjamanListPage /> },
{ path: 'perpustakaan/peminjaman/new',    element: <PeminjamanFormPage /> },
{ path: 'perpustakaan/peminjaman/:id',    element: <PeminjamanDetailPage /> },
{ path: 'perpustakaan/peminjaman/:id/edit', element: <PeminjamanFormPage /> },
{ path: 'perpustakaan/pengembalian',      element: <PengembalianListPage /> },
{ path: 'perpustakaan/pengembalian/new',  element: <PengembalianFormPage /> },
{ path: 'perpustakaan/pengembalian/:id/edit', element: <PengembalianFormPage /> },
{ path: 'perpustakaan/denda',             element: <DendaListPage /> },
{ path: 'perpustakaan/reservasi',         element: <ReservasiListPage /> },
{ path: 'perpustakaan/reservasi/new',     element: <ReservasiFormPage /> },
{ path: 'perpustakaan/reservasi/:id/edit', element: <ReservasiFormPage /> },
```

---

### Task 4.12 — AppSubNav: Perpustakaan entries (add to `subnav.config.ts`)

- [ ] Add perpustakaan submenu to the subnav config

```ts
// Add to SUBNAV_CONFIG.sekolah in src/layouts/AppSubNav/subnav.config.ts

perpustakaan: [
  { key: 'buku',        label: 'Katalog Buku',  path: '/sekolah/perpustakaan/buku' },
  { key: 'anggota',     label: 'Anggota',        path: '/sekolah/perpustakaan/anggota' },
  { key: 'peminjaman',  label: 'Peminjaman',     path: '/sekolah/perpustakaan/peminjaman' },
  { key: 'pengembalian',label: 'Pengembalian',   path: '/sekolah/perpustakaan/pengembalian' },
  { key: 'denda',       label: 'Denda',          path: '/sekolah/perpustakaan/denda' },
  { key: 'reservasi',   label: 'Reservasi',      path: '/sekolah/perpustakaan/reservasi' },
],
```

---

## Phase 5: Pengaturan Sekolah Module

### Task 5.1 — Types: `src/types/sekolah/pengaturan.types.ts`

- [ ] Create file with all Pengaturan entity types

```ts
// src/types/sekolah/pengaturan.types.ts

export interface Sekolah {
  id: string
  nama: string
  npsn: string
  alamat: string
  kota?: string
  provinsi?: string
  telepon?: string
  email?: string
  website?: string
  kepala_sekolah: string
  logo?: string
  updated_at: string
}

export interface TahunAjaran {
  id: string
  periode: string    // e.g. "2024/2025"
  status_aktif: boolean
  created_at: string
}

export interface SemesterTahunAjaran {
  id: string
  semester: 'Ganjil' | 'Genap'
  tahun_ajaran_id: string
  tahun_ajaran_periode: string
  status_aktif: boolean
}

export type NamaModul = 'Akademik' | 'Perpustakaan' | 'Koperasi' | 'Absensi' | 'Raport'

export interface ModulAktif {
  id: string
  akademik: boolean
  perpustakaan: boolean
  koperasi: boolean
  absensi: boolean
  raport: boolean
  updated_at: string
}
```

---

### Task 5.2 — Service: `src/services/sekolah/pengaturan.service.ts`

- [ ] Create service file for Pengaturan entities

```ts
// src/services/sekolah/pengaturan.service.ts

import { createEntityService } from '@/services/createEntityService'
import { apiClient } from '@/services/api.client'
import type { Sekolah, TahunAjaran, SemesterTahunAjaran, ModulAktif } from '@/types/sekolah/pengaturan.types'

const BASE = '/api/method/sekolahpro.pengaturan.api'

export const tahunAjaranService = createEntityService<TahunAjaran>(`${BASE}.tahun_ajaran`)
export const semesterService = createEntityService<SemesterTahunAjaran>(`${BASE}.semester_tahun_ajaran`)

/** Single doctype — GET returns one object, no list */
export async function getSekolah(): Promise<Sekolah> {
  return apiClient.get<Sekolah>(`${BASE}.sekolah`)
}

export async function updateSekolah(data: Partial<Sekolah>): Promise<Sekolah> {
  return apiClient.put<Sekolah>(`${BASE}.sekolah`, data)
}

/** Single doctype for module toggles */
export async function getModulAktif(): Promise<ModulAktif> {
  return apiClient.get<ModulAktif>(`${BASE}.modul_aktif`)
}

export async function updateModulAktif(data: Partial<ModulAktif>): Promise<ModulAktif> {
  return apiClient.put<ModulAktif>(`${BASE}.modul_aktif`, data)
}
```

---

### Task 5.3 — Sekolah Settings: Single doctype FormPage

- [ ] Create `src/pages/sekolah/pengaturan/SekolahSettingsPage.tsx`

```tsx
// src/pages/sekolah/pengaturan/SekolahSettingsPage.tsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { getSekolah, updateSekolah } from '@/services/sekolah/pengaturan.service'
import { toast } from '@/widgets/Toast/Toast'
import type { Sekolah } from '@/types/sekolah/pengaturan.types'
import styles from './PengaturanForm.module.css'

type SekolahForm = Pick<Sekolah, 'nama' | 'npsn' | 'alamat' | 'kota' | 'provinsi' | 'telepon' | 'email' | 'website' | 'kepala_sekolah'>

const EMPTY: SekolahForm = {
  nama: '', npsn: '', alamat: '', kota: '', provinsi: '', telepon: '', email: '', website: '', kepala_sekolah: '',
}

function SekolahFormFields({ form, onChange }: { form: SekolahForm; onChange: (k: keyof SekolahForm, v: string) => void }) {
  const field = (key: keyof SekolahForm, label: string, required = false, type = 'text') => (
    <div className={styles.fieldGroup}>
      <label className={styles.label} htmlFor={key}>
        {label}{required && <span className={styles.required}> *</span>}
      </label>
      <input
        id={key}
        className={styles.input}
        type={type}
        value={form[key] ?? ''}
        onChange={(e) => onChange(key, e.target.value)}
        required={required}
      />
    </div>
  )

  return (
    <div className={styles.fields}>
      {field('nama', 'Nama Sekolah', true)}
      {field('npsn', 'NPSN', true)}
      {field('kepala_sekolah', 'Kepala Sekolah', true)}
      {field('telepon', 'Telepon', false, 'tel')}
      {field('email', 'Email', false, 'email')}
      {field('website', 'Website', false, 'url')}
      <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
        <label className={styles.label} htmlFor="alamat">Alamat <span className={styles.required}>*</span></label>
        <textarea
          id="alamat"
          className={styles.textarea}
          value={form.alamat}
          onChange={(e) => onChange('alamat', e.target.value)}
          rows={3}
          required
        />
      </div>
      {field('kota', 'Kota/Kabupaten')}
      {field('provinsi', 'Provinsi')}
    </div>
  )
}

export function SekolahSettingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<SekolahForm>(EMPTY)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: sekolah, isLoading } = useQuery({
    queryKey: ['sekolah-settings'],
    queryFn: getSekolah,
  })

  useEffect(() => {
    if (sekolah) {
      setForm({
        nama: sekolah.nama,
        npsn: sekolah.npsn,
        alamat: sekolah.alamat,
        kota: sekolah.kota ?? '',
        provinsi: sekolah.provinsi ?? '',
        telepon: sekolah.telepon ?? '',
        email: sekolah.email ?? '',
        website: sekolah.website ?? '',
        kepala_sekolah: sekolah.kepala_sekolah,
      })
    }
  }, [sekolah])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      await updateSekolah(form)
      await queryClient.invalidateQueries({ queryKey: ['sekolah-settings'] })
      toast.success('Data sekolah berhasil disimpan')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal menyimpan data sekolah')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <p>Memuat data sekolah...</p>

  return (
    <FormPageTemplate
      title="Profil Sekolah"
      onBack={() => navigate(-1)}
      backLabel="Pengaturan"
      tabs={[{
        id: 'form',
        label: 'Data Sekolah',
        content: (
          <SekolahFormFields
            form={form}
            onChange={(k, v) => setForm((p) => ({ ...p, [k]: v }))}
          />
        ),
      }]}
      onSubmit={handleSubmit}
      onCancel={() => navigate(-1)}
      isSubmitting={isSubmitting}
      submitLabel="Simpan"
      serverError={serverError}
    />
  )
}
```

---

### Task 5.4 — Tahun Ajaran: ListPage + FormPage

- [ ] Create `src/pages/sekolah/pengaturan/TahunAjaranListPage.tsx`

```tsx
// src/pages/sekolah/pengaturan/TahunAjaranListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { tahunAjaranService } from '@/services/sekolah/pengaturan.service'
import type { TahunAjaran } from '@/types/sekolah/pengaturan.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const COLUMNS: ColumnDef<TahunAjaran>[] = [
  { key: 'periode', label: 'Periode', sortable: true },
  {
    key: 'status_aktif',
    label: 'Status',
    render: (row) => (
      <span style={{
        color: row.status_aktif ? 'var(--color-success)' : 'var(--color-text-secondary)',
        fontWeight: row.status_aktif ? 700 : 400,
      }}>
        {row.status_aktif ? 'Aktif' : 'Tidak Aktif'}
      </span>
    ),
  },
]

export function TahunAjaranListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<TahunAjaran>
      title="Tahun Ajaran"
      queryKey="tahun-ajaran"
      fetcher={tahunAjaranService.list}
      columns={COLUMNS}
      addLabel="Tambah Tahun Ajaran"
      onAdd={() => navigate('/sekolah/pengaturan/tahun-ajaran/new')}
      onRowClick={(row) => navigate(`/sekolah/pengaturan/tahun-ajaran/${row.id}/edit`)}
      searchPlaceholder="Cari periode..."
      deleteConfig={{
        onDelete: (row) => tahunAjaranService.delete(row.id),
        dialogTitle: 'Hapus Tahun Ajaran?',
        dialogBody: (row) => `Tahun ajaran "${row.periode}" akan dihapus. Pastikan tidak ada data terkait.`,
        successMessage: (row) => `Tahun ajaran "${row.periode}" berhasil dihapus.`,
      }}
    />
  )
}
```

- [ ] Create `src/pages/sekolah/pengaturan/TahunAjaranFormPage.tsx`

```tsx
// src/pages/sekolah/pengaturan/TahunAjaranFormPage.tsx

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { tahunAjaranService } from '@/services/sekolah/pengaturan.service'
import { toast } from '@/widgets/Toast/Toast'
import type { TahunAjaran } from '@/types/sekolah/pengaturan.types'
import styles from './PengaturanForm.module.css'

interface FormData { periode: string; status_aktif: boolean }
const EMPTY: FormData = { periode: '', status_aktif: false }

export function TahunAjaranFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [form, setForm] = useState<FormData>(EMPTY)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: tahunAjaran } = useQuery({
    queryKey: ['tahun-ajaran', id],
    queryFn: () => tahunAjaranService.getById(id!),
    enabled: isEdit,
  })

  useEffect(() => {
    if (tahunAjaran) setForm({ periode: tahunAjaran.periode, status_aktif: tahunAjaran.status_aktif })
  }, [tahunAjaran])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      if (isEdit) {
        await tahunAjaranService.update(id!, form as Partial<TahunAjaran>)
        toast.success(`Tahun ajaran "${form.periode}" berhasil diperbarui`)
      } else {
        await tahunAjaranService.create(form as Partial<TahunAjaran>)
        toast.success(`Tahun ajaran "${form.periode}" berhasil ditambahkan`)
      }
      await queryClient.invalidateQueries({ queryKey: ['tahun-ajaran'] })
      navigate('/sekolah/pengaturan/tahun-ajaran')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal menyimpan tahun ajaran')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
      onBack={() => navigate('/sekolah/pengaturan/tahun-ajaran')}
      backLabel="Tahun Ajaran"
      tabs={[{
        id: 'form',
        label: 'Data Tahun Ajaran',
        content: (
          <div className={styles.fields}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="periode">Periode <span className={styles.required}>*</span></label>
              <input
                id="periode"
                className={styles.input}
                value={form.periode}
                onChange={(e) => setForm((p) => ({ ...p, periode: e.target.value }))}
                required
                placeholder="Contoh: 2024/2025"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Status</label>
              <label className={styles.toggleRow}>
                <input
                  type="checkbox"
                  checked={form.status_aktif}
                  onChange={(e) => setForm((p) => ({ ...p, status_aktif: e.target.checked }))}
                />
                <span className={styles.toggleLabel}>{form.status_aktif ? 'Aktif' : 'Tidak Aktif'}</span>
              </label>
            </div>
          </div>
        ),
      }]}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/sekolah/pengaturan/tahun-ajaran')}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Perbarui' : 'Simpan'}
      serverError={serverError}
    />
  )
}
```

---

### Task 5.5 — Semester: ListPage + FormPage

- [ ] Create `src/pages/sekolah/pengaturan/SemesterListPage.tsx`

```tsx
// src/pages/sekolah/pengaturan/SemesterListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { semesterService } from '@/services/sekolah/pengaturan.service'
import type { SemesterTahunAjaran } from '@/types/sekolah/pengaturan.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const COLUMNS: ColumnDef<SemesterTahunAjaran>[] = [
  { key: 'semester', label: 'Semester' },
  { key: 'tahun_ajaran_periode', label: 'Tahun Ajaran', sortable: true },
  {
    key: 'status_aktif',
    label: 'Status',
    render: (row) => (
      <span style={{ color: row.status_aktif ? 'var(--color-success)' : 'var(--color-text-secondary)', fontWeight: row.status_aktif ? 700 : 400 }}>
        {row.status_aktif ? 'Aktif' : 'Tidak Aktif'}
      </span>
    ),
  },
]

export function SemesterListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<SemesterTahunAjaran>
      title="Semester"
      queryKey="semester-tahun-ajaran"
      fetcher={semesterService.list}
      columns={COLUMNS}
      addLabel="Tambah Semester"
      onAdd={() => navigate('/sekolah/pengaturan/semester/new')}
      onRowClick={(row) => navigate(`/sekolah/pengaturan/semester/${row.id}/edit`)}
      deleteConfig={{
        onDelete: (row) => semesterService.delete(row.id),
        dialogTitle: 'Hapus Semester?',
        dialogBody: (row) => `Semester ${row.semester} ${row.tahun_ajaran_periode} akan dihapus.`,
        successMessage: (row) => `Semester ${row.semester} ${row.tahun_ajaran_periode} berhasil dihapus.`,
      }}
    />
  )
}
```

- [ ] Create `src/pages/sekolah/pengaturan/SemesterFormPage.tsx`

```tsx
// src/pages/sekolah/pengaturan/SemesterFormPage.tsx

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { semesterService, tahunAjaranService } from '@/services/sekolah/pengaturan.service'
import { toast } from '@/widgets/Toast/Toast'
import type { SemesterTahunAjaran } from '@/types/sekolah/pengaturan.types'
import styles from './PengaturanForm.module.css'

interface FormData {
  semester: 'Ganjil' | 'Genap'
  tahun_ajaran_id: string
  status_aktif: boolean
}

const EMPTY: FormData = { semester: 'Ganjil', tahun_ajaran_id: '', status_aktif: false }

export function SemesterFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const [form, setForm] = useState<FormData>(EMPTY)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: semester } = useQuery({
    queryKey: ['semester-tahun-ajaran', id],
    queryFn: () => semesterService.getById(id!),
    enabled: isEdit,
  })

  const { data: tahunAjaranRes } = useQuery({
    queryKey: ['tahun-ajaran'],
    queryFn: () => tahunAjaranService.list({ limit: 100 }),
  })
  const tahunAjaranOptions = tahunAjaranRes?.items ?? []

  useEffect(() => {
    if (semester) {
      setForm({
        semester: semester.semester,
        tahun_ajaran_id: semester.tahun_ajaran_id,
        status_aktif: semester.status_aktif,
      })
    }
  }, [semester])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      if (isEdit) {
        await semesterService.update(id!, form as Partial<SemesterTahunAjaran>)
        toast.success('Semester berhasil diperbarui')
      } else {
        await semesterService.create(form as Partial<SemesterTahunAjaran>)
        toast.success('Semester berhasil ditambahkan')
      }
      await queryClient.invalidateQueries({ queryKey: ['semester-tahun-ajaran'] })
      navigate('/sekolah/pengaturan/semester')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal menyimpan semester')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Semester' : 'Tambah Semester'}
      onBack={() => navigate('/sekolah/pengaturan/semester')}
      backLabel="Semester"
      tabs={[{
        id: 'form',
        label: 'Data Semester',
        content: (
          <div className={styles.fields}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Semester <span className={styles.required}>*</span></label>
              <select
                className={styles.select}
                value={form.semester}
                onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value as 'Ganjil' | 'Genap' }))}
                required
              >
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Tahun Ajaran <span className={styles.required}>*</span></label>
              <select
                className={styles.select}
                value={form.tahun_ajaran_id}
                onChange={(e) => setForm((p) => ({ ...p, tahun_ajaran_id: e.target.value }))}
                required
              >
                <option value="">— Pilih Tahun Ajaran —</option>
                {tahunAjaranOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.periode}</option>
                ))}
              </select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Status</label>
              <label className={styles.toggleRow}>
                <input
                  type="checkbox"
                  checked={form.status_aktif}
                  onChange={(e) => setForm((p) => ({ ...p, status_aktif: e.target.checked }))}
                />
                <span className={styles.toggleLabel}>{form.status_aktif ? 'Aktif' : 'Tidak Aktif'}</span>
              </label>
            </div>
          </div>
        ),
      }]}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/sekolah/pengaturan/semester')}
      isSubmitting={isSubmitting}
      submitLabel={isEdit ? 'Perbarui' : 'Simpan'}
      serverError={serverError}
    />
  )
}
```

---

### Task 5.6 — Modul Aktif: Single doctype toggle page

- [ ] Create `src/pages/sekolah/pengaturan/ModulAktifPage.tsx`

```tsx
// src/pages/sekolah/pengaturan/ModulAktifPage.tsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { getModulAktif, updateModulAktif } from '@/services/sekolah/pengaturan.service'
import { toast } from '@/widgets/Toast/Toast'
import type { ModulAktif } from '@/types/sekolah/pengaturan.types'
import styles from './ModulAktifPage.module.css'

type ModulKey = keyof Omit<ModulAktif, 'id' | 'updated_at'>

const MODUL_LIST: { key: ModulKey; label: string; description: string }[] = [
  { key: 'akademik',     label: 'Akademik',     description: 'Jadwal, absensi, penilaian, dan raport siswa' },
  { key: 'perpustakaan', label: 'Perpustakaan', description: 'Katalog buku, peminjaman, dan sirkulasi perpustakaan' },
  { key: 'koperasi',     label: 'Koperasi',     description: 'Simpanan, pembiayaan, dan kartu anggota koperasi' },
  { key: 'absensi',      label: 'Absensi',      description: 'Rekap dan laporan absensi siswa dan guru' },
  { key: 'raport',       label: 'Raport',       description: 'Cetak dan distribusi raport per semester' },
]

export function ModulAktifPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<Partial<ModulAktif>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | undefined>()

  const { data: modulAktif, isLoading } = useQuery({
    queryKey: ['modul-aktif'],
    queryFn: getModulAktif,
  })

  useEffect(() => {
    if (modulAktif) setForm(modulAktif)
  }, [modulAktif])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(undefined)
    try {
      await updateModulAktif(form)
      await queryClient.invalidateQueries({ queryKey: ['modul-aktif'] })
      toast.success('Pengaturan modul berhasil disimpan')
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Gagal menyimpan pengaturan modul')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <p>Memuat pengaturan modul...</p>

  return (
    <FormPageTemplate
      title="Modul Aktif"
      onBack={() => navigate(-1)}
      backLabel="Pengaturan"
      tabs={[{
        id: 'form',
        label: 'Pengaturan Modul',
        content: (
          <div className={styles.modulList}>
            {MODUL_LIST.map(({ key, label, description }) => (
              <div key={key} className={styles.modulRow}>
                <div className={styles.modulInfo}>
                  <span className={styles.modulLabel}>{label}</span>
                  <span className={styles.modulDesc}>{description}</span>
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={!!(form as Record<string, unknown>)[key]}
                    onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
            ))}
          </div>
        ),
      }]}
      onSubmit={handleSubmit}
      onCancel={() => navigate(-1)}
      isSubmitting={isSubmitting}
      submitLabel="Simpan Pengaturan"
      serverError={serverError}
    />
  )
}
```

- [ ] Create `src/pages/sekolah/pengaturan/ModulAktifPage.module.css`

```css
/* ModulAktifPage.module.css */

.modulList {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  gap: 0;
}

.modulRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid var(--color-border);
}

.modulRow:last-child {
  border-bottom: none;
}

.modulInfo {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.modulLabel {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.modulDesc {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
}

/* Toggle switch */
.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.toggleInput {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}

.toggleSlider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: var(--color-border);
  border-radius: 100px;
  transition: background 0.2s;
}

.toggleSlider::before {
  content: '';
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  top: 3px;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggleInput:checked + .toggleSlider {
  background: var(--color-primary);
}

.toggleInput:checked + .toggleSlider::before {
  transform: translateX(20px);
}
```

---

### Task 5.7 — Shared CSS: `src/pages/sekolah/pengaturan/PengaturanForm.module.css`

- [ ] Create shared CSS for Pengaturan form pages

```css
/* PengaturanForm.module.css */

.fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem 2rem;
  padding: 1.5rem;
}

.fullWidth {
  grid-column: 1 / -1;
}

.fieldGroup {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.required {
  color: var(--color-danger);
}

.input,
.select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  background: var(--color-surface);
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.input:focus,
.select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha, rgba(59,130,246,0.12));
}

.textarea {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  background: var(--color-surface);
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
  min-height: 80px;
  transition: border-color 0.15s;
}

.textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-alpha, rgba(59,130,246,0.12));
}

.toggleRow {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.375rem 0;
}

.toggleRow input[type="checkbox"] {
  width: 1rem;
  height: 1rem;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.toggleLabel {
  font-size: 0.9375rem;
  color: var(--color-text-primary);
}
```

---

### Task 5.8 — Routes: Pengaturan (add to `src/app/routes.sekolah.tsx`)

- [ ] Add Pengaturan routes to the sekolah routes file

```tsx
// Add to src/app/routes.sekolah.tsx — inside the /sekolah route group

// Pengaturan
{ path: 'pengaturan/sekolah',                      element: <SekolahSettingsPage /> },
{ path: 'pengaturan/tahun-ajaran',                 element: <TahunAjaranListPage /> },
{ path: 'pengaturan/tahun-ajaran/new',             element: <TahunAjaranFormPage /> },
{ path: 'pengaturan/tahun-ajaran/:id/edit',        element: <TahunAjaranFormPage /> },
{ path: 'pengaturan/semester',                     element: <SemesterListPage /> },
{ path: 'pengaturan/semester/new',                 element: <SemesterFormPage /> },
{ path: 'pengaturan/semester/:id/edit',            element: <SemesterFormPage /> },
{ path: 'pengaturan/modul-aktif',                  element: <ModulAktifPage /> },
```

---

### Task 5.9 — AppSubNav: Pengaturan entries (add to `subnav.config.ts`)

- [ ] Add pengaturan submenu to the subnav config

```ts
// Add to SUBNAV_CONFIG.sekolah in src/layouts/AppSubNav/subnav.config.ts

pengaturan: [
  { key: 'sekolah',      label: 'Sekolah',       path: '/sekolah/pengaturan/sekolah' },
  { key: 'tahun-ajaran', label: 'Tahun Ajaran',   path: '/sekolah/pengaturan/tahun-ajaran' },
  { key: 'semester',     label: 'Semester',       path: '/sekolah/pengaturan/semester' },
  { key: 'modul-aktif',  label: 'Modul Aktif',    path: '/sekolah/pengaturan/modul-aktif' },
],
```

---

## File Summary

### New files — Phase 4 (Perpustakaan)

| File | Description |
|------|-------------|
| `src/types/sekolah/perpustakaan.types.ts` | All Perpustakaan entity types |
| `src/services/sekolah/perpustakaan.service.ts` | Services for all Perpustakaan entities |
| `src/pages/sekolah/perpustakaan/BukuListPage.tsx` | Buku list |
| `src/pages/sekolah/perpustakaan/BukuDetailPage.tsx` | Buku simple detail (2 tabs) |
| `src/pages/sekolah/perpustakaan/BukuDetailPage.module.css` | Shared detail CSS |
| `src/pages/sekolah/perpustakaan/BukuFormPage.tsx` | Buku create/edit form |
| `src/pages/sekolah/perpustakaan/BukuFormPage.module.css` | Shared form field CSS |
| `src/pages/sekolah/perpustakaan/AnggotaPerpustakaanListPage.tsx` | Anggota list |
| `src/pages/sekolah/perpustakaan/AnggotaPerpustakaanFormPage.tsx` | Anggota form |
| `src/pages/sekolah/perpustakaan/PeminjamanListPage.tsx` | Peminjaman list |
| `src/pages/sekolah/perpustakaan/PeminjamanDetailPage.tsx` | Peminjaman simple detail (2 tabs) |
| `src/pages/sekolah/perpustakaan/PeminjamanFormPage.tsx` | Peminjaman form with multi-eksemplar |
| `src/pages/sekolah/perpustakaan/PeminjamanFormPage.module.css` | Eksemplar chip picker CSS |
| `src/pages/sekolah/perpustakaan/PengembalianListPage.tsx` | Pengembalian list |
| `src/pages/sekolah/perpustakaan/PengembalianFormPage.tsx` | Pengembalian form |
| `src/pages/sekolah/perpustakaan/DendaListPage.tsx` | Denda list (read-only) |
| `src/pages/sekolah/perpustakaan/ReservasiListPage.tsx` | Reservasi list |
| `src/pages/sekolah/perpustakaan/ReservasiFormPage.tsx` | Reservasi form |

### New files — Phase 5 (Pengaturan)

| File | Description |
|------|-------------|
| `src/types/sekolah/pengaturan.types.ts` | All Pengaturan entity types |
| `src/services/sekolah/pengaturan.service.ts` | Services + single-doctype helpers |
| `src/pages/sekolah/pengaturan/SekolahSettingsPage.tsx` | Sekolah single-doctype form |
| `src/pages/sekolah/pengaturan/TahunAjaranListPage.tsx` | Tahun ajaran list |
| `src/pages/sekolah/pengaturan/TahunAjaranFormPage.tsx` | Tahun ajaran form |
| `src/pages/sekolah/pengaturan/SemesterListPage.tsx` | Semester list |
| `src/pages/sekolah/pengaturan/SemesterFormPage.tsx` | Semester form |
| `src/pages/sekolah/pengaturan/ModulAktifPage.tsx` | Modul aktif toggle page |
| `src/pages/sekolah/pengaturan/ModulAktifPage.module.css` | Toggle switch CSS |
| `src/pages/sekolah/pengaturan/PengaturanForm.module.css` | Shared form CSS |

### Modified files

| File | Change |
|------|--------|
| `src/app/routes.sekolah.tsx` | Add 19 Perpustakaan routes + 8 Pengaturan routes |
| `src/layouts/AppSubNav/subnav.config.ts` | Add `perpustakaan` + `pengaturan` subnavs |

---

## Implementation Notes

1. **Single doctype pattern** — `SekolahSettingsPage` and `ModulAktifPage` call `getSekolah()`/`getModulAktif()` (direct GET, no list) and save with `updateSekolah()`/`updateModulAktif()` (PUT). No `id` param in the URL.

2. **Denda is read-only in the UI** — denda records are created by the server (Frappe hook) on pengembalian. The `DendaListPage` uses `readonly` prop on `ListPageTemplate` to hide the Add button and delete row action.

3. **Pengembalian auto-calculates denda** — the form only asks for `peminjaman_id` and `tanggal_kembali_aktual`. The server computes `keterlambatan_hari` and `denda_total` via `utils/perpustakaan.py::hitung_keterlambatan`.

4. **BukuFormPage.module.css is reused** — `AnggotaPerpustakaanFormPage`, `PengembalianFormPage`, and `ReservasiFormPage` all import `./BukuFormPage.module.css` for the shared field grid pattern. This is intentional to avoid duplication.

5. **Eksemplar multi-select in PeminjamanFormPage** — uses a `<select onChange>` to append one eksemplar at a time, rendered as removable chips. Filters out already-selected eksemplar from the dropdown.

6. **Query key conventions** used in this plan:
   - `perpustakaan-buku` — buku list
   - `buku` — buku detail (with id)
   - `eksemplar-by-buku` — eksemplar filtered by buku
   - `peminjaman-history-buku` — peminjaman for a specific buku
   - `anggota-perpustakaan` — anggota list
   - `peminjaman-buku` — peminjaman list/detail
   - `peminjaman-aktif` — active peminjaman (for pengembalian form)
   - `pengembalian-buku` — pengembalian list
   - `denda-perpustakaan` — denda list
   - `reservasi-buku` — reservasi list
   - `kategori-buku` — kategori for buku form select
   - `eksemplar-tersedia` — available eksemplar for peminjaman form
   - `sekolah-settings` — single doctype sekolah
   - `tahun-ajaran` — tahun ajaran list
   - `semester-tahun-ajaran` — semester list
   - `modul-aktif` — single doctype modul aktif
