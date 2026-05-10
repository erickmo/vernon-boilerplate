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
    render: (_v, row) => {
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
    render: (_v, row) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(row.nominal),
  },
  {
    key: 'saldo_sesudah',
    header: 'Saldo Akhir',
    render: (_v, row) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(row.saldo_sesudah),
  },
  {
    key: 'terminal_nama',
    header: 'Terminal',
    render: (_v, row) => row.terminal_nama ?? row.merchant_nama ?? '—',
  },
  {
    key: 'creation',
    header: 'Tanggal',
    render: (_v, row) => new Date(row.creation).toLocaleString('id-ID'),
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
          <Link to={`/koperasi/anggota/nasabah/${kartu.nasabah_id}`} style={{ color: 'var(--color-indigo-600)', textDecoration: 'none', fontWeight: 500 }}>
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
        <Link to={`/koperasi/anggota/nasabah/${kartu.nasabah_id}`} style={{ fontSize: '13px', color: 'var(--color-indigo-600)', textDecoration: 'none' }}>
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
              variant: 'success' as const,
              disabled: aktifkanMutation.isPending,
            }
          : {
              label: 'Blokir',
              icon: <ShieldOff size={15} />,
              onClick: () => blokirMutation.mutate(),
              variant: 'warning' as const,
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
