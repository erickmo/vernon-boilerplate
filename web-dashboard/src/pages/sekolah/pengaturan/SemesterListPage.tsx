// src/pages/sekolah/pengaturan/SemesterListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { semesterService } from '@/services/sekolah/pengaturan.service'
import type { SemesterTahunAjaran } from '@/types/sekolah/pengaturan.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const COLUMNS: ColumnDef<SemesterTahunAjaran>[] = [
  { key: 'semester', header: 'Semester' },
  { key: 'tahun_ajaran_periode', header: 'Tahun Ajaran', sortable: true },
  {
    key: 'status_aktif',
    header: 'Status',
    render: (row) => (
      <span style={{ color: row.status_aktif ? 'var(--color-success)' : 'var(--color-text-secondary)', fontWeight: row.status_aktif ? 700 : 400 }}>
        {row.status_aktif ? 'Aktif' : 'Tidak Aktif'}
      </span>
    ),
  },
]

export function SemesterListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<SemesterTahunAjaran>
      title="Semester"
      queryKey="semester-tahun-ajaran"
      fetcher={semesterService.list}
      columns={COLUMNS}
      addLabel="Tambah Semester"
      onAdd={() => navigate('/sekolah/pengaturan/semester/new')}
      onRowClick={(row) => navigate(`/sekolah/pengaturan/semester/${row.id}/edit`)}
      deleteConfig={{
        onDelete: (row) => semesterService.delete(row.id),
        dialogTitle: 'Hapus Semester?',
        dialogBody: (row) => `Semester ${row.semester} ${row.tahun_ajaran_periode} akan dihapus.`,
        successMessage: (row) => `Semester ${row.semester} ${row.tahun_ajaran_periode} berhasil dihapus.`,
      }}
    />
  )
}

export default SemesterListPage
