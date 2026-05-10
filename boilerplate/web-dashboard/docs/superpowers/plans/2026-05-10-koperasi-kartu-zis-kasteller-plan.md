# Koperasi — Kartu, ZIS, Kas Teller, Laporan & Pengaturan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all remaining Koperasi modules — Kartu (Kartu/Terminal/Merchant), ZIS (Penerimaan/Program/Penyaluran/Aset Wakaf), Kas Teller (Sesi), Laporan (export filter), and Pengaturan Koperasi (single doctype) — using ListPageTemplate, DetailPageTemplate, and FormPageTemplate.

**Architecture:** Each module follows the spec pattern: Kartu and ZIS entities use Simple Detail (ListPage + DetailPage 2-tab + FormPage), Terminal/Merchant/Penyaluran ZIS/Aset Wakaf use List+Form, Sesi Kas Teller uses Simple Detail 3-tab, Laporan uses a custom filter-export page, and Pengaturan uses FormPageTemplate as a single-doctype editor. Services use `createEntityService` with custom method calls for card history and balance. Types are isolated per module in `src/types/koperasi/`.

**Tech Stack:** React 18, TypeScript, TanStack Query, CSS Modules

**Prerequisite:** infra-plan complete (AppSubNav, routes.koperasi.tsx, AppShell context). koperasi-anggota-plan complete (Nasabah hub at `/koperasi/anggota/:id` exists for cross-links).

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types/koperasi/kartu.types.ts` | Create | Kartu, EMoneyWallet, TransaksiKartu, Terminal, Merchant types |
| `src/services/koperasi/kartu.service.ts` | Create | CRUD + checkBalance + getHistory custom calls |
| `src/pages/koperasi/kartu/KartuListPage.tsx` | Create | List kartu with tipe/status filter |
| `src/pages/koperasi/kartu/KartuDetailPage.tsx` | Create | Simple Detail — Info Kartu + Transaksi tabs |
| `src/pages/koperasi/kartu/TerminalListPage.tsx` | Create | List terminal |
| `src/pages/koperasi/kartu/TerminalFormPage.tsx` | Create | Tambah/Edit terminal |
| `src/pages/koperasi/kartu/MerchantListPage.tsx` | Create | List merchant |
| `src/pages/koperasi/kartu/MerchantFormPage.tsx` | Create | Tambah/Edit merchant |
| `src/types/koperasi/zis.types.ts` | Create | PenerimaanZIS, ProgramPenyaluran, PenyaluranZIS, AsetWakaf, JenisDanaZIS |
| `src/services/koperasi/zis.service.ts` | Create | CRUD for all ZIS entities |
| `src/pages/koperasi/zis/PenerimaanZISListPage.tsx` | Create | List penerimaan ZIS |
| `src/pages/koperasi/zis/PenerimaanZISDetailPage.tsx` | Create | Simple Detail — Info + Rincian Jenis Dana |
| `src/pages/koperasi/zis/PenerimaanZISFormPage.tsx` | Create | Form tambah/edit penerimaan |
| `src/pages/koperasi/zis/ProgramPenyaluranListPage.tsx` | Create | List program penyaluran |
| `src/pages/koperasi/zis/ProgramPenyaluranDetailPage.tsx` | Create | Simple Detail — Info + Realisasi Penyaluran |
| `src/pages/koperasi/zis/ProgramPenyaluranFormPage.tsx` | Create | Form tambah/edit program |
| `src/pages/koperasi/zis/PenyaluranZISListPage.tsx` | Create | List penyaluran ZIS |
| `src/pages/koperasi/zis/PenyaluranZISFormPage.tsx` | Create | Form tambah/edit penyaluran |
| `src/pages/koperasi/zis/AsetWakafListPage.tsx` | Create | List aset wakaf |
| `src/pages/koperasi/zis/AsetWakafFormPage.tsx` | Create | Form tambah/edit aset wakaf |
| `src/types/koperasi/kas-teller.types.ts` | Create | SesiKasTeller, DenominasiUang, ItemDenominasiKas |
| `src/services/koperasi/kas-teller.service.ts` | Create | CRUD for sesi kas teller |
| `src/pages/koperasi/kas-teller/SesiKasTellerListPage.tsx` | Create | List sesi |
| `src/pages/koperasi/kas-teller/SesiKasTellerDetailPage.tsx` | Create | Simple Detail — Info + Denominasi + Ringkasan Transaksi |
| `src/pages/koperasi/kas-teller/SesiKasTellerFormPage.tsx` | Create | Form buka sesi baru |
| `src/types/koperasi/pengaturan.types.ts` | Create | PengaturanKoperasi type |
| `src/services/koperasi/pengaturan.service.ts` | Create | Single doctype get/save via Frappe API |
| `src/pages/koperasi/laporan/LaporanKoperasiPage.tsx` | Create | Filter form + export buttons (XLSX, PDF) |
| `src/pages/koperasi/pengaturan/PengaturanKoperasiPage.tsx` | Create | FormPageTemplate — single doctype editor |
| `src/app/routes.koperasi.tsx` | Modify | Add all new routes for kartu/zis/kas-teller/laporan/pengaturan |

---

## Task 1: Types — Kartu Module

**Files:**
- Create: `src/types/koperasi/kartu.types.ts`

- [ ] **Step 1: Create kartu types**

```typescript
// src/types/koperasi/kartu.types.ts

export type KartuTipe = 'debit' | 'emoney'
export type KartuStatus = 'aktif' | 'blokir' | 'expired' | 'nonaktif'
export type TransaksiKartuTipe = 'pembayaran' | 'emoney' | 'manual' | 'auto'
export type TransaksiKartuStatus = 'sukses' | 'gagal' | 'pending'
export type TerminalStatus = 'aktif' | 'nonaktif'
export type MerchantStatus = 'aktif' | 'nonaktif'

export interface Kartu {
  id: string
  uid_nfc: string
  tipe: KartuTipe
  status: KartuStatus
  expired: string         // ISO date string e.g. "2027-12-31"
  nasabah_id: string
  nasabah_nama: string
  rekening_id?: string    // for debit card
  rekening_nomor?: string // for debit card display
  wallet_id?: string      // for emoney card
  saldo?: number          // emoney only
}

export interface EMoneyWallet {
  id: string
  kartu_id: string
  saldo: number
  threshold_topup: number
  nominal_topup: number
  auto_topup: boolean
  rekening_sumber_id?: string
  rekening_sumber_nomor?: string
}

export interface TransaksiKartu {
  id: string
  kartu_id: string
  nominal: number
  tipe: TransaksiKartuTipe
  status: TransaksiKartuStatus
  saldo_sebelum: number
  saldo_sesudah: number
  terminal_id?: string
  terminal_nama?: string
  merchant_nama?: string
  referensi?: string
  creation: string        // ISO datetime
}

export interface Terminal {
  id: string
  terminal_id: string
  merchant_id: string
  merchant_nama: string
  api_key: string         // masked on list, full on edit
  status: TerminalStatus
  creation: string
}

export interface Merchant {
  id: string
  nama: string
  rekening_settlement_id: string
  rekening_settlement_nomor?: string
  status: MerchantStatus
  creation: string
}

// API response from GET /api/method/sekolahpro.koperasi.api.card.history
export interface KartuHistoryResponse {
  kartu: string
  page: number
  data: TransaksiKartu[]
}

// API response from GET /api/method/sekolahpro.koperasi.api.card.balance
export interface KartuBalanceResponse {
  kartu: string
  tipe: KartuTipe
  saldo: number
}
```

---

## Task 2: Service — Kartu Module

**Files:**
- Create: `src/services/koperasi/kartu.service.ts`

- [ ] **Step 2: Create kartu service with custom API calls**

```typescript
// src/services/koperasi/kartu.service.ts

import { apiClient } from '@/services/api.client'
import { createEntityService } from '@/services/createEntityService'
import type { Kartu, Terminal, Merchant, KartuHistoryResponse, KartuBalanceResponse } from '@/types/koperasi/kartu.types'

export const kartuService = {
  ...createEntityService<Kartu>('/api/resource/Kartu'),

  checkBalance: (kartuId: string): Promise<KartuBalanceResponse> =>
    apiClient.get<{ message: KartuBalanceResponse }>(
      `/api/method/sekolahpro.koperasi.api.card.balance?kartu=${encodeURIComponent(kartuId)}`,
    ).then((res) => res.message),

  getHistory: (kartuId: string, page = 1, pageSize = 20): Promise<KartuHistoryResponse> =>
    apiClient.get<{ message: KartuHistoryResponse }>(
      `/api/method/sekolahpro.koperasi.api.card.history?kartu=${encodeURIComponent(kartuId)}&page=${page}&page_size=${pageSize}`,
    ).then((res) => res.message),

  blokir: (kartuId: string): Promise<void> =>
    apiClient.put<void>(`/api/resource/Kartu/${kartuId}`, { status: 'blokir' }),

  aktifkan: (kartuId: string): Promise<void> =>
    apiClient.put<void>(`/api/resource/Kartu/${kartuId}`, { status: 'aktif' }),
}

export const terminalService = createEntityService<Terminal>('/api/resource/Terminal')

export const merchantService = createEntityService<Merchant>('/api/resource/Merchant')
```

---

## Task 3: KartuListPage

**Files:**
- Create: `src/pages/koperasi/kartu/KartuListPage.tsx`

- [ ] **Step 3: Create KartuListPage**

```tsx
// src/pages/koperasi/kartu/KartuListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { kartuService } from '@/services/koperasi/kartu.service'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { Kartu } from '@/types/koperasi/kartu.types'

const COLUMNS: ColumnDef<Kartu>[] = [
  { key: 'uid_nfc', header: 'UID NFC', sortable: true },
  {
    key: 'nasabah_nama',
    header: 'Nasabah',
    render: (row) => row.nasabah_nama,
    sortable: true,
  },
  {
    key: 'tipe',
    header: 'Tipe',
    render: (row) => (
      <span style={{
        textTransform: 'capitalize',
        fontWeight: 600,
        color: row.tipe === 'emoney' ? 'var(--color-indigo-600)' : 'var(--color-slate-700)',
      }}>
        {row.tipe === 'emoney' ? 'E-Money' : 'Debit'}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => {
      const colorMap: Record<string, string> = {
        aktif: 'var(--color-green-600)',
        blokir: 'var(--color-red-600)',
        expired: 'var(--color-orange-500)',
        nonaktif: 'var(--color-slate-400)',
      }
      return (
        <span style={{ color: colorMap[row.status] ?? 'inherit', textTransform: 'capitalize' }}>
          {row.status}
        </span>
      )
    },
  },
  {
    key: 'expired',
    header: 'Expired',
    render: (row) => new Date(row.expired).toLocaleDateString('id-ID'),
    sortable: true,
  },
]

const FILTER_DEFS: FilterDef[] = [
  {
    key: 'tipe',
    label: 'Tipe',
    type: 'select',
    options: [
      { value: 'debit', label: 'Debit' },
      { value: 'emoney', label: 'E-Money' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'aktif', label: 'Aktif' },
      { value: 'blokir', label: 'Diblokir' },
      { value: 'expired', label: 'Expired' },
      { value: 'nonaktif', label: 'Nonaktif' },
    ],
  },
]

export function KartuListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<Kartu>
      title="Daftar Kartu"
      queryKey="koperasi-kartu"
      fetcher={kartuService.list}
      columns={COLUMNS}
      filterDefs={FILTER_DEFS}
      searchPlaceholder="Cari UID NFC atau nasabah..."
      onRowClick={(row) => navigate(`/koperasi/kartu/${row.id}`)}
      exportFilename="kartu-koperasi"
      defaultSort={{ key: 'creation', order: 'desc' }}
    />
  )
}
```

---

## Task 4: KartuDetailPage

**Files:**
- Create: `src/pages/koperasi/kartu/KartuDetailPage.tsx`

- [ ] **Step 4: Create KartuDetailPage with Info + Transaksi tabs**

```tsx
// src/pages/koperasi/kartu/KartuDetailPage.tsx

