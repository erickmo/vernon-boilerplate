// src/pages/koperasi/kas-teller/SesiKasTellerDetailPage.tsx

import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { sesiKasTellerService } from '@/services/koperasi/kas-teller.service'
import type { SesiKasTeller, ItemDenominasiKas, RingkasanTransaksi } from '@/types/koperasi/kas-teller.types'

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

function RingkasanTransaksiTab({ ringkasan }: { ringkasan: RingkasanTransaksi | undefined }) {
  if (!ringkasan) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-slate-400)' }}>
        Ringkasan transaksi tersedia setelah sesi ditutup.
      </div>
    )
  }

  const rows = [
    { label: 'Jumlah Setoran', count: ringkasan.jumlah_setoran, total: ringkasan.total_setoran },
    { label: 'Jumlah Penarikan', count: ringkasan.jumlah_penarikan, total: ringkasan.total_penarikan },
    { label: 'Jumlah Top-up E-Money', count: ringkasan.jumlah_topup, total: ringkasan.total_topup },
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
        <span style={{ fontWeight: 700, color: ringkasan.selisih_kas >= 0 ? 'var(--color-green-700)' : 'var(--color-red-600)' }}>
          {fmt(ringkasan.selisih_kas)}
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
          content: <RingkasanTransaksiTab ringkasan={sesi.ringkasan} />,
        },
      ]}
    />
  )
}
