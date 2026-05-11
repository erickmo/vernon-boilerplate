import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { guruService } from '@/services/sekolah/guru.service'
import type { Guru } from '@/types/sekolah/guru.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const GURU_COLUMNS: ColumnDef<Guru>[] = [
  { key: 'nip', header: 'NIP', sortable: true },
  { key: 'nama', header: 'Nama', sortable: true },
  { key: 'mata_pelajaran', header: 'Mata Pelajaran', sortable: true },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (row) => <span data-status={row.status.toLowerCase()}>{row.status}</span>,
  },
]

export default function GuruListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<Guru>
      title="Daftar Guru"
      queryKey="sekolah-guru"
      fetcher={guruService.list}
      columns={GURU_COLUMNS}
      onRowClick={(row) => navigate(`/sekolah/guru/${row.id}`)}
      onAdd={() => navigate('/sekolah/guru/new')}
      addLabel="Tambah Guru"
      searchPlaceholder="Cari NIP atau nama guru..."
      exportFilename="daftar-guru"
      deleteConfig={{
        onDelete: (row) => guruService.delete(row.id),
        dialogTitle: 'Hapus Guru?',
        dialogBody: (row) => `Data guru "${row.nama}" (NIP: ${row.nip}) akan dihapus permanen.`,
        successMessage: (row) => `Guru "${row.nama}" berhasil dihapus.`,
        errorMessage: 'Gagal menghapus data guru.',
      }}
    />
  )
}
