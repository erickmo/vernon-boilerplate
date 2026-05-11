// src/pages/sekolah/pengaturan/TahunAjaranListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { tahunAjaranService } from '@/services/sekolah/pengaturan.service'
import type { TahunAjaran } from '@/types/sekolah/pengaturan.types'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'

const COLUMNS: ColumnDef<TahunAjaran>[] = [
  { key: 'periode', header: 'Periode', sortable: true },
  {
    key: 'status_aktif',
    header: 'Status',
    render: (row) => (
      <span style={{
        color: row.status_aktif ? 'var(--color-success)' : 'var(--color-text-secondary)',
        fontWeight: row.status_aktif ? 700 : 400,
      }}>
        {row.status_aktif ? 'Aktif' : 'Tidak Aktif'}
      </span>
    ),
  },
]

export function TahunAjaranListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<TahunAjaran>
      title="Tahun Ajaran"
      queryKey="tahun-ajaran"
      fetcher={tahunAjaranService.list}
      columns={COLUMNS}
      addLabel="Tambah Tahun Ajaran"
      onAdd={() => navigate('/sekolah/pengaturan/tahun-ajaran/new')}
      onRowClick={(row) => navigate(`/sekolah/pengaturan/tahun-ajaran/${row.id}/edit`)}
      searchPlaceholder="Cari periode..."
      deleteConfig={{
        onDelete: (row) => tahunAjaranService.delete(row.id),
        dialogTitle: 'Hapus Tahun Ajaran?',
        dialogBody: (row) => `Tahun ajaran "${row.periode}" akan dihapus. Pastikan tidak ada data terkait.`,
        successMessage: (row) => `Tahun ajaran "${row.periode}" berhasil dihapus.`,
      }}
    />
  )
}

export default TahunAjaranListPage