import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldOff, ShieldCheck, CreditCard } from 'lucide-react'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { DataTable } from '@/widgets/DataTable/DataTable'
import { toast } from '@/widgets/Toast/Toast'
import { kartuService } from '@/services/koperasi/kartu.service'
import type { Kartu, TransaksiKartu } from '@/types/koperasi/kartu.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const TRANSAKSI_COLUMNS: ColumnDef<TransaksiKartu>[] = [
  {
    key: 'tipe',
    header: 'Tipe',
    render: (row) => {
      const label: Record<string, string> = {
        pembayaran: 'Pembayaran',
        emoney: 'E-Money',
        manual: 'Top-up Manual',
        auto: 'Auto Top-up',
      }
      return label[row.tipe] ?? row.tipe
    },
  },
  {
    key: 'nominal',
    header: 'Nominal',
    render: (row) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(row.nominal),
  },
  {
    key: 'saldo_sesudah',
    header: 'Saldo Akhir',
    render: (row) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(row.saldo_sesudah),
  },
  {
    key: 'terminal_nama',
    header: 'Terminal',
    render: (row) => row.terminal_nama ?? row.merchant_nama ?? '—',
  },
  {
    key: 'creation',
    header: 'Tanggal',
    render: (row) => new Date(row.creation).toLocaleString('id-ID'),
    sortable: true,
  },
]

function InfoKartuTab({ kartu }: { kartu: Kartu }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px', padding: '4px 0' }}>
      <dl style={{ margin: 0 }}>
        <dt style={{ fontSize: '12px', color: 'var(--color-slate-500)', marginBottom: 2 }}>UID NFC</dt>
        <dd style={{ margin: 0, fontFamily: 'monospace', fontSize: '14px', fontWeight: 600 }}>{kartu.uid_nfc}</dd>
      </dl>
      <dl style={{ margin: 0 }}>
        <dt style={{ fontSize: '12px', color: 'var(--color-slate-500)', marginBottom: 2 }}>Tipe</dt>
        <dd style={{ margin: 0, textTransform: 'capitalize', fontWeight: 600 }}>{kartu.tipe === 'emoney' ? 'E-Money' : 'Debit'}</dd>
      </dl>
      <dl style={{ margin: 0 }}>
        <dt style={{ fontSize: '12px', color: 'var(--color-slate-500)', marginBottom: 2 }}>Status</dt>
        <dd style={{ margin: 0, textTransform: 'capitalize' }}>{kartu.status}</dd>
      </dl>
      <dl style={{ margin: 0 }}>
        <dt style={{ fontSize: '12px', color: 'var(--color-slate-500)', marginBottom: 2 }}>Expired</dt>
        <dd style={{ margin: 0 }}>{new Date(kartu.expired).toLocaleDateString('id-ID')}</dd>
      </dl>
      <dl style={{ margin: 0 }}>
        <dt style={{ fontSize: '12px', color: 'var(--color-slate-500)', marginBottom: 2 }}>Nasabah</dt>
        <dd style={{ margin: 0 }}>
          <Link to={`/koperasi/anggota/${kartu.nasabah_id}`} style={{ color: 'var(--color-indigo-600)', textDecoration: 'none', fontWeight: 500 }}>
            {kartu.nasabah_nama}
          </Link>
        </dd>
      </dl>
      {kartu.tipe === 'emoney' && (
        <dl style={{ margin: 0 }}>
          <dt style={{ fontSize: '12px', color: 'var(--color-slate-500)', marginBottom: 2 }}>Saldo E-Money</dt>
          <dd style={{ margin: 0, fontWeight: 700, color: 'var(--color-green-700)', fontSize: '16px' }}>
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(kartu.saldo ?? 0)}
          </dd>
        </dl>
      )}
      {kartu.tipe === 'debit' && kartu.rekening_nomor && (
        <dl style={{ margin: 0 }}>
          <dt style={{ fontSize: '12px', color: 'var(--color-slate-500)', marginBottom: 2 }}>Rekening Sumber</dt>
          <dd style={{ margin: 0, fontFamily: 'monospace' }}>{kartu.rekening_nomor}</dd>
        </dl>
      )}
    </div>
  )
}

function TransaksiTab({ kartuId }: { kartuId: string }) {
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const { data, isLoading } = useQuery({
    queryKey: ['kartu-history', kartuId, page],
    queryFn: () => kartuService.getHistory(kartuId, page, PAGE_SIZE),
  })

  return (
    <DataTable<TransaksiKartu>
      columns={TRANSAKSI_COLUMNS}
      data={data?.data ?? []}
      isLoading={isLoading}
      pagination={{ page, pageSize: PAGE_SIZE, total: (data?.data?.length ?? 0) + (page > 1 ? (page - 1) * PAGE_SIZE : 0) }}
      onPageChange={setPage}
      emptyTitle="Belum ada transaksi"
      emptyDescription="Transaksi kartu ini akan muncul di sini."
    />
  )
}

export function KartuDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: kartu, isLoading, error } = useQuery({
    queryKey: ['koperasi-kartu', id],
    queryFn: () => kartuService.getById(id!),
    enabled: !!id,
  })

  const blokirMutation = useMutation({
    mutationFn: () => kartuService.blokir(id!),
    onSuccess: () => {
      toast.success('Kartu berhasil diblokir')
      void queryClient.invalidateQueries({ queryKey: ['koperasi-kartu', id] })
    },
    onError: () => toast.error('Gagal memblokir kartu'),
  })

  const aktifkanMutation = useMutation({
    mutationFn: () => kartuService.aktifkan(id!),
    onSuccess: () => {
      toast.success('Kartu berhasil diaktifkan')
      void queryClient.invalidateQueries({ queryKey: ['koperasi-kartu', id] })
    },
    onError: () => toast.error('Gagal mengaktifkan kartu'),
  })

  if (isLoading) return <div style={{ padding: 32 }}>Memuat...</div>
  if (error || !kartu) return <div style={{ padding: 32 }}>Gagal memuat data kartu.</div>

  const isBlokir = kartu.status === 'blokir'

  return (
    <DetailPageTemplate
      title={kartu.uid_nfc}
      code={kartu.tipe === 'emoney' ? 'E-Money' : 'Debit'}
      icon={<CreditCard size={20} />}
      badges={
        <Link to={`/koperasi/anggota/${kartu.nasabah_id}`} style={{ fontSize: '13px', color: 'var(--color-indigo-600)', textDecoration: 'none' }}>
          ← {kartu.nasabah_nama}
        </Link>
      }
      onBack={() => navigate('/koperasi/kartu')}
      actions={[
        isBlokir
          ? {
              label: 'Aktifkan',
              icon: <ShieldCheck size={15} />,
              onClick: () => aktifkanMutation.mutate(),
              variant: 'success',
              disabled: aktifkanMutation.isPending,
            }
          : {
              label: 'Blokir',
              icon: <ShieldOff size={15} />,
              onClick: () => blokirMutation.mutate(),
              variant: 'warning',
              disabled: blokirMutation.isPending,
            },
      ]}
      tabs={[
        {
          id: 'info',
          label: 'Info Kartu',
          content: <InfoKartuTab kartu={kartu} />,
        },
        {
          id: 'transaksi',
          label: 'Transaksi',
          content: <TransaksiTab kartuId={id!} />,
        },
      ]}
    />
  )
}
```

---

## Task 5: TerminalListPage + TerminalFormPage

**Files:**
- Create: `src/pages/koperasi/kartu/TerminalListPage.tsx`
- Create: `src/pages/koperasi/kartu/TerminalFormPage.tsx`

- [ ] **Step 5a: Create TerminalListPage**

```tsx
// src/pages/koperasi/kartu/TerminalListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { terminalService } from '@/services/koperasi/kartu.service'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { Terminal } from '@/types/koperasi/kartu.types'

const COLUMNS: ColumnDef<Terminal>[] = [
  { key: 'terminal_id', header: 'Terminal ID', sortable: true },
  { key: 'merchant_nama', header: 'Merchant', sortable: true },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <span style={{ color: row.status === 'aktif' ? 'var(--color-green-600)' : 'var(--color-slate-400)', textTransform: 'capitalize' }}>
        {row.status}
      </span>
    ),
  },
  {
    key: 'api_key',
    header: 'API Key',
    render: (row) => {
      const key = row.api_key ?? ''
      return (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {key.length > 8 ? `${key.slice(0, 4)}••••${key.slice(-4)}` : '••••••••'}
        </span>
      )
    },
  },
]

export function TerminalListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<Terminal>
      title="Terminal"
      addLabel="Tambah Terminal"
      onAdd={() => navigate('/koperasi/kartu/terminal/new')}
      queryKey="koperasi-terminal"
      fetcher={terminalService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari terminal atau merchant..."
      onRowClick={(row) => navigate(`/koperasi/kartu/terminal/${row.id}/edit`)}
      deleteConfig={{
        onDelete: (row) => terminalService.delete(row.id),
        dialogTitle: 'Hapus Terminal?',
        dialogBody: (row) => `Terminal "${row.terminal_id}" akan dihapus permanen.`,
        successMessage: (row) => `Terminal "${row.terminal_id}" berhasil dihapus.`,
      }}
      exportFilename="terminal-koperasi"
    />
  )
}
```

- [ ] **Step 5b: Create TerminalFormPage**

```tsx
// src/pages/koperasi/kartu/TerminalFormPage.tsx

import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { terminalService, merchantService } from '@/services/koperasi/kartu.service'
import { toast } from '@/widgets/Toast/Toast'
import type { Terminal } from '@/types/koperasi/kartu.types'

export function TerminalFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { data: existing, isLoading } = useQuery({
    queryKey: ['koperasi-terminal', id],
    queryFn: () => terminalService.getById(id!),
    enabled: isEdit,
  })

  const { data: merchantsData } = useQuery({
    queryKey: ['koperasi-merchant-all'],
    queryFn: () => merchantService.list({ limit: 9999 }),
  })

  const [form, setForm] = useState<Partial<Terminal>>({})
  const [serverError, setServerError] = useState<string | undefined>()

  const data = isEdit ? { ...existing, ...form } : form

  const mutation = useMutation({
    mutationFn: () =>
      isEdit
        ? terminalService.update(id!, form)
        : terminalService.create(form),
    onSuccess: () => {
      toast.success(isEdit ? 'Terminal berhasil diperbarui.' : 'Terminal berhasil ditambahkan.')
      void queryClient.invalidateQueries({ queryKey: ['koperasi-terminal'] })
      navigate('/koperasi/kartu/terminal')
    },
    onError: (err) => setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    mutation.mutate()
  }

  if (isEdit && isLoading) return <div style={{ padding: 32 }}>Memuat...</div>

  const merchants = merchantsData?.items ?? []

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Terminal' : 'Tambah Terminal'}
      onBack={() => navigate('/koperasi/kartu/terminal')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/koperasi/kartu/terminal')}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[
        {
          id: 'form',
          label: 'Data Terminal',
          content: (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', padding: '4px 0' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Terminal ID *</span>
                <input
                  type="text"
                  value={data.terminal_id ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, terminal_id: e.target.value }))}
                  required
                  placeholder="TERM-KANTIN-01"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Merchant *</span>
                <select
                  value={data.merchant_id ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, merchant_id: e.target.value }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                >
                  <option value="">Pilih merchant...</option>
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>{m.nama}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>API Key *</span>
                <input
                  type="text"
                  value={data.api_key ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                  required
                  placeholder="Masukkan API key terminal"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Status *</span>
                <select
                  value={data.status ?? 'aktif'}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Terminal['status'] }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </label>
            </div>
          ),
        },
      ]}
    />
  )
}
```

---

## Task 6: MerchantListPage + MerchantFormPage

**Files:**
- Create: `src/pages/koperasi/kartu/MerchantListPage.tsx`
- Create: `src/pages/koperasi/kartu/MerchantFormPage.tsx`

- [ ] **Step 6a: Create MerchantListPage**

```tsx
// src/pages/koperasi/kartu/MerchantListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { merchantService } from '@/services/koperasi/kartu.service'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { Merchant } from '@/types/koperasi/kartu.types'

