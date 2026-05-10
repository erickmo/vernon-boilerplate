// src/pages/sekolah/akademik/AbsensiSiswaListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { absensiSiswaService } from '@/services/sekolah/akademik.service'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { AbsensiHarian } from '@/types/sekolah/akademik.types'

const COLUMNS: ColumnDef<AbsensiHarian>[] = [
  { key: 'tanggal', label: 'Tanggal', sortable: true },
  { key: 'rombel_nama', label: 'Rombongan Belajar', sortable: true },
  { key: 'tahun_ajaran', label: 'Tahun Ajaran', sortable: true },
  { key: 'semester', label: 'Semester', sortable: true },
  { key: 'jumlah_hadir', label: 'Hadir', sortable: true },
  { key: 'jumlah_sakit', label: 'Sakit', sortable: true },
  { key: 'jumlah_izin', label: 'Izin', sortable: true },
  { key: 'jumlah_alpha', label: 'Alpha', sortable: true },
]

const FILTER_DEFS: FilterDef[] = [
  { key: 'rombel', label: 'Rombongan Belajar', type: 'text' },
  { key: 'tanggal', label: 'Tanggal', type: 'date' },
  { key: 'semester', label: 'Semester', type: 'select', options: [
    { value: 'Ganjil', label: 'Ganjil' },
    { value: 'Genap', label: 'Genap' },
  ]},
]

export default function AbsensiSiswaListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<AbsensiHarian>
      title="Absensi Siswa"
      addLabel="Input Absensi"
      onAdd={() => navigate('/sekolah/akademik/absensi-siswa/new')}
      queryKey="absensi-siswa"
      fetcher={absensiSiswaService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari absensi..."
      exportFilename="absensi-siswa"
      filterDefs={FILTER_DEFS}
      defaultSort={{ key: 'tanggal', order: 'desc' }}
      onRowClick={(row) => navigate(`/sekolah/akademik/absensi-siswa/${row.id}/edit`)}
      deleteConfig={{
        onDelete: (row) => absensiSiswaService.delete(row.id),
        dialogTitle: 'Hapus Absensi?',
        dialogBody: (row) => (
          <>Absensi tanggal <strong>{row.tanggal}</strong> rombel <strong>{row.rombel_nama}</strong> akan dihapus.</>
        ),
        successMessage: (row) => `Absensi ${row.tanggal} berhasil dihapus`,
        errorMessage: 'Gagal menghapus absensi',
      }}
    />
  )
}
