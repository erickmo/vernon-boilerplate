// src/pages/sekolah/perpustakaan/PeminjamanDetailPage.tsx

import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { peminjamanService } from '@/services/sekolah/perpustakaan.service'
import type { PeminjamanBuku, ItemPeminjaman } from '@/types/sekolah/perpustakaan.types'
import styles from './BukuDetailPage.module.css'

function InfoPeminjamanTab({ peminjaman }: { peminjaman: PeminjamanBuku }) {
  return (
    <div className={styles.infoGrid}>
      <div className={styles.field}><span className={styles.label}>No. Peminjaman</span><span className={styles.value}>{peminjaman.nomor}</span></div>
      <div className={styles.field}><span className={styles.label}>Anggota</span><span className={styles.value}>{peminjaman.anggota_nama}</span></div>
      <div className={styles.field}><span className={styles.label}>NIS</span><span className={styles.value}>{peminjaman.nis}</span></div>
      <div className={styles.field}><span className={styles.label}>Status</span><span className={styles.value}>{peminjaman.status}</span></div>
      <div className={styles.field}><span className={styles.label}>Tanggal Pinjam</span><span className={styles.value}>{peminjaman.tanggal_pinjam}</span></div>
      <div className={styles.field}><span className={styles.label}>Jatuh Tempo</span><span className={styles.value}>{peminjaman.jatuh_tempo}</span></div>
      {peminjaman.tanggal_kembali && (
        <div className={styles.field}><span className={styles.label}>Tanggal Kembali</span><span className={styles.value}>{peminjaman.tanggal_kembali}</span></div>
      )}
    </div>
  )
}

function ItemBukuTab({ items }: { items: ItemPeminjaman[] }) {
  return (
    <div className={styles.eksemplarSection}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Kode Eksemplar</th>
            <th>Judul Buku</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={2} className={styles.emptyCell}>Tidak ada item</td></tr>
          ) : (
            items.map((item: ItemPeminjaman) => (
              <tr key={item.id}>
                <td>{item.kode_eksemplar}</td>
                <td>{item.judul_buku}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export function PeminjamanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: peminjaman, isLoading, error } = useQuery({
    queryKey: ['peminjaman-buku', id],
    queryFn: () => peminjamanService.getById(id!),
    enabled: !!id,
  })

  if (isLoading) return <p>Memuat data peminjaman...</p>
  if (error || !peminjaman) return <p>Peminjaman tidak ditemukan.</p>

  return (
    <DetailPageTemplate
      title={peminjaman.nomor}
      code={peminjaman.anggota_nama}
      onBack={() => navigate('/sekolah/perpustakaan/peminjaman')}
      backLabel="Peminjaman Buku"
      tabs={[
        { id: 'info', label: 'Info Peminjaman', content: <InfoPeminjamanTab peminjaman={peminjaman} /> },
        { id: 'items', label: 'Item Buku', content: <ItemBukuTab items={peminjaman.items} /> },
      ]}
      actions={[
        {
          label: 'Edit',
          onClick: () => navigate(`/sekolah/perpustakaan/peminjaman/${id}/edit`),
          variant: 'primary',
        },
      ]}
    />
  )
}

export default PeminjamanDetailPage