const COLUMNS: ColumnDef<Merchant>[] = [
  { key: 'nama', header: 'Nama Merchant', sortable: true },
  { key: 'rekening_settlement_nomor', header: 'Rekening Settlement', render: (row) => row.rekening_settlement_nomor ?? '—' },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <span style={{ color: row.status === 'aktif' ? 'var(--color-green-600)' : 'var(--color-slate-400)', textTransform: 'capitalize' }}>
        {row.status}
      </span>
    ),
  },
]

export function MerchantListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<Merchant>
      title="Merchant"
      addLabel="Tambah Merchant"
      onAdd={() => navigate('/koperasi/kartu/merchant/new')}
      queryKey="koperasi-merchant"
      fetcher={merchantService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari merchant..."
      onRowClick={(row) => navigate(`/koperasi/kartu/merchant/${row.id}/edit`)}
      deleteConfig={{
        onDelete: (row) => merchantService.delete(row.id),
        dialogTitle: 'Hapus Merchant?',
        dialogBody: (row) => `Merchant "${row.nama}" akan dihapus permanen.`,
        successMessage: (row) => `Merchant "${row.nama}" berhasil dihapus.`,
      }}
      exportFilename="merchant-koperasi"
    />
  )
}
```

- [ ] **Step 6b: Create MerchantFormPage**

```tsx
// src/pages/koperasi/kartu/MerchantFormPage.tsx

import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { merchantService } from '@/services/koperasi/kartu.service'
import { toast } from '@/widgets/Toast/Toast'
import type { Merchant } from '@/types/koperasi/kartu.types'

export function MerchantFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { data: existing, isLoading } = useQuery({
    queryKey: ['koperasi-merchant', id],
    queryFn: () => merchantService.getById(id!),
    enabled: isEdit,
  })

  const [form, setForm] = useState<Partial<Merchant>>({})
  const [serverError, setServerError] = useState<string | undefined>()

  const data = isEdit ? { ...existing, ...form } : form

  const mutation = useMutation({
    mutationFn: () =>
      isEdit ? merchantService.update(id!, form) : merchantService.create(form),
    onSuccess: () => {
      toast.success(isEdit ? 'Merchant diperbarui.' : 'Merchant berhasil ditambahkan.')
      void queryClient.invalidateQueries({ queryKey: ['koperasi-merchant'] })
      navigate('/koperasi/kartu/merchant')
    },
    onError: (err) => setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    mutation.mutate()
  }

  if (isEdit && isLoading) return <div style={{ padding: 32 }}>Memuat...</div>

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Merchant' : 'Tambah Merchant'}
      onBack={() => navigate('/koperasi/kartu/merchant')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/koperasi/kartu/merchant')}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[
        {
          id: 'form',
          label: 'Data Merchant',
          content: (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', padding: '4px 0' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Nama Merchant *</span>
                <input
                  type="text"
                  value={data.nama ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                  required
                  placeholder="Kantin Utama"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Rekening Settlement *</span>
                <input
                  type="text"
                  value={data.rekening_settlement_id ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, rekening_settlement_id: e.target.value }))}
                  required
                  placeholder="ID Rekening Simpanan"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Status *</span>
                <select
                  value={data.status ?? 'aktif'}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Merchant['status'] }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                >
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </label>
            </div>
          ),
        },
      ]}
    />
  )
}
```

---

## Task 7: Types + Service — ZIS Module

**Files:**
- Create: `src/types/koperasi/zis.types.ts`
- Create: `src/services/koperasi/zis.service.ts`

- [ ] **Step 7: Create ZIS types and services**

```typescript
// src/types/koperasi/zis.types.ts

export type JenisDanaZISNama = 'Zakat' | 'Infaq' | 'Shadaqah'
export type PenerimaanZISStatus = 'draft' | 'dikonfirmasi' | 'dibatalkan'
export type ProgramPenyaluranStatus = 'aktif' | 'selesai' | 'ditunda'

export interface JenisDanaZIS {
  id: string
  nama: JenisDanaZISNama
}

export interface RincianJenisDana {
  jenis_dana_id: string
  jenis_dana_nama: JenisDanaZISNama
  nominal: number
}

export interface PenerimaanZIS {
  id: string
  tanggal: string
  donatur: string
  jenis_dana: JenisDanaZISNama   // primary jenis (summary)
  nominal: number
  status: PenerimaanZISStatus
  metode_pembayaran: string
  keterangan?: string
  rincian: RincianJenisDana[]
}

export interface ProgramPenyaluran {
  id: string
  nama: string
  target_dana: number
  terealisasi: number
  tanggal_mulai: string
  tanggal_selesai: string
  deskripsi?: string
  status: ProgramPenyaluranStatus
}

export interface PenyaluranZIS {
  id: string
  program_id: string
  program_nama: string
  penerima: string
  nominal: number
  tanggal: string
  keterangan?: string
}

export interface AsetWakaf {
  id: string
  nama_aset: string
  jenis_aset: string
  nilai: number
  wakif: string
  tanggal_wakaf: string
  lokasi?: string
  keterangan?: string
}
```

```typescript
// src/services/koperasi/zis.service.ts

import { createEntityService } from '@/services/createEntityService'
import type { PenerimaanZIS, ProgramPenyaluran, PenyaluranZIS, AsetWakaf } from '@/types/koperasi/zis.types'

export const penerimaanZISService = createEntityService<PenerimaanZIS>('/api/resource/Penerimaan ZIS')

export const programPenyaluranService = createEntityService<ProgramPenyaluran>('/api/resource/Program Penyaluran')

export const penyaluranZISService = createEntityService<PenyaluranZIS>('/api/resource/Penyaluran ZIS')

export const asetWakafService = createEntityService<AsetWakaf>('/api/resource/Aset Wakaf')
```

---

## Task 8: ZIS — Penerimaan ZIS (Simple Detail)

**Files:**
- Create: `src/pages/koperasi/zis/PenerimaanZISListPage.tsx`
- Create: `src/pages/koperasi/zis/PenerimaanZISDetailPage.tsx`
- Create: `src/pages/koperasi/zis/PenerimaanZISFormPage.tsx`

- [ ] **Step 8a: PenerimaanZISListPage**

```tsx
// src/pages/koperasi/zis/PenerimaanZISListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { penerimaanZISService } from '@/services/koperasi/zis.service'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { PenerimaanZIS } from '@/types/koperasi/zis.types'

const COLUMNS: ColumnDef<PenerimaanZIS>[] = [
  {
    key: 'tanggal',
    header: 'Tanggal',
    render: (row) => new Date(row.tanggal).toLocaleDateString('id-ID'),
    sortable: true,
  },
  { key: 'donatur', header: 'Donatur', sortable: true },
  { key: 'jenis_dana', header: 'Jenis Dana', sortable: true },
  {
    key: 'nominal',
    header: 'Nominal',
    render: (row) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(row.nominal),
    sortable: true,
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => {
      const colorMap: Record<string, string> = {
        draft: 'var(--color-slate-500)',
        dikonfirmasi: 'var(--color-green-600)',
        dibatalkan: 'var(--color-red-500)',
      }
      return <span style={{ color: colorMap[row.status] ?? 'inherit', textTransform: 'capitalize' }}>{row.status}</span>
    },
  },
]

const FILTER_DEFS: FilterDef[] = [
  {
    key: 'jenis_dana',
    label: 'Jenis Dana',
    type: 'select',
    options: [
      { value: 'Zakat', label: 'Zakat' },
      { value: 'Infaq', label: 'Infaq' },
      { value: 'Shadaqah', label: 'Shadaqah' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'dikonfirmasi', label: 'Dikonfirmasi' },
      { value: 'dibatalkan', label: 'Dibatalkan' },
    ],
  },
]

export function PenerimaanZISListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<PenerimaanZIS>
      title="Penerimaan ZIS"
      addLabel="Tambah Penerimaan"
      onAdd={() => navigate('/koperasi/zis/penerimaan/new')}
      queryKey="koperasi-penerimaan-zis"
      fetcher={penerimaanZISService.list}
      columns={COLUMNS}
      filterDefs={FILTER_DEFS}
      searchPlaceholder="Cari donatur..."
      onRowClick={(row) => navigate(`/koperasi/zis/penerimaan/${row.id}`)}
      deleteConfig={{
        onDelete: (row) => penerimaanZISService.delete(row.id),
        dialogTitle: 'Hapus Penerimaan ZIS?',
        dialogBody: (row) => `Penerimaan dari "${row.donatur}" sebesar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(row.nominal)} akan dihapus.`,
        successMessage: () => 'Penerimaan ZIS berhasil dihapus.',
      }}
      defaultSort={{ key: 'tanggal', order: 'desc' }}
      exportFilename="penerimaan-zis"
    />
  )
}
```

- [ ] **Step 8b: PenerimaanZISDetailPage**

```tsx
// src/pages/koperasi/zis/PenerimaanZISDetailPage.tsx

import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { Edit } from 'lucide-react'
import { penerimaanZISService } from '@/services/koperasi/zis.service'
import type { PenerimaanZIS } from '@/types/koperasi/zis.types'

function InfoPenerimaanTab({ penerimaan }: { penerimaan: PenerimaanZIS }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px', padding: '4px 0' }}>
      {[
        { label: 'Tanggal', value: new Date(penerimaan.tanggal).toLocaleDateString('id-ID') },
        { label: 'Donatur', value: penerimaan.donatur },
        { label: 'Jenis Dana Utama', value: penerimaan.jenis_dana },
        { label: 'Total Nominal', value: fmt(penerimaan.nominal) },
        { label: 'Metode Pembayaran', value: penerimaan.metode_pembayaran },
        { label: 'Status', value: penerimaan.status },
        ...(penerimaan.keterangan ? [{ label: 'Keterangan', value: penerimaan.keterangan }] : []),
      ].map(({ label, value }) => (
        <dl key={label} style={{ margin: 0 }}>
          <dt style={{ fontSize: '12px', color: 'var(--color-slate-500)', marginBottom: 2 }}>{label}</dt>
          <dd style={{ margin: 0, fontWeight: 500 }}>{value}</dd>
        </dl>
      ))}
    </div>
  )
}

