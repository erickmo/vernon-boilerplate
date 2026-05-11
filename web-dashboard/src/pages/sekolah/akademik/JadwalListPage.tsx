// src/pages/sekolah/akademik/JadwalListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { jadwalService } from '@/services/sekolah/akademik.service'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { JadwalPelajaran } from '@/types/sekolah/akademik.types'

const COLUMNS: ColumnDef<JadwalPelajaran>[] = [
  { key: 'rombel_nama', header: 'Rombongan Belajar', sortable: true },
  { key: 'tahun_ajaran', header: 'Tahun Ajaran', sortable: true },
  { key: 'semester', header: 'Semester', sortable: true },
  { key: 'jumlah_slot', header: 'Jumlah Slot', sortable: true },
]

export default function JadwalListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<JadwalPelajaran>
      title="Jadwal Pelajaran"
      addLabel="Tambah Jadwal"
      onAdd={() => navigate('/sekolah/akademik/jadwal/new')}
      queryKey="jadwal-pelajaran"
      fetcher={jadwalService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari jadwal..."
      exportFilename="jadwal-pelajaran"
      onRowClick={(row) => navigate(`/sekolah/akademik/jadwal/${row.id}`)}
      deleteConfig={{
        onDelete: (row) => jadwalService.delete(row.id),
        dialogTitle: 'Hapus Jadwal Pelajaran?',
        dialogBody: (row) => (
          <>Jadwal untuk rombel <strong>{row.rombel_nama}</strong> akan dihapus permanen.</>
        ),
        successMessage: (row) => `Jadwal ${row.rombel_nama} berhasil dihapus`,
        errorMessage: 'Gagal menghapus jadwal',
      }}
    />
  )
}
