// src/pages/sekolah/akademik/RaportListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { raportService } from '@/services/sekolah/akademik.service'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { Raport } from '@/types/sekolah/akademik.types'

const STATUS_LABEL: Record<string, string> = {
  Draft: 'Draft',
  Final: 'Final',
  Diterbitkan: 'Diterbitkan',
}

const COLUMNS: ColumnDef<Raport>[] = [
  { key: 'siswa_nama', header: 'Nama Siswa', sortable: true },
  { key: 'nis', header: 'NIS', sortable: true },
  { key: 'rombel_nama', header: 'Rombongan Belajar', sortable: true },
  { key: 'semester', header: 'Semester', sortable: true },
  { key: 'tahun_ajaran', header: 'Tahun Ajaran', sortable: true },
  { key: 'rata_rata', header: 'Rata-rata', sortable: true },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (row) => STATUS_LABEL[row.status] ?? row.status,
  },
]

const FILTER_DEFS: FilterDef[] = [
  { key: 'rombel', label: 'Rombongan Belajar', type: 'text' },
  { key: 'semester', label: 'Semester', type: 'select', options: [
    { value: 'Ganjil', label: 'Ganjil' },
    { value: 'Genap', label: 'Genap' },
  ]},
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: 'Draft', label: 'Draft' },
    { value: 'Final', label: 'Final' },
    { value: 'Diterbitkan', label: 'Diterbitkan' },
  ]},
]

export default function RaportListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<Raport>
      title="Raport"
      queryKey="raport"
      fetcher={raportService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari raport siswa..."
      exportFilename="raport"
      filterDefs={FILTER_DEFS}
      defaultSort={{ key: 'siswa_nama', order: 'asc' }}
      onRowClick={(row) => navigate(`/sekolah/akademik/raport/${row.id}`)}
    />
  )
}
