// src/pages/sekolah/akademik/AbsensiGuruListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { absensiGuruService } from '@/services/sekolah/akademik.service'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { AbsensiGuru } from '@/types/sekolah/akademik.types'

const COLUMNS: ColumnDef<AbsensiGuru>[] = [
  { key: 'tanggal', header: 'Tanggal', sortable: true },
  { key: 'tahun_ajaran', header: 'Tahun Ajaran', sortable: true },
  { key: 'jumlah_guru', header: 'Jumlah Guru', sortable: true },
  { key: 'jumlah_hadir', header: 'Hadir', sortable: true },
  { key: 'keterangan', header: 'Keterangan' },
]

const FILTER_DEFS: FilterDef[] = [
  { key: 'tanggal', label: 'Tanggal', type: 'date' },
  { key: 'tahun_ajaran', label: 'Tahun Ajaran', type: 'text' },
]

export default function AbsensiGuruListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<AbsensiGuru>
      title="Absensi Guru"
      addLabel="Input Absensi Guru"
      onAdd={() => navigate('/sekolah/akademik/absensi-guru/new')}
      queryKey="absensi-guru"
      fetcher={absensiGuruService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari absensi guru..."
      exportFilename="absensi-guru"
      filterDefs={FILTER_DEFS}
      defaultSort={{ key: 'tanggal', order: 'desc' }}
      onRowClick={(row) => navigate(`/sekolah/akademik/absensi-guru/${row.id}/edit`)}
      deleteConfig={{
        onDelete: (row) => absensiGuruService.delete(row.id),
        dialogTitle: 'Hapus Absensi Guru?',
        dialogBody: (row) => (
          <>Absensi guru tanggal <strong>{row.tanggal}</strong> akan dihapus permanen.</>
        ),
        successMessage: (row) => `Absensi guru ${row.tanggal} berhasil dihapus`,
        errorMessage: 'Gagal menghapus absensi guru',
      }}
    />
  )
}
