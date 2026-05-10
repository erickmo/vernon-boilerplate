// src/pages/sekolah/perpustakaan/BukuDetailPage.tsx

import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Edit, Trash2 } from 'lucide-react'
import { DetailPageTemplate } from '@/widgets/DetailPageTemplate/DetailPageTemplate'
import { bukuService, getEksemplarByBuku, getPeminjamanHistoryByBuku } from '@/services/sekolah/perpustakaan.service'
import type { Buku, EksemplarBuku, PeminjamanBuku } from '@/types/sekolah/perpustakaan.types'
import styles from './BukuDetailPage.module.css'

// ─── Tab: Info Buku ──────────────────────────────────────────────────────────

function InfoBukuTab({ buku }: { buku: Buku }) {
  return (
    <div className={styles.infoGrid}>
      <div className={styles.field}><span className={styles.label}>Judul</span><span className={styles.value}>{buku.judul}</span></div>
      <div className={styles.field}><span className={styles.label}>Penulis</span><span className={styles.value}>{buku.penulis}</span></div>
      <div className={styles.field}><span className={styles.label}>ISBN</span><span className={styles.value}>{buku.isbn}</span></div>
      <div className={styles.field}><span className={styles.label}>Penerbit</span><span className={styles.value}>{buku.penerbit}</span></div>
      <div className={styles.field}><span className={styles.label}>Tahun Terbit</span><span className={styles.value}>{buku.tahun_terbit}</span></div>
      <div className={styles.field}><span className={styles.label}>Kategori</span><span className={styles.value}>{buku.kategori_nama ?? buku.kategori}</span></div>
      <div className={styles.field}><span className={styles.label}>Stok Total</span><span className={styles.value}>{buku.stok_total}</span></div>
      <div className={styles.field}><span className={styles.label}>Stok Tersedia</span><span className={styles.value}>{buku.stok_tersedia}</span></div>
      {buku.deskripsi && (
        <div className={`${styles.field} ${styles.fullWidth}`}>
          <span className={styles.label}>Deskripsi</span>
          <span className={styles.value}>{buku.deskripsi}</span>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Eksemplar & Riwayat ────────────────────────────────────────────────

function EksemplarRiwayatTab({ bukuId }: { bukuId: string }) {
  const { data: eksemplarList = [], isLoading: loadingEksemplar } = useQuery({
    queryKey: ['eksemplar-by-buku', bukuId],
    queryFn: () => getEksemplarByBuku(bukuId),
  })

  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['peminjaman-history-buku', bukuId],
    queryFn: () => getPeminjamanHistoryByBuku(bukuId),
  })

  const STATUS_COLOR: Record<string, string> = {
    Tersedia: 'var(--color-success)',
    Dipinjam: 'var(--color-warning)',
    Dipesan: 'var(--color-info)',
    Rusak: 'var(--color-danger)',
    Hilang: 'var(--color-danger)',
  }

  return (
    <div className={styles.eksemplarSection}>
      <h3 className={styles.sectionTitle}>Eksemplar Buku</h3>
      {loadingEksemplar ? (
        <p className={styles.loadingText}>Memuat data eksemplar...</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Kode Eksemplar</th>
              <th>Kondisi</th>
              <th>Status</th>
              <th>Lokasi Rak</th>
            </tr>
          </thead>
          <tbody>
            {eksemplarList.length === 0 ? (
              <tr><td colSpan={4} className={styles.emptyCell}>Belum ada eksemplar</td></tr>
            ) : (
              eksemplarList.map((eks: EksemplarBuku) => (
                <tr key={eks.id}>
                  <td>{eks.kode_eksemplar}</td>
                  <td>{eks.kondisi}</td>
                  <td>
                    <span style={{ color: STATUS_COLOR[eks.status] ?? 'inherit' }}>{eks.status}</span>
                  </td>
                  <td>{eks.lokasi_rak ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <h3 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>Riwayat Peminjaman</h3>
      {loadingHistory ? (
        <p className={styles.loadingText}>Memuat riwayat...</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>No. Peminjaman</th>
              <th>Anggota</th>
              <th>Tanggal Pinjam</th>
              <th>Jatuh Tempo</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr><td colSpan={5} className={styles.emptyCell}>Belum ada riwayat peminjaman</td></tr>
            ) : (
              history.map((p: PeminjamanBuku) => (
                <tr key={p.id}>
                  <td>{p.nomor}</td>
                  <td>{p.anggota_nama}</td>
                  <td>{p.tanggal_pinjam}</td>
                  <td>{p.jatuh_tempo}</td>
                  <td>{p.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export function BukuDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: buku, isLoading, error } = useQuery({
    queryKey: ['buku', id],
    queryFn: () => bukuService.getById(id!),
    enabled: !!id,
  })

  if (isLoading) return <p>Memuat data buku...</p>
  if (error || !buku) return <p>Buku tidak ditemukan.</p>

  return (
    <DetailPageTemplate
      title={buku.judul}
      code={buku.isbn}
      onBack={() => navigate('/sekolah/perpustakaan/buku')}
      backLabel="Katalog Buku"
      tabs={[
        { id: 'info', label: 'Info Buku', content: <InfoBukuTab buku={buku} /> },
        { id: 'eksemplar', label: 'Eksemplar & Riwayat', content: <EksemplarRiwayatTab bukuId={buku.id} /> },
      ]}
      actions={[
        {
          label: 'Edit',
          icon: <Edit size={14} />,
          onClick: () => navigate(`/sekolah/perpustakaan/buku/${id}/edit`),
          variant: 'primary',
        },
        {
          label: 'Hapus',
          icon: <Trash2 size={14} />,
          onClick: async () => {
            if (window.confirm(`Hapus buku "${buku.judul}"?`)) {
              await bukuService.delete(buku.id)
              navigate('/sekolah/perpustakaan/buku')
            }
          },
          variant: 'danger',
        },
      ]}
    />
  )
}

export default BukuDetailPage
