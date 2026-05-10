// src/pages/koperasi/pembiayaan/PembagianSHUDetailPage.tsx
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { pembagianSHUService } from '@/services/koperasi/pembiayaan.service'
import { QK } from '@/services/query-keys'
import type { PembagianSHU, ItemSHUAnggota } from '@/types/koperasi/pembiayaan.types'
import type { PaginatedResponse } from '@/types/api.types'
import styles from './PembagianSHUDetailPage.module.css'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

// ─── Info Tab ────────────────────────────────────────────────────────────────

function InfoTab({ shu }: { shu: PembagianSHU }) {
  return (
    <div className={styles.infoGrid}>
      <InfoRow label="Periode" value={shu.periode} />
      <InfoRow label="Total SHU" value={fmt(shu.total_shu)} />
      <InfoRow label="Status" value={shu.status} />
      <InfoRow label="Jumlah Anggota" value={shu.jumlah_anggota.toLocaleString('id-ID')} />
      <InfoRow label="Tanggal" value={new Date(shu.tanggal).toLocaleDateString('id-ID')} />
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

// ─── Item per Anggota Tab ────────────────────────────────────────────────────

function ItemAnggotaTab({ shuId }: { shuId: string }) {
  const { data, isLoading } = useQuery<PaginatedResponse<ItemSHUAnggota>>({
    queryKey: [QK.pembagianSHUDetail, shuId, 'items'],
    queryFn: () => pembagianSHUService.listItems(shuId),
  })

  if (isLoading) return <div className={styles.loading}>Memuat data anggota...</div>

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Nama Anggota</th>
          <th>Porsi (%)</th>
          <th>Nominal</th>
        </tr>
      </thead>
      <tbody>
        {(data?.items ?? []).map((item) => (
          <tr key={item.id}>
            <td>
              <Link
                to={`/koperasi/anggota/nasabah/${item.nasabah_id}`}
                className={styles.nasabahLink}
              >
                {item.nasabah_nama}
              </Link>
            </td>
            <td>{item.porsi_persen.toFixed(2)}%</td>
            <td>{fmt(item.nominal)}</td>
          </tr>
        ))}
        {(data?.items ?? []).length === 0 && (
          <tr><td colSpan={3} className={styles.empty}>Belum ada data anggota</td></tr>
        )}
      </tbody>
    </table>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function PembagianSHUDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { data: shu, isLoading } = useQuery<PembagianSHU>({
    queryKey: [QK.pembagianSHUDetail, id],
    queryFn: () => pembagianSHUService.getById(id!),
    enabled: !!id,
  })

  if (isLoading || !shu) {
    return <div className={styles.loading}>Memuat SHU...</div>
  }

  return (
    <DetailPageTemplate
      title={`SHU Periode ${shu.periode}`}
      code={shu.status}
      onBack={() => navigate('/koperasi/pembiayaan/shu')}
      tabs={[
        { id: 'info', label: 'Info SHU', content: <InfoTab shu={shu} /> },
        { id: 'anggota', label: 'Item per Anggota', content: <ItemAnggotaTab shuId={id!} /> },
      ]}
    />
  )
}