function RincianJenisDanaTab({ penerimaan }: { penerimaan: PenerimaanZIS }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--color-slate-200)' }}>
          <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>Jenis Dana</th>
          <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600 }}>Nominal</th>
        </tr>
      </thead>
      <tbody>
        {(penerimaan.rincian ?? []).map((r) => (
          <tr key={r.jenis_dana_id} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
            <td style={{ padding: '10px 12px' }}>{r.jenis_dana_nama}</td>
            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{fmt(r.nominal)}</td>
          </tr>
        ))}
        {(penerimaan.rincian ?? []).length === 0 && (
          <tr>
            <td colSpan={2} style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--color-slate-400)' }}>
              Tidak ada rincian jenis dana.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

export function PenerimaanZISDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: penerimaan, isLoading, error } = useQuery({
    queryKey: ['koperasi-penerimaan-zis', id],
    queryFn: () => penerimaanZISService.getById(id!),
    enabled: !!id,
  })

  if (isLoading) return <div style={{ padding: 32 }}>Memuat...</div>
  if (error || !penerimaan) return <div style={{ padding: 32 }}>Gagal memuat data penerimaan ZIS.</div>

  return (
    <DetailPageTemplate
      title={penerimaan.donatur}
      code={new Date(penerimaan.tanggal).toLocaleDateString('id-ID')}
      onBack={() => navigate('/koperasi/zis/penerimaan')}
      actions={[
        {
          label: 'Edit',
          icon: <Edit size={15} />,
          onClick: () => navigate(`/koperasi/zis/penerimaan/${id}/edit`),
          variant: 'primary',
        },
      ]}
      tabs={[
        {
          id: 'info',
          label: 'Info Penerimaan',
          content: <InfoPenerimaanTab penerimaan={penerimaan} />,
        },
        {
          id: 'rincian',
          label: 'Rincian Jenis Dana',
          content: <RincianJenisDanaTab penerimaan={penerimaan} />,
        },
      ]}
    />
  )
}
```

- [ ] **Step 8c: PenerimaanZISFormPage**

```tsx
// src/pages/koperasi/zis/PenerimaanZISFormPage.tsx

import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { penerimaanZISService } from '@/services/koperasi/zis.service'
import { toast } from '@/widgets/Toast/Toast'
import type { PenerimaanZIS } from '@/types/koperasi/zis.types'

const JENIS_DANA_OPTIONS = ['Zakat', 'Infaq', 'Shadaqah'] as const
const METODE_OPTIONS = ['Tunai', 'Transfer', 'QRIS', 'Kartu']

export function PenerimaanZISFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { data: existing, isLoading } = useQuery({
    queryKey: ['koperasi-penerimaan-zis', id],
    queryFn: () => penerimaanZISService.getById(id!),
    enabled: isEdit,
  })

  const [form, setForm] = useState<Partial<PenerimaanZIS>>({})
  const [serverError, setServerError] = useState<string | undefined>()

  const data = isEdit ? { ...existing, ...form } : form

  const mutation = useMutation({
    mutationFn: () =>
      isEdit ? penerimaanZISService.update(id!, form) : penerimaanZISService.create(form),
    onSuccess: () => {
      toast.success(isEdit ? 'Penerimaan ZIS diperbarui.' : 'Penerimaan ZIS berhasil dicatat.')
      void queryClient.invalidateQueries({ queryKey: ['koperasi-penerimaan-zis'] })
      navigate('/koperasi/zis/penerimaan')
    },
    onError: (err) => setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    mutation.mutate()
  }

  if (isEdit && isLoading) return <div style={{ padding: 32 }}>Memuat...</div>

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Penerimaan ZIS' : 'Tambah Penerimaan ZIS'}
      onBack={() => navigate('/koperasi/zis/penerimaan')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/koperasi/zis/penerimaan')}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[
        {
          id: 'form',
          label: 'Data Penerimaan',
          content: (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', padding: '4px 0' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Donatur *</span>
                <input
                  type="text"
                  value={data.donatur ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, donatur: e.target.value }))}
                  required
                  placeholder="Nama donatur"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Tanggal *</span>
                <input
                  type="date"
                  value={data.tanggal ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Jenis Dana *</span>
                <select
                  value={data.jenis_dana ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, jenis_dana: e.target.value as PenerimaanZIS['jenis_dana'] }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                >
                  <option value="">Pilih jenis dana...</option>
                  {JENIS_DANA_OPTIONS.map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Nominal *</span>
                <input
                  type="number"
                  value={data.nominal ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, nominal: Number(e.target.value) }))}
                  required
                  min={0}
                  placeholder="0"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Metode Pembayaran *</span>
                <select
                  value={data.metode_pembayaran ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, metode_pembayaran: e.target.value }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                >
                  <option value="">Pilih metode...</option>
                  {METODE_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Keterangan</span>
                <textarea
                  value={data.keterangan ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
                  rows={3}
                  placeholder="Keterangan tambahan (opsional)"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6, resize: 'vertical' }}
                />
              </label>
            </div>
          ),
        },
      ]}
    />
  )
}
```

---

## Task 9: ZIS — Program Penyaluran (Simple Detail)

**Files:**
- Create: `src/pages/koperasi/zis/ProgramPenyaluranListPage.tsx`
- Create: `src/pages/koperasi/zis/ProgramPenyaluranDetailPage.tsx`
- Create: `src/pages/koperasi/zis/ProgramPenyaluranFormPage.tsx`

- [ ] **Step 9a: ProgramPenyaluranListPage**

```tsx
// src/pages/koperasi/zis/ProgramPenyaluranListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { programPenyaluranService } from '@/services/koperasi/zis.service'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { ProgramPenyaluran } from '@/types/koperasi/zis.types'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const COLUMNS: ColumnDef<ProgramPenyaluran>[] = [
  { key: 'nama', header: 'Nama Program', sortable: true },
  { key: 'target_dana', header: 'Target Dana', render: (row) => fmt(row.target_dana), sortable: true },
  {
    key: 'terealisasi',
    header: 'Terealisasi',
    render: (row) => {
      const pct = row.target_dana > 0 ? Math.round((row.terealisasi / row.target_dana) * 100) : 0
      return `${fmt(row.terealisasi)} (${pct}%)`
    },
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => {
      const colorMap: Record<string, string> = {
        aktif: 'var(--color-green-600)',
        selesai: 'var(--color-slate-500)',
        ditunda: 'var(--color-orange-500)',
      }
      return <span style={{ color: colorMap[row.status] ?? 'inherit', textTransform: 'capitalize' }}>{row.status}</span>
    },
  },
]

const FILTER_DEFS: FilterDef[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'aktif', label: 'Aktif' },
      { value: 'selesai', label: 'Selesai' },
      { value: 'ditunda', label: 'Ditunda' },
    ],
  },
]

export function ProgramPenyaluranListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<ProgramPenyaluran>
      title="Program Penyaluran ZIS"
      addLabel="Tambah Program"
      onAdd={() => navigate('/koperasi/zis/program/new')}
      queryKey="koperasi-program-penyaluran"
      fetcher={programPenyaluranService.list}
      columns={COLUMNS}
      filterDefs={FILTER_DEFS}
      searchPlaceholder="Cari nama program..."
      onRowClick={(row) => navigate(`/koperasi/zis/program/${row.id}`)}
      deleteConfig={{
        onDelete: (row) => programPenyaluranService.delete(row.id),
        dialogTitle: 'Hapus Program?',
        dialogBody: (row) => `Program "${row.nama}" akan dihapus permanen.`,
        successMessage: (row) => `Program "${row.nama}" berhasil dihapus.`,
      }}
      exportFilename="program-penyaluran-zis"
    />
  )
}
```

- [ ] **Step 9b: ProgramPenyaluranDetailPage**

```tsx
// src/pages/koperasi/zis/ProgramPenyaluranDetailPage.tsx

import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Edit } from 'lucide-react'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { programPenyaluranService, penyaluranZISService } from '@/services/koperasi/zis.service'
import { DataTable } from '@/widgets/DataTable/DataTable'
import type { PenyaluranZIS } from '@/types/koperasi/zis.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const REALISASI_COLUMNS: ColumnDef<PenyaluranZIS>[] = [
  { key: 'penerima', header: 'Penerima', sortable: true },
  { key: 'nominal', header: 'Nominal', render: (row) => fmt(row.nominal), sortable: true },
  { key: 'tanggal', header: 'Tanggal', render: (row) => new Date(row.tanggal).toLocaleDateString('id-ID'), sortable: true },
  { key: 'keterangan', header: 'Keterangan', render: (row) => row.keterangan ?? '—' },
]

export function ProgramPenyaluranDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: program, isLoading, error } = useQuery({
    queryKey: ['koperasi-program-penyaluran', id],
    queryFn: () => programPenyaluranService.getById(id!),
    enabled: !!id,
  })

  const { data: realisasiData, isLoading: realisasiLoading } = useQuery({
    queryKey: ['koperasi-penyaluran-zis', 'by-program', id],
    queryFn: () => penyaluranZISService.list({ program_id: id, limit: 9999 }),
    enabled: !!id,
  })

  if (isLoading) return <div style={{ padding: 32 }}>Memuat...</div>
  if (error || !program) return <div style={{ padding: 32 }}>Gagal memuat data program.</div>

  return (
    <DetailPageTemplate
      title={program.nama}
      code={program.status}
      onBack={() => navigate('/koperasi/zis/program')}
      actions={[
        {
          label: 'Edit',
          icon: <Edit size={15} />,
          onClick: () => navigate(`/koperasi/zis/program/${id}/edit`),
          variant: 'primary',
        },
      ]}
      tabs={[
        {
          id: 'info',
          label: 'Info Program',
          content: (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px', padding: '4px 0' }}>
              {[
                { label: 'Nama Program', value: program.nama },
                { label: 'Status', value: program.status },
                { label: 'Target Dana', value: fmt(program.target_dana) },
                { label: 'Terealisasi', value: `${fmt(program.terealisasi)} (${program.target_dana > 0 ? Math.round((program.terealisasi / program.target_dana) * 100) : 0}%)` },
                { label: 'Tanggal Mulai', value: new Date(program.tanggal_mulai).toLocaleDateString('id-ID') },
                { label: 'Tanggal Selesai', value: new Date(program.tanggal_selesai).toLocaleDateString('id-ID') },
                ...(program.deskripsi ? [{ label: 'Deskripsi', value: program.deskripsi }] : []),
              ].map(({ label, value }) => (
                <dl key={label} style={{ margin: 0 }}>
                  <dt style={{ fontSize: '12px', color: 'var(--color-slate-500)', marginBottom: 2 }}>{label}</dt>
                  <dd style={{ margin: 0, fontWeight: 500 }}>{value}</dd>
                </dl>
              ))}
            </div>
          ),
        },
        {
          id: 'realisasi',
          label: 'Realisasi Penyaluran',
          content: (
            <DataTable<PenyaluranZIS>
              columns={REALISASI_COLUMNS}
              data={realisasiData?.items ?? []}
              isLoading={realisasiLoading}
              emptyTitle="Belum ada penyaluran"
              emptyDescription="Realisasi penyaluran ZIS pada program ini akan muncul di sini."
            />
          ),
        },
      ]}
    />
  )
}
```

- [ ] **Step 9c: ProgramPenyaluranFormPage**

```tsx
// src/pages/koperasi/zis/ProgramPenyaluranFormPage.tsx

import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { programPenyaluranService } from '@/services/koperasi/zis.service'
import { toast } from '@/widgets/Toast/Toast'
import type { ProgramPenyaluran } from '@/types/koperasi/zis.types'

