// src/pages/koperasi/anggota/tabs/NasabahKartuTab.tsx
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { nasabahService } from '@/services/koperasi/nasabah.service'
import type { KartuSlim } from '@/types/koperasi/anggota.types'
import styles from './NasabahTab.module.css'

interface Props {
  nasabahId: string
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function NasabahKartuTab({ nasabahId }: Props) {
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['nasabah-summary', nasabahId], // Deduped with Rekening + Pembiayaan tabs
    queryFn: () => nasabahService.getNasabahSummary(nasabahId),
    staleTime: 1000 * 60 * 5,
  })

  if (isLoading) {
    return <p className={styles.loadingMsg}>Memuat data kartu...</p>
  }

  if (error) {
    return (
      <p className={styles.errorMsg}>
        Gagal memuat kartu:{' '}
        {error instanceof Error ? error.message : 'Terjadi kesalahan'}
      </p>
    )
  }

  const kartu: KartuSlim[] = summary?.kartu ?? []

  if (kartu.length === 0) {
    return <p className={styles.emptyMsg}>Nasabah ini belum memiliki kartu.</p>
  }

  return (
    <div className={styles.tabContent}>
      <table className={styles.relTable}>
        <thead>
          <tr>
            <th>No. Kartu</th>
            <th>Tipe</th>
            <th>UID</th>
            <th>Status</th>
            <th>Saldo E-Money</th>
          </tr>
        </thead>
        <tbody>
          {kartu.map((k) => (
            <tr key={k.id}>
              <td>
                <Link to={`/koperasi/kartu/daftar/${k.id}`} className={styles.relLink}>
                  {k.nomor_kartu}
                </Link>
              </td>
              <td style={{ textTransform: 'capitalize' }}>{k.tipe}</td>
              <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{k.uid}</td>
              <td>{k.status}</td>
              <td className={styles.saldo}>
                {k.tipe === 'emoney' && k.saldo_emoney !== undefined
                  ? formatRupiah(k.saldo_emoney)
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
