// src/pages/sekolah/perpustakaan/PengembalianListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { pengembalianService } from '@/services/sekolah/perpustakaan.service'
import type { PengembalianBuku } from '@/types/sekolah/perpustakaan.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const COLUMNS: ColumnDef<PengembalianBuku>[] = [
  { key: 'nomor_peminjaman', label: 'Ref Peminjaman', sortable: true },
  { key: 'anggota_nama', label: 'Anggota', sortable: true },
  { key: 'tanggal_kembali_aktual', label: 'Tanggal Kembali', sortable: true },
  {
    key: 'keterlambatan_hari',
    label: 'Keterlambatan',
    render: (row) => (
      <span style={{ color: row.keterlambatan_hari > 0 ? 'var(--color-danger)' : 'inherit' }}>
        {row.keterlambatan_hari > 0 ? `${row.keterlambatan_hari} hari` : 'Tepat waktu'}
      </span>
    ),
  },
  {
    key: 'denda_total',
    label: 'Denda',
    render: (row) => (
      row.denda_total > 0
        ? <span style={{ color: 'var(--color-danger)' }}>Rp {row.denda_total.toLocaleString('id-ID')}</span>
        : <span>—</span>
    ),
  },
]

export function PengembalianListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<PengembalianBuku>
      title="Pengembalian Buku"
      queryKey="pengembalian-buku"
      fetcher={pengembalianService.list}
      columns={COLUMNS}
      addLabel="Catat Pengembalian"
      onAdd={() => navigate('/sekolah/perpustakaan/pengembalian/new')}
      onRowClick={(row) => navigate(`/sekolah/perpustakaan/pengembalian/${row.id}/edit`)}
      searchPlaceholder="Cari ref peminjaman atau anggota..."
      exportFilename="pengembalian-buku"
      defaultSort={{ key: 'tanggal_kembali_aktual', order: 'desc' }}
    />
  )
}

export default PengembalianListPage
