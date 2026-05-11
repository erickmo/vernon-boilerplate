// src/pages/sekolah/perpustakaan/BukuListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { bukuService } from '@/services/sekolah/perpustakaan.service'
import type { Buku } from '@/types/sekolah/perpustakaan.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const BUKU_COLUMNS: ColumnDef<Buku>[] = [
  { key: 'judul', header: 'Judul', sortable: true },
  { key: 'penulis', header: 'Penulis', sortable: true },
  { key: 'isbn', header: 'ISBN' },
  { key: 'kategori_nama', header: 'Kategori' },
  {
    key: 'stok_tersedia',
    header: 'Stok Tersedia',
    render: (row) => (
      <span style={{ color: row.stok_tersedia === 0 ? 'var(--color-danger)' : 'inherit' }}>
        {row.stok_tersedia} / {row.stok_total}
      </span>
    ),
  },
]

export default function BukuListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<Buku>
      title="Katalog Buku"
      queryKey="perpustakaan-buku"
      fetcher={bukuService.list}
      columns={BUKU_COLUMNS}
      addLabel="Tambah Buku"
      onAdd={() => navigate('/sekolah/perpustakaan/buku/new')}
      onRowClick={(row) => navigate(`/sekolah/perpustakaan/buku/${row.id}`)}
      searchPlaceholder="Cari judul, penulis, atau ISBN..."
      exportFilename="katalog-buku"
      deleteConfig={{
        onDelete: (row) => bukuService.delete(row.id),
        dialogTitle: 'Hapus Buku?',
        dialogBody: (row) => `Buku "${row.judul}" akan dihapus secara permanen.`,
        successMessage: (row) => `Buku "${row.judul}" berhasil dihapus.`,
      }}
    />
  )
}
