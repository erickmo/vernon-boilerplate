// src/pages/sekolah/akademik/PenilaianListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { penilaianService } from '@/services/sekolah/akademik.service'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { EntriNilai } from '@/types/sekolah/akademik.types'

const COLUMNS: ColumnDef<EntriNilai>[] = [
  { key: 'mata_pelajaran_nama', header: 'Mata Pelajaran', sortable: true },
  { key: 'rombel_nama', header: 'Rombongan Belajar', sortable: true },
  { key: 'komponen', header: 'Komponen', sortable: true },
  { key: 'semester', header: 'Semester', sortable: true },
  { key: 'tahun_ajaran', header: 'Tahun Ajaran', sortable: true },
  { key: 'guru_nama', header: 'Guru', sortable: true },
  { key: 'jumlah_siswa', header: 'Jumlah Siswa', sortable: true },
]

const FILTER_DEFS: FilterDef[] = [
  { key: 'mata_pelajaran', label: 'Mata Pelajaran', type: 'text' },
  { key: 'rombel', label: 'Rombongan Belajar', type: 'text' },
  { key: 'semester', label: 'Semester', type: 'select', options: [
    { value: 'Ganjil', label: 'Ganjil' },
    { value: 'Genap', label: 'Genap' },
  ]},
]

export default function PenilaianListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<EntriNilai>
      title="Penilaian (Entri Nilai)"
      addLabel="Entri Nilai Baru"
      onAdd={() => navigate('/sekolah/akademik/penilaian/new')}
      queryKey="entri-nilai"
      fetcher={penilaianService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari entri nilai..."
      exportFilename="entri-nilai"
      filterDefs={FILTER_DEFS}
      onRowClick={(row) => navigate(`/sekolah/akademik/penilaian/${row.id}/edit`)}
      deleteConfig={{
        onDelete: (row) => penilaianService.delete(row.id),
        dialogTitle: 'Hapus Entri Nilai?',
        dialogBody: (row) => (
          <>Entri nilai <strong>{row.mata_pelajaran_nama}</strong> — <strong>{row.komponen}</strong> akan dihapus.</>
        ),
        successMessage: (row) => `Entri nilai ${row.komponen} berhasil dihapus`,
        errorMessage: 'Gagal menghapus entri nilai',
      }}
    />
  )
}
