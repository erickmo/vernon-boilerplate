// src/pages/koperasi/kas-teller/SesiKasTellerDetailPage.tsx

import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { sesiKasTellerService } from '@/services/koperasi/kas-teller.service'
import type { SesiKasTeller, DenominasiBukaRow } from '@/types/koperasi/kas-teller.types'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

function InfoSesiTab({ sesi }: { sesi: SesiKasTeller }) {
  const items: Array<{ label: string; value: string }> = [
    { label: 'Tanggal', value: new Date(sesi.tanggal).toLocaleDateString('id-ID') },
    { label: 'Teller', value: sesi.teller },
    { label: 'Shift', value: sesi.shift },
    {
      label: 'Waktu Buka',
      value: sesi.waktu_buka ? new Date(sesi.waktu_buka).toLocaleString('id-ID') : '—',
    },
    {
      label: 'Waktu Tutup',
      value: sesi.waktu_tutup ? new Date(sesi.waktu_tutup).toLocaleString('id-ID') : '— (belum tutup)',
    },
    { label: 'Modal Kas', value: fmt(sesi.modal_kas) },
    { label: 'Total Setoran', value: fmt(sesi.total_setoran ?? 0) },
    { label: 'Total Penarikan', value: fmt(sesi.total_penarikan ?? 0) },
    { label: 'Saldo Seharusnya', value: fmt(sesi.saldo_seharusnya ?? 0) },
    {
      label: 'Total Denominasi Tutup',
      value: sesi.total_denominasi_tutup != null ? fmt(sesi.total_denominasi_tutup) : '— (belum tutup)',
    },
    { label: 'Selisih', value: sesi.selisih != null ? fmt(sesi.selisih) : '—' },
    { label: 'Catatan Selisih', value: sesi.catatan_selisih ?? '—' },
    { label: 'Supervisor Buka', value: sesi.supervisor_buka },
    { label: 'Supervisor Tutup', value: sesi.supervisor_tutup ?? '— (belum di-approve)' },
    { label: 'Status', value: sesi.status },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px', padding: '4px 0' }}>
      {items.map(({ label, value }) => (
        <dl key={label} style={{ margin: 0 }}>
          <dt style={{ fontSize: '12px', color: 'var(--color-slate-500)', marginBottom: 2 }}>{label}</dt>
          <dd style={{ margin: 0, fontWeight: 500 }}>{value}</dd>
        </dl>
      ))}
    </div>
  )
}

function DenominasiTable({ items, label }: { items: DenominasiBukaRow[]; label: string }) {
  const total = items.reduce((sum, i) => sum + (i.total ?? 0), 0)
  const hasSubtotal = items.some((i) => i.total != null)

  return (
    <div>
      <p style={{ fontSize: '13px', color: 'var(--color-slate-500)', marginBottom: 12 }}>{label}</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-slate-200)' }}>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>Denominasi</th>
            <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600 }}>Jumlah</th>
            <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600 }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.name ?? `${item.denominasi}-${idx}`} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
              <td style={{ padding: '10px 12px' }}>{item.denominasi}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right' }}>{item.jumlah_lembar}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>
                {item.total != null ? fmt(item.total) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
        {hasSubtotal && (
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--color-slate-200)', background: 'var(--color-slate-50)' }}>
              <td colSpan={2} style={{ padding: '10px 12px', fontWeight: 700 }}>Total</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>{fmt(total)}</td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

function RingkasanTransaksiTab({ sesi }: { sesi: SesiKasTeller }) {
  if (sesi.status !== 'Selesai' && sesi.status !== 'Pending Approval') {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-slate-400)' }}>
        Ringkasan transaksi tersedia setelah sesi ditutup.
      </div>
    )
  }

  const rows = [
    { label: 'Total Setoran', total: sesi.total_setoran ?? 0 },
    { label: 'Total Penarikan', total: sesi.total_penarikan ?? 0 },
  ]
  const selisih = sesi.selisih ?? 0

  return (
    <div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-slate-200)' }}>
            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>Jenis Transaksi</th>
            <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
              <td style={{ padding: '10px 12px' }}>{row.label}</td>
              <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>{fmt(row.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--color-slate-50)', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600 }}>Selisih Kas</span>
        <span style={{ fontWeight: 700, color: selisih >= 0 ? 'var(--color-green-700)' : 'var(--color-red-600)' }}>
          {fmt(selisih)}
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

  const denomBuka = sesi.denominasi_buka ?? []
  const denomTutup = sesi.denominasi_tutup ?? []

  return (
    <DetailPageTemplate
      title={`Sesi ${sesi.name}`}
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
              <DenominasiTable items={denomBuka} label="Denominasi Saat Buka" />
              {sesi.status === 'Selesai' && (
                <DenominasiTable items={denomTutup} label="Denominasi Saat Tutup" />
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
