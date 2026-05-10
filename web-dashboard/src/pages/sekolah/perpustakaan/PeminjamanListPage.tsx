// src/pages/sekolah/perpustakaan/PeminjamanListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { peminjamanService } from '@/services/sekolah/perpustakaan.service'
import type { PeminjamanBuku } from '@/types/sekolah/perpustakaan.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const STATUS_COLOR: Record<string, string> = {
  Aktif: 'var(--color-info)',
  Dikembalikan: 'var(--color-success)',
  Terlambat: 'var(--color-danger)',
}

const COLUMNS: ColumnDef<PeminjamanBuku>[] = [
  { key: 'nomor', label: 'No. Peminjaman', sortable: true },
  { key: 'anggota_nama', label: 'Anggota', sortable: true },
  { key: 'tanggal_pinjam', label: 'Tanggal Pinjam', sortable: true },
  { key: 'jatuh_tempo', label: 'Jatuh Tempo' },
  {
    key: 'status',
    label: 'Status',
    render: (row) => (
      <span style={{ color: STATUS_COLOR[row.status] ?? 'inherit', fontWeight: 600 }}>{row.status}</span>
    ),
  },
]

export function PeminjamanListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<PeminjamanBuku>
      title="Peminjaman Buku"
      queryKey="peminjaman-buku"
      fetcher={peminjamanService.list}
      columns={COLUMNS}
      addLabel="Buat Peminjaman"
      onAdd={() => navigate('/sekolah/perpustakaan/peminjaman/new')}
      onRowClick={(row) => navigate(`/sekolah/perpustakaan/peminjaman/${row.id}`)}
      searchPlaceholder="Cari nomor atau anggota..."
      exportFilename="peminjaman-buku"
      defaultSort={{ key: 'tanggal_pinjam', order: 'desc' }}
    />
  )
}

export default PeminjamanListPage
