// src/pages/koperasi/simpanan/RekeningDetailPage.tsx
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Edit } from 'lucide-react'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { rekeningSimapnanService } from '@/services/koperasi/simpanan.service'
import { QK } from '@/services/query-keys'
import type { RekeningSimapnan, TransaksiSimpanan, PermohonanSimpanan } from '@/types/koperasi/simpanan.types'
import type { PaginatedResponse } from '@/types/api.types'
import styles from './RekeningDetailPage.module.css'

// ─── Info Tab ────────────────────────────────────────────────────────────────

function InfoTab({ rekening }: { rekening: RekeningSimapnan }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  return (
    <div className={styles.infoGrid}>
      <InfoRow label="No Rekening" value={rekening.no_rekening} />
      <InfoRow
        label="Nasabah"
        value={
          <Link to={`/koperasi/anggota/nasabah/${rekening.nasabah_id}`} className={styles.nasabahLink}>
            {rekening.nasabah_nama} →
          </Link>
        }
      />
      <InfoRow label="Produk" value={rekening.produk_nama} />
      <InfoRow label="Saldo" value={fmt(rekening.saldo)} />
      <InfoRow label="Status" value={rekening.status} />
      <InfoRow label="Tanggal Buka" value={new Date(rekening.tanggal_buka).toLocaleDateString('id-ID')} />
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

// ─── Transaksi Tab ───────────────────────────────────────────────────────────

function TransaksiTab({ rekeningId }: { rekeningId: string }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  const { data, isLoading } = useQuery<PaginatedResponse<TransaksiSimpanan>>({
    queryKey: [QK.transaksiSimpanan, rekeningId],
    queryFn: () => rekeningSimapnanService.listTransaksi(rekeningId),
  })

  if (isLoading) return <div className={styles.loading}>Memuat...</div>

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Tipe</th>
          <th>Nominal</th>
          <th>Saldo Sebelum</th>
          <th>Saldo Sesudah</th>
          <th>Tanggal</th>
        </tr>
      </thead>
      <tbody>
        {(data?.items ?? []).map((trx) => (
          <tr key={trx.id}>
            <td>{trx.tipe}</td>
            <td>{fmt(trx.nominal)}</td>
            <td>{fmt(trx.saldo_sebelum)}</td>
            <td>{fmt(trx.saldo_sesudah)}</td>
            <td>{new Date(trx.tanggal).toLocaleDateString('id-ID')}</td>
          </tr>
        ))}
        {(data?.items ?? []).length === 0 && (
          <tr><td colSpan={5} className={styles.empty}>Belum ada transaksi</td></tr>
        )}
      </tbody>
    </table>
  )
}

// ─── Permohonan Tab ──────────────────────────────────────────────────────────

function PermohonanTab({ rekeningId }: { rekeningId: string }) {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery<PaginatedResponse<PermohonanSimpanan>>({
    queryKey: [QK.permohonanSimpanan, rekeningId],
    queryFn: () => rekeningSimapnanService.listPermohonan(rekeningId),
  })

  if (isLoading) return <div className={styles.loading}>Memuat...</div>

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Tipe</th>
          <th>Status</th>
          <th>Alasan</th>
          <th>Tanggal</th>
        </tr>
      </thead>
      <tbody>
        {(data?.items ?? []).map((p) => (
          <tr key={p.id} className={styles.clickable} onClick={() => navigate(`/koperasi/simpanan/permohonan/${p.id}`)}>
            <td>{p.tipe}</td>
            <td>{p.status}</td>
            <td>{p.alasan}</td>
            <td>{new Date(p.tanggal).toLocaleDateString('id-ID')}</td>
          </tr>
        ))}
        {(data?.items ?? []).length === 0 && (
          <tr><td colSpan={4} className={styles.empty}>Belum ada permohonan</td></tr>
        )}
      </tbody>
    </table>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function RekeningDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { data: rekening, isLoading } = useQuery<RekeningSimapnan>({
    queryKey: [QK.rekeningSimapnanDetail, id],
    queryFn: () => rekeningSimapnanService.getById(id!),
    enabled: !!id,
  })

  if (isLoading || !rekening) {
    return <div className={styles.loading}>Memuat rekening...</div>
  }

  return (
    <DetailPageTemplate
      title={rekening.no_rekening}
      code={rekening.status}
      badges={
        <Link to={`/koperasi/anggota/nasabah/${rekening.nasabah_id}`} className={styles.nasabahBadge}>
          ← {rekening.nasabah_nama}
        </Link>
      }
      onBack={() => navigate('/koperasi/simpanan/rekening')}
      actions={[
        {
          label: 'Edit',
          icon: <Edit size={14} />,
          onClick: () => navigate('edit'),
          variant: 'primary',
        },
      ]}
      tabs={[
        { id: 'info', label: 'Info Rekening', content: <InfoTab rekening={rekening} /> },
        { id: 'transaksi', label: 'Transaksi', content: <TransaksiTab rekeningId={id!} /> },
        { id: 'permohonan', label: 'Permohonan', content: <PermohonanTab rekeningId={id!} /> },
      ]}
    />
  )
}
