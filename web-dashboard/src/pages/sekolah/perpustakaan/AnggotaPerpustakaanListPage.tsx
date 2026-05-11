// src/pages/sekolah/perpustakaan/AnggotaPerpustakaanListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { anggotaPerpustakaanService } from '@/services/sekolah/perpustakaan.service'
import type { AnggotaPerpustakaan } from '@/types/sekolah/perpustakaan.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const COLUMNS: ColumnDef<AnggotaPerpustakaan>[] = [
  { key: 'siswa_nama', header: 'Nama Siswa', sortable: true },
  { key: 'nis', header: 'NIS' },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <span style={{ color: row.status === 'Aktif' ? 'var(--color-success)' : 'var(--color-danger)' }}>
        {row.status}
      </span>
    ),
  },
  { key: 'jumlah_buku_dipinjam', header: 'Buku Dipinjam' },
  { key: 'tanggal_daftar', header: 'Tanggal Daftar' },
]

export function AnggotaPerpustakaanListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<AnggotaPerpustakaan>
      title="Anggota Perpustakaan"
      queryKey="anggota-perpustakaan"
      fetcher={anggotaPerpustakaanService.list}
      columns={COLUMNS}
      addLabel="Daftarkan Anggota"
      onAdd={() => navigate('/sekolah/perpustakaan/anggota/new')}
      onRowClick={(row) => navigate(`/sekolah/perpustakaan/anggota/${row.id}/edit`)}
      searchPlaceholder="Cari nama atau NIS..."
      exportFilename="anggota-perpustakaan"
      deleteConfig={{
        onDelete: (row) => anggotaPerpustakaanService.delete(row.id),
        dialogTitle: 'Hapus Anggota?',
        dialogBody: (row) => `Anggota "${row.siswa_nama}" akan dihapus dari perpustakaan.`,
        successMessage: (row) => `Anggota "${row.siswa_nama}" berhasil dihapus.`,
      }}
    />
  )
}

export default AnggotaPerpustakaanListPage