export function ProgramPenyaluranFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { data: existing, isLoading } = useQuery({
    queryKey: ['koperasi-program-penyaluran', id],
    queryFn: () => programPenyaluranService.getById(id!),
    enabled: isEdit,
  })

  const [form, setForm] = useState<Partial<ProgramPenyaluran>>({})
  const [serverError, setServerError] = useState<string | undefined>()

  const data = isEdit ? { ...existing, ...form } : form

  const mutation = useMutation({
    mutationFn: () =>
      isEdit ? programPenyaluranService.update(id!, form) : programPenyaluranService.create(form),
    onSuccess: () => {
      toast.success(isEdit ? 'Program diperbarui.' : 'Program berhasil ditambahkan.')
      void queryClient.invalidateQueries({ queryKey: ['koperasi-program-penyaluran'] })
      navigate('/koperasi/zis/program')
    },
    onError: (err) => setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    mutation.mutate()
  }

  if (isEdit && isLoading) return <div style={{ padding: 32 }}>Memuat...</div>

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Program Penyaluran' : 'Tambah Program Penyaluran'}
      onBack={() => navigate('/koperasi/zis/program')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/koperasi/zis/program')}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[
        {
          id: 'form',
          label: 'Data Program',
          content: (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', padding: '4px 0' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Nama Program *</span>
                <input
                  type="text"
                  value={data.nama ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
                  required
                  placeholder="Nama program penyaluran"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Target Dana (Rp) *</span>
                <input
                  type="number"
                  value={data.target_dana ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, target_dana: Number(e.target.value) }))}
                  required
                  min={0}
                  placeholder="0"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Status *</span>
                <select
                  value={data.status ?? 'aktif'}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProgramPenyaluran['status'] }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                >
                  <option value="aktif">Aktif</option>
                  <option value="selesai">Selesai</option>
                  <option value="ditunda">Ditunda</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Tanggal Mulai *</span>
                <input
                  type="date"
                  value={data.tanggal_mulai ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, tanggal_mulai: e.target.value }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Tanggal Selesai *</span>
                <input
                  type="date"
                  value={data.tanggal_selesai ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, tanggal_selesai: e.target.value }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Deskripsi</span>
                <textarea
                  value={data.deskripsi ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
                  rows={3}
                  placeholder="Deskripsi program (opsional)"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6, resize: 'vertical' }}
                />
              </label>
            </div>
          ),
        },
      ]}
    />
  )
}
```

---

## Task 10: ZIS — Penyaluran ZIS + Aset Wakaf (List + Form)

**Files:**
- Create: `src/pages/koperasi/zis/PenyaluranZISListPage.tsx`
- Create: `src/pages/koperasi/zis/PenyaluranZISFormPage.tsx`
- Create: `src/pages/koperasi/zis/AsetWakafListPage.tsx`
- Create: `src/pages/koperasi/zis/AsetWakafFormPage.tsx`

- [ ] **Step 10a: PenyaluranZISListPage**

```tsx
// src/pages/koperasi/zis/PenyaluranZISListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { penyaluranZISService } from '@/services/koperasi/zis.service'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { PenyaluranZIS } from '@/types/koperasi/zis.types'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const COLUMNS: ColumnDef<PenyaluranZIS>[] = [
  { key: 'program_nama', header: 'Program', sortable: true },
  { key: 'penerima', header: 'Penerima', sortable: true },
  { key: 'nominal', header: 'Nominal', render: (row) => fmt(row.nominal), sortable: true },
  { key: 'tanggal', header: 'Tanggal', render: (row) => new Date(row.tanggal).toLocaleDateString('id-ID'), sortable: true },
]

export function PenyaluranZISListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<PenyaluranZIS>
      title="Penyaluran ZIS"
      addLabel="Tambah Penyaluran"
      onAdd={() => navigate('/koperasi/zis/penyaluran/new')}
      queryKey="koperasi-penyaluran-zis"
      fetcher={penyaluranZISService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari penerima atau program..."
      onRowClick={(row) => navigate(`/koperasi/zis/penyaluran/${row.id}/edit`)}
      deleteConfig={{
        onDelete: (row) => penyaluranZISService.delete(row.id),
        dialogTitle: 'Hapus Penyaluran ZIS?',
        dialogBody: (row) => `Penyaluran ke "${row.penerima}" sebesar ${fmt(row.nominal)} akan dihapus.`,
        successMessage: () => 'Penyaluran ZIS berhasil dihapus.',
      }}
      defaultSort={{ key: 'tanggal', order: 'desc' }}
      exportFilename="penyaluran-zis"
    />
  )
}
```

- [ ] **Step 10b: PenyaluranZISFormPage**

```tsx
// src/pages/koperasi/zis/PenyaluranZISFormPage.tsx

import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { penyaluranZISService, programPenyaluranService } from '@/services/koperasi/zis.service'
import { toast } from '@/widgets/Toast/Toast'
import type { PenyaluranZIS } from '@/types/koperasi/zis.types'

export function PenyaluranZISFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { data: existing, isLoading } = useQuery({
    queryKey: ['koperasi-penyaluran-zis', id],
    queryFn: () => penyaluranZISService.getById(id!),
    enabled: isEdit,
  })

  const { data: programData } = useQuery({
    queryKey: ['koperasi-program-penyaluran-all'],
    queryFn: () => programPenyaluranService.list({ limit: 9999, status: 'aktif' }),
  })

  const [form, setForm] = useState<Partial<PenyaluranZIS>>({})
  const [serverError, setServerError] = useState<string | undefined>()

  const data = isEdit ? { ...existing, ...form } : form
  const programs = programData?.items ?? []

  const mutation = useMutation({
    mutationFn: () =>
      isEdit ? penyaluranZISService.update(id!, form) : penyaluranZISService.create(form),
    onSuccess: () => {
      toast.success(isEdit ? 'Penyaluran ZIS diperbarui.' : 'Penyaluran ZIS berhasil dicatat.')
      void queryClient.invalidateQueries({ queryKey: ['koperasi-penyaluran-zis'] })
      navigate('/koperasi/zis/penyaluran')
    },
    onError: (err) => setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    mutation.mutate()
  }

  if (isEdit && isLoading) return <div style={{ padding: 32 }}>Memuat...</div>

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Penyaluran ZIS' : 'Tambah Penyaluran ZIS'}
      onBack={() => navigate('/koperasi/zis/penyaluran')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/koperasi/zis/penyaluran')}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[
        {
          id: 'form',
          label: 'Data Penyaluran',
          content: (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', padding: '4px 0' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Program *</span>
                <select
                  value={data.program_id ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, program_id: e.target.value }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                >
                  <option value="">Pilih program...</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.nama}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Penerima *</span>
                <input
                  type="text"
                  value={data.penerima ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, penerima: e.target.value }))}
                  required
                  placeholder="Nama penerima"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Nominal (Rp) *</span>
                <input
                  type="number"
                  value={data.nominal ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, nominal: Number(e.target.value) }))}
                  required
                  min={0}
                  placeholder="0"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Tanggal *</span>
                <input
                  type="date"
                  value={data.tanggal ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Keterangan</span>
                <textarea
                  value={data.keterangan ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
                  rows={3}
                  placeholder="Keterangan tambahan (opsional)"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6, resize: 'vertical' }}
                />
              </label>
            </div>
          ),
        },
      ]}
    />
  )
}
```

- [ ] **Step 10c: AsetWakafListPage**

```tsx
// src/pages/koperasi/zis/AsetWakafListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { asetWakafService } from '@/services/koperasi/zis.service'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { AsetWakaf } from '@/types/koperasi/zis.types'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const COLUMNS: ColumnDef<AsetWakaf>[] = [
  { key: 'nama_aset', header: 'Nama Aset', sortable: true },
  { key: 'jenis_aset', header: 'Jenis Aset', sortable: true },
  { key: 'nilai', header: 'Nilai', render: (row) => fmt(row.nilai), sortable: true },
  { key: 'wakif', header: 'Wakif', sortable: true },
  { key: 'tanggal_wakaf', header: 'Tanggal Wakaf', render: (row) => new Date(row.tanggal_wakaf).toLocaleDateString('id-ID'), sortable: true },
]

export function AsetWakafListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<AsetWakaf>
      title="Aset Wakaf"
      addLabel="Tambah Aset Wakaf"
      onAdd={() => navigate('/koperasi/zis/aset-wakaf/new')}
      queryKey="koperasi-aset-wakaf"
      fetcher={asetWakafService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari nama aset atau wakif..."
      onRowClick={(row) => navigate(`/koperasi/zis/aset-wakaf/${row.id}/edit`)}
      deleteConfig={{
        onDelete: (row) => asetWakafService.delete(row.id),
        dialogTitle: 'Hapus Aset Wakaf?',
        dialogBody: (row) => `Aset wakaf "${row.nama_aset}" akan dihapus permanen.`,
        successMessage: (row) => `Aset wakaf "${row.nama_aset}" berhasil dihapus.`,
      }}
      defaultSort={{ key: 'tanggal_wakaf', order: 'desc' }}
      exportFilename="aset-wakaf"
    />
  )
}
```

- [ ] **Step 10d: AsetWakafFormPage**

```tsx
// src/pages/koperasi/zis/AsetWakafFormPage.tsx

import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { asetWakafService } from '@/services/koperasi/zis.service'
import { toast } from '@/widgets/Toast/Toast'
import type { AsetWakaf } from '@/types/koperasi/zis.types'

const JENIS_ASET_OPTIONS = ['Tanah', 'Bangunan', 'Kendaraan', 'Peralatan', 'Lainnya']

export function AsetWakafFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEdit = !!id

  const { data: existing, isLoading } = useQuery({
    queryKey: ['koperasi-aset-wakaf', id],
    queryFn: () => asetWakafService.getById(id!),
    enabled: isEdit,
  })

  const [form, setForm] = useState<Partial<AsetWakaf>>({})
  const [serverError, setServerError] = useState<string | undefined>()

  const data = isEdit ? { ...existing, ...form } : form

  const mutation = useMutation({
    mutationFn: () =>
      isEdit ? asetWakafService.update(id!, form) : asetWakafService.create(form),
    onSuccess: () => {
      toast.success(isEdit ? 'Aset wakaf diperbarui.' : 'Aset wakaf berhasil ditambahkan.')
      void queryClient.invalidateQueries({ queryKey: ['koperasi-aset-wakaf'] })
      navigate('/koperasi/zis/aset-wakaf')
    },
    onError: (err) => setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    mutation.mutate()
  }

  if (isEdit && isLoading) return <div style={{ padding: 32 }}>Memuat...</div>

  return (
    <FormPageTemplate
      title={isEdit ? 'Edit Aset Wakaf' : 'Tambah Aset Wakaf'}
      onBack={() => navigate('/koperasi/zis/aset-wakaf')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/koperasi/zis/aset-wakaf')}
      isSubmitting={mutation.isPending}
      serverError={serverError}
      tabs={[
        {
          id: 'form',
          label: 'Data Aset Wakaf',
          content: (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px', padding: '4px 0' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Nama Aset *</span>
                <input
                  type="text"
                  value={data.nama_aset ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, nama_aset: e.target.value }))}
                  required
                  placeholder="Nama aset wakaf"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Jenis Aset *</span>
                <select
                  value={data.jenis_aset ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, jenis_aset: e.target.value }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                >
                  <option value="">Pilih jenis...</option>
                  {JENIS_ASET_OPTIONS.map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Nilai (Rp) *</span>
                <input
                  type="number"
                  value={data.nilai ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, nilai: Number(e.target.value) }))}
                  required
                  min={0}
                  placeholder="0"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Wakif *</span>
                <input
                  type="text"
                  value={data.wakif ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, wakif: e.target.value }))}
                  required
                  placeholder="Nama wakif (pemberi wakaf)"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Tanggal Wakaf *</span>
                <input
                  type="date"
                  value={data.tanggal_wakaf ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, tanggal_wakaf: e.target.value }))}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Lokasi</span>
                <input
                  type="text"
                  value={data.lokasi ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, lokasi: e.target.value }))}
                  placeholder="Lokasi aset (opsional)"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Keterangan</span>
                <textarea
                  value={data.keterangan ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
                  rows={3}
                  placeholder="Keterangan aset wakaf (opsional)"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6, resize: 'vertical' }}
                />
              </label>
            </div>
          ),
        },
      ]}
    />
  )
}
```

---

## Task 11: Types + Service — Kas Teller Module

**Files:**
- Create: `src/types/koperasi/kas-teller.types.ts`
- Create: `src/services/koperasi/kas-teller.service.ts`

- [ ] **Step 11: Create Kas Teller types and service**

```typescript
// src/types/koperasi/kas-teller.types.ts

