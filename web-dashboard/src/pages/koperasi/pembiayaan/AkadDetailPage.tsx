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
          <Link to={`/koperasi/anggota/nasabah/${akad.nasabah_id}`} className={styles.nasabahLink}>
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
        <Link to={`/koperasi/anggota/nasabah/${akad.nasabah_id}`} className={styles.nasabahBadge}>
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
