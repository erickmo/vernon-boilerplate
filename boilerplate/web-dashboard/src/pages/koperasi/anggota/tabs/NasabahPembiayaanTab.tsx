// src/pages/koperasi/anggota/tabs/NasabahPembiayaanTab.tsx
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { nasabahService } from '@/services/koperasi/nasabah.service'
import type { AkadSlim } from '@/types/koperasi/anggota.types'
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

export function NasabahPembiayaanTab({ nasabahId }: Props) {
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['nasabah-summary', nasabahId], // Same key as RekeningTab — request is deduped
    queryFn: () => nasabahService.getNasabahSummary(nasabahId),
    staleTime: 1000 * 60 * 5,
  })

  if (isLoading) {
    return <p className={styles.loadingMsg}>Memuat data pembiayaan...</p>
  }

  if (error) {
    return (
      <p className={styles.errorMsg}>
        Gagal memuat pembiayaan:{' '}
        {error instanceof Error ? error.message : 'Terjadi kesalahan'}
      </p>
    )
  }

  const pembiayaan: AkadSlim[] = summary?.pembiayaan ?? []

  if (pembiayaan.length === 0) {
    return <p className={styles.emptyMsg}>Nasabah ini belum memiliki akad pembiayaan.</p>
  }

  return (
    <div className={styles.tabContent}>
      <table className={styles.relTable}>
        <thead>
          <tr>
            <th>No. Akad</th>
            <th>Produk Pembiayaan</th>
            <th>Pokok</th>
            <th>Sisa Pokok</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {pembiayaan.map((a) => (
            <tr key={a.id}>
              <td>
                <Link
                  to={`/koperasi/pembiayaan/akad/${a.id}`}
                  className={styles.relLink}
                >
                  {a.nomor_akad}
                </Link>
              </td>
              <td>{a.produk_pembiayaan}</td>
              <td className={styles.saldo}>{formatRupiah(a.pokok)}</td>
              <td className={styles.saldo}>{formatRupiah(a.sisa_pokok)}</td>
              <td>{a.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
