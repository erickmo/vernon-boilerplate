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
  { key: 'nominal', header: 'Nominal', render: (_v, row) => fmt(row.nominal), sortable: true },
  { key: 'tanggal', header: 'Tanggal', render: (_v, row) => new Date(row.tanggal).toLocaleDateString('id-ID'), sortable: true },
  { key: 'keterangan', header: 'Keterangan', render: (_v, row) => row.keterangan ?? '—' },
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
    queryFn: () => penyaluranZISService.list({ limit: 9999 }),
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
          variant: 'primary' as const,
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