export type SesiKasTellerStatus = 'aktif' | 'tutup'

export interface DenominasiUang {
  id: string
  nilai: number   // e.g. 100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100
  label: string   // e.g. "Rp 100.000"
}

export interface ItemDenominasiKas {
  denominasi_id: string
  denominasi_nilai: number
  denominasi_label: string
  jumlah_lembar: number
  total: number   // jumlah_lembar * denominasi_nilai
}

export interface RingkasanTransaksi {
  jumlah_setoran: number
  total_setoran: number
  jumlah_penarikan: number
  total_penarikan: number
  jumlah_topup: number
  total_topup: number
  selisih_kas: number   // saldo_akhir - saldo_awal
}

export interface SesiKasTeller {
  id: string
  tanggal: string
  teller_id: string
  teller_nama: string
  jam_buka: string    // ISO datetime
  jam_tutup?: string  // ISO datetime, null if aktif
  saldo_awal: number
  saldo_akhir?: number
  status: SesiKasTellerStatus
  denominasi_awal: ItemDenominasiKas[]
  denominasi_akhir?: ItemDenominasiKas[]
  ringkasan?: RingkasanTransaksi
}
```

```typescript
// src/services/koperasi/kas-teller.service.ts

import { createEntityService } from '@/services/createEntityService'
import type { SesiKasTeller } from '@/types/koperasi/kas-teller.types'

export const sesiKasTellerService = createEntityService<SesiKasTeller>('/api/resource/Sesi Kas Teller')
```

---

## Task 12: Kas Teller — Sesi Pages (Simple Detail 3 tabs)

**Files:**
- Create: `src/pages/koperasi/kas-teller/SesiKasTellerListPage.tsx`
- Create: `src/pages/koperasi/kas-teller/SesiKasTellerDetailPage.tsx`
- Create: `src/pages/koperasi/kas-teller/SesiKasTellerFormPage.tsx`

- [ ] **Step 12a: SesiKasTellerListPage**

```tsx
// src/pages/koperasi/kas-teller/SesiKasTellerListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { sesiKasTellerService } from '@/services/koperasi/kas-teller.service'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { SesiKasTeller } from '@/types/koperasi/kas-teller.types'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const COLUMNS: ColumnDef<SesiKasTeller>[] = [
  { key: 'tanggal', header: 'Tanggal', render: (row) => new Date(row.tanggal).toLocaleDateString('id-ID'), sortable: true },
  { key: 'teller_nama', header: 'Teller', sortable: true },
  {
    key: 'jam_buka',
    header: 'Buka Kas',
    render: (row) => new Date(row.jam_buka).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  },
  {
    key: 'jam_tutup',
    header: 'Tutup Kas',
    render: (row) =>
      row.jam_tutup
        ? new Date(row.jam_tutup).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        : '—',
  },
  { key: 'saldo_awal', header: 'Saldo Awal', render: (row) => fmt(row.saldo_awal) },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <span style={{
        color: row.status === 'aktif' ? 'var(--color-green-600)' : 'var(--color-slate-500)',
        fontWeight: 600,
        textTransform: 'capitalize',
      }}>
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
      { value: 'aktif', label: 'Aktif' },
      { value: 'tutup', label: 'Tutup' },
    ],
  },
]

export function SesiKasTellerListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<SesiKasTeller>
      title="Sesi Kas Teller"
      addLabel="Buka Sesi Baru"
      onAdd={() => navigate('/koperasi/kas-teller/new')}
      queryKey="koperasi-sesi-kas-teller"
      fetcher={sesiKasTellerService.list}
      columns={COLUMNS}
      filterDefs={FILTER_DEFS}
      searchPlaceholder="Cari teller..."
      onRowClick={(row) => navigate(`/koperasi/kas-teller/${row.id}`)}
      defaultSort={{ key: 'tanggal', order: 'desc' }}
      exportFilename="sesi-kas-teller"
    />
  )
}
```

- [ ] **Step 12b: SesiKasTellerDetailPage**

```tsx
// src/pages/koperasi/kas-teller/SesiKasTellerDetailPage.tsx

import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { sesiKasTellerService } from '@/services/koperasi/kas-teller.service'
import type { SesiKasTeller, ItemDenominasiKas } from '@/types/koperasi/kas-teller.types'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

function InfoSesiTab({ sesi }: { sesi: SesiKasTeller }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px', padding: '4px 0' }}>
      {[
        { label: 'Tanggal', value: new Date(sesi.tanggal).toLocaleDateString('id-ID') },
        { label: 'Teller', value: sesi.teller_nama },
        { label: 'Jam Buka', value: new Date(sesi.jam_buka).toLocaleTimeString('id-ID') },
        { label: 'Jam Tutup', value: sesi.jam_tutup ? new Date(sesi.jam_tutup).toLocaleTimeString('id-ID') : '— (sesi aktif)' },
        { label: 'Saldo Awal', value: fmt(sesi.saldo_awal) },
        { label: 'Saldo Akhir', value: sesi.saldo_akhir != null ? fmt(sesi.saldo_akhir) : '— (belum tutup)' },
        { label: 'Status', value: sesi.status === 'aktif' ? 'Aktif' : 'Tutup' },
      ].map(({ label, value }) => (
        <dl key={label} style={{ margin: 0 }}>
          <dt style={{ fontSize: '12px', color: 'var(--color-slate-500)', marginBottom: 2 }}>{label}</dt>
          <dd style={{ margin: 0, fontWeight: 500 }}>{value}</dd>
        </dl>
      ))}
    </div>
  )
}

function DenominasiTab({ items, label }: { items: ItemDenominasiKas[]; label: string }) {
  const total = items.reduce((sum, i) => sum + i.total, 0)

  return (
    <div>
      <p style={{ fontSize: '13px', color: 'var(--color-slate-500)', marginBottom: 12 }}>{label}</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-slate-200)' }}>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>Denominasi</th>
            <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600 }}>Jumlah Lembar</th>
            <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.denominasi_id} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
              <td style={{ padding: '10px 12px' }}>{item.denominasi_label}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right' }}>{item.jumlah_lembar}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{fmt(item.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: '2px solid var(--color-slate-200)', background: 'var(--color-slate-50)' }}>
            <td colSpan={2} style={{ padding: '10px 12px', fontWeight: 700 }}>Total</td>
            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>{fmt(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function RingkasanTransaksiTab({ sesi }: { sesi: SesiKasTeller }) {
  const r = sesi.ringkasan

  if (!r) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-slate-400)' }}>
        Ringkasan transaksi tersedia setelah sesi ditutup.
      </div>
    )
  }

  const rows = [
    { label: 'Jumlah Setoran', count: r.jumlah_setoran, total: r.total_setoran },
    { label: 'Jumlah Penarikan', count: r.jumlah_penarikan, total: r.total_penarikan },
    { label: 'Jumlah Top-up E-Money', count: r.jumlah_topup, total: r.total_topup },
  ]

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-slate-200)' }}>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>Jenis Transaksi</th>
            <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600 }}>Jumlah</th>
            <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
              <td style={{ padding: '10px 12px' }}>{row.label}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right' }}>{row.count}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{fmt(row.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--color-slate-50)', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600 }}>Selisih Kas</span>
        <span style={{ fontWeight: 700, color: r.selisih_kas >= 0 ? 'var(--color-green-700)' : 'var(--color-red-600)' }}>
          {fmt(r.selisih_kas)}
        </span>
      </div>
    </div>
  )
}

export function SesiKasTellerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: sesi, isLoading, error } = useQuery({
    queryKey: ['koperasi-sesi-kas-teller', id],
    queryFn: () => sesiKasTellerService.getById(id!),
    enabled: !!id,
  })

  if (isLoading) return <div style={{ padding: 32 }}>Memuat...</div>
  if (error || !sesi) return <div style={{ padding: 32 }}>Gagal memuat data sesi kas teller.</div>

  const denomItems = sesi.denominasi_awal ?? []
  const denomAkhirItems = sesi.denominasi_akhir ?? []

  return (
    <DetailPageTemplate
      title={`Sesi — ${sesi.teller_nama}`}
      code={new Date(sesi.tanggal).toLocaleDateString('id-ID')}
      onBack={() => navigate('/koperasi/kas-teller')}
      tabs={[
        {
          id: 'info',
          label: 'Info Sesi',
          content: <InfoSesiTab sesi={sesi} />,
        },
        {
          id: 'denominasi',
          label: 'Denominasi',
          content: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <DenominasiTab items={denomItems} label="Denominasi Saldo Awal" />
              {sesi.status === 'tutup' && (
                <DenominasiTab items={denomAkhirItems} label="Denominasi Saldo Akhir" />
              )}
            </div>
          ),
        },
        {
          id: 'ringkasan',
          label: 'Ringkasan Transaksi',
          content: <RingkasanTransaksiTab sesi={sesi} />,
        },
      ]}
    />
  )
}
```

- [ ] **Step 12c: SesiKasTellerFormPage**

```tsx
// src/pages/koperasi/kas-teller/SesiKasTellerFormPage.tsx

import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { sesiKasTellerService } from '@/services/koperasi/kas-teller.service'
import { toast } from '@/widgets/Toast/Toast'
import type { SesiKasTeller, ItemDenominasiKas } from '@/types/koperasi/kas-teller.types'

const DENOMINASI_MASTER = [
  { id: 'D100000', nilai: 100000, label: 'Rp 100.000' },
  { id: 'D50000', nilai: 50000, label: 'Rp 50.000' },
  { id: 'D20000', nilai: 20000, label: 'Rp 20.000' },
  { id: 'D10000', nilai: 10000, label: 'Rp 10.000' },
  { id: 'D5000', nilai: 5000, label: 'Rp 5.000' },
  { id: 'D2000', nilai: 2000, label: 'Rp 2.000' },
  { id: 'D1000', nilai: 1000, label: 'Rp 1.000' },
  { id: 'D500', nilai: 500, label: 'Rp 500' },
  { id: 'D200', nilai: 200, label: 'Rp 200' },
  { id: 'D100', nilai: 100, label: 'Rp 100' },
]

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

