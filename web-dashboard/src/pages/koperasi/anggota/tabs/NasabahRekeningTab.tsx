// src/pages/koperasi/anggota/tabs/NasabahRekeningTab.tsx
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { nasabahService } from '@/services/koperasi/nasabah.service'
import type { RekeningSlim } from '@/types/koperasi/anggota.types'
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

export function NasabahRekeningTab({ nasabahId }: Props) {
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['nasabah-summary', nasabahId],
    queryFn: () => nasabahService.getNasabahSummary(nasabahId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  if (isLoading) {
    return <p className={styles.loadingMsg}>Memuat data rekening...</p>
  }

  if (error) {
    return (
      <p className={styles.errorMsg}>
        Gagal memuat rekening:{' '}
        {error instanceof Error ? error.message : 'Terjadi kesalahan'}
      </p>
    )
  }

  const rekening: RekeningSlim[] = summary?.rekening ?? []

  if (rekening.length === 0) {
    return <p className={styles.emptyMsg}>Nasabah ini belum memiliki rekening simpanan.</p>
  }

  return (
    <div className={styles.tabContent}>
      <table className={styles.relTable}>
        <thead>
          <tr>
            <th>No. Rekening</th>
            <th>Produk Simpanan</th>
            <th>Saldo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rekening.map((r) => (
            <tr key={r.id}>
              <td>
                <Link
                  to={`/koperasi/simpanan/rekening/${r.id}`}
                  className={styles.relLink}
                >
                  {r.nomor_rekening}
                </Link>
              </td>
              <td>{r.produk_simpanan}</td>
              <td className={styles.saldo}>{formatRupiah(r.saldo)}</td>
              <td>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
