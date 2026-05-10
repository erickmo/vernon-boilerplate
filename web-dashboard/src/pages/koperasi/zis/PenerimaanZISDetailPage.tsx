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
          variant: 'primary' as const,
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
