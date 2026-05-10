// src/pages/sekolah/akademik/MataPelajaranListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { mataPelajaranService } from '@/services/sekolah/akademik.service'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { MataPelajaran } from '@/types/sekolah/akademik.types'

const COLUMNS: ColumnDef<MataPelajaran>[] = [
  { key: 'nama', label: 'Nama Mata Pelajaran', sortable: true },
  { key: 'kode', label: 'Kode', sortable: true },
  { key: 'kurikulum', label: 'Kurikulum', sortable: true },
]

export default function MataPelajaranListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<MataPelajaran>
      title="Mata Pelajaran"
      addLabel="Tambah Mata Pelajaran"
      onAdd={() => navigate('/sekolah/akademik/mata-pelajaran/new')}
      queryKey="mata-pelajaran"
      fetcher={mataPelajaranService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari mata pelajaran..."
      exportFilename="mata-pelajaran"
      onRowClick={(row) => navigate(`/sekolah/akademik/mata-pelajaran/${row.id}/edit`)}
      deleteConfig={{
        onDelete: (row) => mataPelajaranService.delete(row.id),
        dialogTitle: 'Hapus Mata Pelajaran?',
        dialogBody: (row) => (
          <>Mata pelajaran <strong>{row.nama}</strong> akan dihapus permanen.</>
        ),
        successMessage: (row) => `${row.nama} berhasil dihapus`,
        errorMessage: 'Gagal menghapus mata pelajaran',
      }}
    />
  )
}