export function SesiKasTellerFormPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const today = new Date().toISOString().split('T')[0]

  const [tanggal, setTanggal] = useState(today)
  const [denominasi, setDenominasi] = useState<Record<string, number>>(
    Object.fromEntries(DENOMINASI_MASTER.map((d) => [d.id, 0])),
  )
  const [serverError, setServerError] = useState<string | undefined>()

  const saldoAwal = DENOMINASI_MASTER.reduce(
    (sum, d) => sum + (denominasi[d.id] ?? 0) * d.nilai,
    0,
  )

  const denominasiAwal: ItemDenominasiKas[] = DENOMINASI_MASTER.filter(
    (d) => (denominasi[d.id] ?? 0) > 0,
  ).map((d) => ({
    denominasi_id: d.id,
    denominasi_nilai: d.nilai,
    denominasi_label: d.label,
    jumlah_lembar: denominasi[d.id] ?? 0,
    total: (denominasi[d.id] ?? 0) * d.nilai,
  }))

  const mutation = useMutation({
    mutationFn: () =>
      sesiKasTellerService.create({
        tanggal,
        saldo_awal: saldoAwal,
        denominasi_awal: denominasiAwal,
      } as Partial<SesiKasTeller>),
    onSuccess: () => {
      toast.success('Sesi kas teller berhasil dibuka.')
      void queryClient.invalidateQueries({ queryKey: ['koperasi-sesi-kas-teller'] })
      navigate('/koperasi/kas-teller')
    },
    onError: (err) => setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    mutation.mutate()
  }

  function updateLembar(id: string, delta: number) {
    setDenominasi((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }))
  }

  return (
    <FormPageTemplate
      title="Buka Sesi Kas Teller"
      onBack={() => navigate('/koperasi/kas-teller')}
      onSubmit={handleSubmit}
      onCancel={() => navigate('/koperasi/kas-teller')}
      isSubmitting={mutation.isPending}
      submitLabel="Buka Sesi"
      serverError={serverError}
      tabs={[
        {
          id: 'form',
          label: 'Buka Sesi',
          content: (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '4px 0' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 240 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Tanggal Sesi *</span>
                <input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  required
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                />
              </label>

              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, marginBottom: 12 }}>Denominasi Saldo Awal</p>
                <table style={{ width: '100%', maxWidth: 520, borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-slate-200)' }}>
                      <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>Denominasi</th>
                      <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 600 }}>Lembar</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DENOMINASI_MASTER.map((d) => {
                      const lembar = denominasi[d.id] ?? 0
                      return (
                        <tr key={d.id} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                          <td style={{ padding: '8px 12px' }}>{d.label}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                              <button
                                type="button"
                                onClick={() => updateLembar(d.id, -1)}
                                disabled={lembar === 0}
                                style={{ width: 28, height: 28, border: '1px solid var(--color-slate-200)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Minus size={12} />
                              </button>
                              <input
                                type="number"
                                value={lembar}
                                onChange={(e) => setDenominasi((prev) => ({ ...prev, [d.id]: Math.max(0, Number(e.target.value)) }))}
                                min={0}
                                style={{ width: 60, textAlign: 'center', padding: '4px 8px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
                              />
                              <button
                                type="button"
                                onClick={() => updateLembar(d.id, 1)}
                                style={{ width: 28, height: 28, border: '1px solid var(--color-slate-200)', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: lembar > 0 ? 600 : 400 }}>
                            {fmt(lembar * d.nilai)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid var(--color-slate-200)', background: 'var(--color-slate-50)' }}>
                      <td colSpan={2} style={{ padding: '10px 12px', fontWeight: 700 }}>Saldo Awal</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, fontSize: '16px', color: 'var(--color-green-700)' }}>
                        {fmt(saldoAwal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ),
        },
      ]}
    />
  )
}
```

---

## Task 13: Laporan Koperasi Page

**Files:**
- Create: `src/pages/koperasi/laporan/LaporanKoperasiPage.tsx`

- [ ] **Step 13: Create LaporanKoperasiPage**

```tsx
// src/pages/koperasi/laporan/LaporanKoperasiPage.tsx

import { useState } from 'react'
import { FileSpreadsheet, FileText, Download } from 'lucide-react'
import { PageHeader } from '@/layouts/PageHeader/PageHeader'
import { apiClient } from '@/services/api.client'
import { toast } from '@/widgets/Toast/Toast'

type LaporanNama =
  | 'rekap_transaksi_simpanan'
  | 'rekap_angsuran'
  | 'rekap_zis'
  | 'kas_teller_summary'

const LAPORAN_OPTIONS: { value: LaporanNama; label: string; description: string }[] = [
  {
    value: 'rekap_transaksi_simpanan',
    label: 'Rekap Transaksi Simpanan',
    description: 'Rekap semua transaksi setoran, penarikan, dan bagi hasil per periode.',
  },
  {
    value: 'rekap_angsuran',
    label: 'Rekap Angsuran Pembiayaan',
    description: 'Rekap pembayaran angsuran dan kolektibilitas pembiayaan per periode.',
  },
  {
    value: 'rekap_zis',
    label: 'Rekap ZIS',
    description: 'Rekap penerimaan dan penyaluran ZIS per periode.',
  },
  {
    value: 'kas_teller_summary',
    label: 'Kas Teller Summary',
    description: 'Ringkasan sesi kas teller beserta total transaksi per periode.',
  },
]

export function LaporanKoperasiPage() {
  const [laporanNama, setLaporanNama] = useState<LaporanNama>('rekap_transaksi_simpanan')
  const [periodeStart, setPeriodeStart] = useState('')
  const [periodeEnd, setPeriodeEnd] = useState('')
  const [nasabah, setNasabah] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const selectedLaporan = LAPORAN_OPTIONS.find((l) => l.value === laporanNama)!

  async function handleExport(format: 'xlsx' | 'pdf') {
    if (!periodeStart || !periodeEnd) {
      toast.error('Periode wajib diisi.')
      return
    }

    setIsExporting(true)
    try {
      const params = new URLSearchParams({
        laporan: laporanNama,
        periode_start: periodeStart,
        periode_end: periodeEnd,
        format,
        ...(nasabah ? { nasabah } : {}),
      })

      const blob = await apiClient.get<Blob>(
        `/api/method/sekolahpro.koperasi.api.laporan.export?${params.toString()}`,
        { responseType: 'blob' } as RequestInit,
      )

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${laporanNama}_${periodeStart}_${periodeEnd}.${format}`
      a.click()
      URL.revokeObjectURL(url)

      toast.success(`Laporan berhasil diunduh sebagai ${format.toUpperCase()}.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengunduh laporan.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <PageHeader title="Export Laporan Koperasi" />

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>
        {/* Pilih Laporan */}
        <div style={{ background: 'white', border: '1px solid var(--color-slate-200)', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: 16, color: 'var(--color-slate-800)' }}>
            Jenis Laporan
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {LAPORAN_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 16px',
                  border: `1.5px solid ${laporanNama === opt.value ? 'var(--color-indigo-500)' : 'var(--color-slate-200)'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: laporanNama === opt.value ? 'var(--color-indigo-50)' : 'white',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <input
                  type="radio"
                  name="laporan"
                  value={opt.value}
                  checked={laporanNama === opt.value}
                  onChange={() => setLaporanNama(opt.value)}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-slate-800)' }}>{opt.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-slate-500)', marginTop: 2 }}>{opt.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Filter */}
        <div style={{ background: 'white', border: '1px solid var(--color-slate-200)', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: 16, color: 'var(--color-slate-800)' }}>
            Filter
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>Periode Mulai *</span>
              <input
                type="date"
                value={periodeStart}
                onChange={(e) => setPeriodeStart(e.target.value)}
                required
                style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>Periode Selesai *</span>
              <input
                type="date"
                value={periodeEnd}
                onChange={(e) => setPeriodeEnd(e.target.value)}
                required
                style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1' }}>
              <span style={{ fontSize: '13px', fontWeight: 500 }}>Nasabah (opsional)</span>
              <input
                type="text"
                value={nasabah}
                onChange={(e) => setNasabah(e.target.value)}
                placeholder="Kosongkan untuk semua nasabah"
                style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6 }}
              />
            </label>
          </div>
        </div>

        {/* Export Buttons */}
        <div style={{ background: 'white', border: '1px solid var(--color-slate-200)', borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: 16, color: 'var(--color-slate-800)' }}>
            Export
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-slate-500)', marginBottom: 16 }}>
            Unduh laporan <strong>{selectedLaporan.label}</strong> dalam format yang diinginkan.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={() => handleExport('xlsx')}
              disabled={isExporting}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer',
                background: 'var(--color-green-600)', color: 'white', fontWeight: 600, fontSize: '14px',
              }}
            >
              <FileSpreadsheet size={16} />
              {isExporting ? 'Mengunduh...' : 'Export XLSX'}
            </button>
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer',
                background: 'var(--color-red-600)', color: 'white', fontWeight: 600, fontSize: '14px',
              }}
            >
              <FileText size={16} />
              {isExporting ? 'Mengunduh...' : 'Export PDF'}
            </button>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--color-slate-400)', marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Download size={11} />
            File akan langsung diunduh ke perangkat Anda.
          </p>
        </div>
      </div>
    </>
  )
}
```

---

## Task 14: Types + Service + Page — Pengaturan Koperasi

**Files:**
- Create: `src/types/koperasi/pengaturan.types.ts`
- Create: `src/services/koperasi/pengaturan.service.ts`
- Create: `src/pages/koperasi/pengaturan/PengaturanKoperasiPage.tsx`

- [ ] **Step 14a: Create pengaturan types and service**

```typescript
// src/types/koperasi/pengaturan.types.ts

export interface PengaturanKoperasi {
  limit_transaksi: number         // Max nominal per transaksi (Rp)
  biaya_admin_bulanan: number     // Biaya admin bulanan simpanan (Rp)
  max_pin_attempts: number        // Jumlah percobaan PIN sebelum blokir kartu
  denda_terlambat_per_hari: number // Denda angsuran per hari keterlambatan (Rp)
}
```

```typescript
// src/services/koperasi/pengaturan.service.ts

import { apiClient } from '@/services/api.client'
import type { PengaturanKoperasi } from '@/types/koperasi/pengaturan.types'

const SINGLE_DOCTYPE_NAME = 'Pengaturan Koperasi'
const BASE = `/api/resource/${encodeURIComponent(SINGLE_DOCTYPE_NAME)}/${encodeURIComponent(SINGLE_DOCTYPE_NAME)}`

export const pengaturanKoperasiService = {
  get: (): Promise<PengaturanKoperasi> =>
    apiClient.get<{ data: PengaturanKoperasi }>(BASE).then((res) => res.data),

  save: (data: Partial<PengaturanKoperasi>): Promise<PengaturanKoperasi> =>
    apiClient.put<{ data: PengaturanKoperasi }>(BASE, data).then((res) => res.data),
}
```

- [ ] **Step 14b: Create PengaturanKoperasiPage**

```tsx
// src/pages/koperasi/pengaturan/PengaturanKoperasiPage.tsx

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FormPageTemplate } from '@/widgets/FormPageTemplate/FormPageTemplate'
import { pengaturanKoperasiService } from '@/services/koperasi/pengaturan.service'
import { toast } from '@/widgets/Toast/Toast'
import type { PengaturanKoperasi } from '@/types/koperasi/pengaturan.types'

export function PengaturanKoperasiPage() {
  const queryClient = useQueryClient()

  const { data: existing, isLoading } = useQuery({
    queryKey: ['koperasi-pengaturan'],
    queryFn: pengaturanKoperasiService.get,
  })

  const [form, setForm] = useState<Partial<PengaturanKoperasi>>({})
  const [serverError, setServerError] = useState<string | undefined>()

  // Sync form with fetched data when loaded
  useEffect(() => {
    if (existing) setForm(existing)
  }, [existing])

  const mutation = useMutation({
    mutationFn: () => pengaturanKoperasiService.save(form),
    onSuccess: () => {
      toast.success('Pengaturan koperasi berhasil disimpan.')
      void queryClient.invalidateQueries({ queryKey: ['koperasi-pengaturan'] })
    },
    onError: (err) => setServerError(err instanceof Error ? err.message : 'Terjadi kesalahan.'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(undefined)
    mutation.mutate()
  }

  if (isLoading) return <div style={{ padding: 32 }}>Memuat pengaturan...</div>

  return (
    <FormPageTemplate
      title="Pengaturan Koperasi"
      onBack={() => window.history.back()}
      backLabel="Kembali"
      onSubmit={handleSubmit}
      onCancel={() => { if (existing) setForm(existing) }}
      isSubmitting={mutation.isPending}
      submitLabel="Simpan Pengaturan"
      serverError={serverError}
      tabs={[
        {
          id: 'form',
          label: 'Konfigurasi',
          content: (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 32px', padding: '4px 0', maxWidth: 640 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Limit Transaksi (Rp)</span>
                <span style={{ fontSize: '11px', color: 'var(--color-slate-400)' }}>Nominal maksimal per transaksi kartu</span>
                <input
                  type="number"
                  value={form.limit_transaksi ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, limit_transaksi: Number(e.target.value) }))}
                  min={0}
                  placeholder="0"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6, marginTop: 4 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Biaya Admin Bulanan (Rp)</span>
                <span style={{ fontSize: '11px', color: 'var(--color-slate-400)' }}>Biaya admin rekening simpanan per bulan</span>
                <input
                  type="number"
                  value={form.biaya_admin_bulanan ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, biaya_admin_bulanan: Number(e.target.value) }))}
                  min={0}
                  placeholder="0"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6, marginTop: 4 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Maks. Percobaan PIN</span>
                <span style={{ fontSize: '11px', color: 'var(--color-slate-400)' }}>Kartu diblokir otomatis setelah N kali salah PIN</span>
                <input
                  type="number"
                  value={form.max_pin_attempts ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, max_pin_attempts: Number(e.target.value) }))}
                  min={1}
                  max={10}
                  placeholder="3"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6, marginTop: 4 }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '13px', fontWeight: 500 }}>Denda Terlambat/Hari (Rp)</span>
                <span style={{ fontSize: '11px', color: 'var(--color-slate-400)' }}>Denda angsuran per hari keterlambatan</span>
                <input
                  type="number"
                  value={form.denda_terlambat_per_hari ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, denda_terlambat_per_hari: Number(e.target.value) }))}
                  min={0}
                  placeholder="0"
                  style={{ padding: '8px 12px', border: '1px solid var(--color-slate-200)', borderRadius: 6, marginTop: 4 }}
                />
              </label>
            </div>
          ),
        },
      ]}
    />
  )
}
```

---

## Task 15: Register All Routes in routes.koperasi.tsx

**Files:**
- Modify: `src/app/routes.koperasi.tsx`

- [ ] **Step 15: Add all new routes**

Locate the existing `routes.koperasi.tsx` and add the following route entries inside the koperasi route children. The exact insertion point depends on existing file structure — add after the last existing koperasi route block:

```tsx
// ─── KARTU ────────────────────────────────────────────
{ path: 'kartu', element: <KartuListPage /> },
{ path: 'kartu/:id', element: <KartuDetailPage /> },
{ path: 'kartu/terminal', element: <TerminalListPage /> },
{ path: 'kartu/terminal/new', element: <TerminalFormPage /> },
{ path: 'kartu/terminal/:id/edit', element: <TerminalFormPage /> },
{ path: 'kartu/merchant', element: <MerchantListPage /> },
{ path: 'kartu/merchant/new', element: <MerchantFormPage /> },
{ path: 'kartu/merchant/:id/edit', element: <MerchantFormPage /> },

// ─── ZIS ──────────────────────────────────────────────
{ path: 'zis/penerimaan', element: <PenerimaanZISListPage /> },
{ path: 'zis/penerimaan/new', element: <PenerimaanZISFormPage /> },
{ path: 'zis/penerimaan/:id', element: <PenerimaanZISDetailPage /> },
{ path: 'zis/penerimaan/:id/edit', element: <PenerimaanZISFormPage /> },
{ path: 'zis/program', element: <ProgramPenyaluranListPage /> },
{ path: 'zis/program/new', element: <ProgramPenyaluranFormPage /> },
{ path: 'zis/program/:id', element: <ProgramPenyaluranDetailPage /> },
{ path: 'zis/program/:id/edit', element: <ProgramPenyaluranFormPage /> },
{ path: 'zis/penyaluran', element: <PenyaluranZISListPage /> },
{ path: 'zis/penyaluran/new', element: <PenyaluranZISFormPage /> },
{ path: 'zis/penyaluran/:id/edit', element: <PenyaluranZISFormPage /> },
{ path: 'zis/aset-wakaf', element: <AsetWakafListPage /> },
{ path: 'zis/aset-wakaf/new', element: <AsetWakafFormPage /> },
{ path: 'zis/aset-wakaf/:id/edit', element: <AsetWakafFormPage /> },

// ─── KAS TELLER ───────────────────────────────────────
{ path: 'kas-teller', element: <SesiKasTellerListPage /> },
{ path: 'kas-teller/new', element: <SesiKasTellerFormPage /> },
{ path: 'kas-teller/:id', element: <SesiKasTellerDetailPage /> },

// ─── LAPORAN ──────────────────────────────────────────
{ path: 'laporan', element: <LaporanKoperasiPage /> },

// ─── PENGATURAN ───────────────────────────────────────
{ path: 'pengaturan', element: <PengaturanKoperasiPage /> },
```

Add the corresponding imports at the top of `routes.koperasi.tsx`:

```tsx
// Kartu
import { KartuListPage } from '@/pages/koperasi/kartu/KartuListPage'
import { KartuDetailPage } from '@/pages/koperasi/kartu/KartuDetailPage'
import { TerminalListPage } from '@/pages/koperasi/kartu/TerminalListPage'
import { TerminalFormPage } from '@/pages/koperasi/kartu/TerminalFormPage'
import { MerchantListPage } from '@/pages/koperasi/kartu/MerchantListPage'
import { MerchantFormPage } from '@/pages/koperasi/kartu/MerchantFormPage'

// ZIS
import { PenerimaanZISListPage } from '@/pages/koperasi/zis/PenerimaanZISListPage'
import { PenerimaanZISDetailPage } from '@/pages/koperasi/zis/PenerimaanZISDetailPage'
import { PenerimaanZISFormPage } from '@/pages/koperasi/zis/PenerimaanZISFormPage'
import { ProgramPenyaluranListPage } from '@/pages/koperasi/zis/ProgramPenyaluranListPage'
import { ProgramPenyaluranDetailPage } from '@/pages/koperasi/zis/ProgramPenyaluranDetailPage'
import { ProgramPenyaluranFormPage } from '@/pages/koperasi/zis/ProgramPenyaluranFormPage'
import { PenyaluranZISListPage } from '@/pages/koperasi/zis/PenyaluranZISListPage'
import { PenyaluranZISFormPage } from '@/pages/koperasi/zis/PenyaluranZISFormPage'
import { AsetWakafListPage } from '@/pages/koperasi/zis/AsetWakafListPage'
import { AsetWakafFormPage } from '@/pages/koperasi/zis/AsetWakafFormPage'

// Kas Teller
import { SesiKasTellerListPage } from '@/pages/koperasi/kas-teller/SesiKasTellerListPage'
import { SesiKasTellerDetailPage } from '@/pages/koperasi/kas-teller/SesiKasTellerDetailPage'
import { SesiKasTellerFormPage } from '@/pages/koperasi/kas-teller/SesiKasTellerFormPage'

// Laporan
import { LaporanKoperasiPage } from '@/pages/koperasi/laporan/LaporanKoperasiPage'

// Pengaturan
import { PengaturanKoperasiPage } from '@/pages/koperasi/pengaturan/PengaturanKoperasiPage'
```

---

## Task 16: Verification

- [ ] **Step 16a: TypeScript check — no type errors**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npx tsc --noEmit
```

Expected: zero errors. Fix any type mismatch found.

- [ ] **Step 16b: Lint check**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npm run lint
```

Expected: zero errors. Fix all lint warnings before marking done.

- [ ] **Step 16c: Build check**

```bash
cd /Users/erickmo/Desktop/Project/SekolahPro3/boilerplate/web-dashboard
npm run build
```

Expected: build succeeds with no errors. If there are module import errors (missing files), create the missing files or fix the import path.

---

## Implementation Notes

### API Path Conventions
- Frappe resource CRUD: `/api/resource/<Doctype Name>` — spaces are URL-encoded by the HTTP client
- Frappe custom methods: `/api/method/sekolahpro.koperasi.api.card.<method>`
- Single doctype: GET + PUT to `/api/resource/<Doctype>/<Doctype>` (same name for both path segments)

### Auth for Kartu Endpoints
The `tap` and `topup` endpoints require `X-Terminal-Id` + `X-Api-Key` headers — these are **POS terminal** endpoints, not used from the dashboard UI. The dashboard only calls `balance` and `history` which use standard Frappe token auth.

### Kartu: No FormPage
Kartu creation is done through the Nasabah hub flow (Phase 6), not from the Kartu list. `KartuDetailPage` has Blokir/Aktifkan actions only. Do not add a "Tambah Kartu" button to `KartuListPage`.

### LaporanKoperasiPage: No Template
This page uses `PageHeader` directly (not `FormPageTemplate`) because it has no save flow — it is purely a filter + download UI. The export calls a backend endpoint that returns a blob directly.

### ZIS: Rincian Jenis Dana
`PenerimaanZIS.rincian` is a child table — Frappe returns it as an array inside the parent document. The form (Task 8c) captures `jenis_dana` (primary) and `nominal` only for simplicity. Full rincian table input can be added in a follow-up iteration.

### Denominasi in Kas Teller Form
`DENOMINASI_MASTER` is a frontend constant mirroring the `Denominasi Uang` doctype values. If the backend adds new denominations, the frontend constant must be updated. A future improvement could fetch these from `/api/resource/Denominasi Uang`.

---

## Checklist Summary

| Task | Files | Status |
|------|-------|--------|
| 1 | `kartu.types.ts` | - [ ] |
| 2 | `kartu.service.ts` | - [ ] |
| 3 | `KartuListPage` | - [ ] |
| 4 | `KartuDetailPage` | - [ ] |
| 5 | `TerminalListPage` + `TerminalFormPage` | - [ ] |
| 6 | `MerchantListPage` + `MerchantFormPage` | - [ ] |
| 7 | `zis.types.ts` + `zis.service.ts` | - [ ] |
| 8 | `PenerimaanZIS` (List + Detail + Form) | - [ ] |
| 9 | `ProgramPenyaluran` (List + Detail + Form) | - [ ] |
| 10 | `PenyaluranZIS` + `AsetWakaf` (List + Form) | - [ ] |
| 11 | `kas-teller.types.ts` + `kas-teller.service.ts` | - [ ] |
| 12 | `SesiKasTeller` (List + Detail 3-tab + Form) | - [ ] |
| 13 | `LaporanKoperasiPage` | - [ ] |
| 14 | `pengaturan.types.ts` + `pengaturan.service.ts` + `PengaturanKoperasiPage` | - [ ] |
| 15 | `routes.koperasi.tsx` update | - [ ] |
| 16 | tsc + lint + build | - [ ] |
