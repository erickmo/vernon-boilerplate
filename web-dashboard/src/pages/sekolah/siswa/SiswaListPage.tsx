import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { siswaService } from '@/services/sekolah/siswa.service'
import type { Siswa } from '@/types/sekolah/siswa.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const SISWA_COLUMNS: ColumnDef<Siswa>[] = [
  { key: 'nis', header: 'NIS', sortable: true },
  { key: 'nama_lengkap', header: 'Nama Lengkap', sortable: true },
  { key: 'rombel_aktif', header: 'Rombel Aktif', sortable: true },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (row) => (
      <span data-status={row.status}>
        {row.status}
      </span>
    ),
  },
]

export default function SiswaListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<Siswa>
      title="Daftar Siswa"
      queryKey="sekolah-siswa"
      fetcher={siswaService.list}
      columns={SISWA_COLUMNS}
      onRowClick={(row) => navigate(`/sekolah/siswa/${row.id}`)}
      onAdd={() => navigate('/sekolah/siswa/new')}
      addLabel="Tambah Siswa"
      searchPlaceholder="Cari NIS atau nama siswa..."
      exportFilename="daftar-siswa"
      deleteConfig={{
        onDelete: (row) => siswaService.delete(row.id),
        dialogTitle: 'Hapus Siswa?',
        dialogBody: (row) => `Data siswa "${row.nama_lengkap}" (NIS: ${row.nis}) akan dihapus permanen.`,
        successMessage: (row) => `Siswa "${row.nama_lengkap}" berhasil dihapus.`,
        errorMessage: 'Gagal menghapus data siswa.',
      }}
    />
  )
}
