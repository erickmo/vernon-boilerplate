// src/pages/koperasi/anggota/NasabahListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { nasabahService } from '@/services/koperasi/nasabah.service'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { Nasabah } from '@/types/koperasi/anggota.types'

const COLUMNS: ColumnDef<Nasabah>[] = [
  { key: 'id', header: 'No. Nasabah', sortable: true },
  { key: 'nama', header: 'Nama', sortable: true },
  { key: 'nik', header: 'NIK', sortable: false },
  { key: 'no_hp', header: 'No. HP', sortable: false },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (_value, row) => (
      <span
        style={{
          display: 'inline-block',
          padding: '0.2rem 0.6rem',
          borderRadius: '999px',
          fontSize: '0.8125rem',
          fontWeight: 600,
          background:
            row.status === 'Aktif'
              ? 'var(--color-success-light, #d1fae5)'
              : 'var(--color-neutral-light, #f3f4f6)',
          color:
            row.status === 'Aktif'
              ? 'var(--color-success, #065f46)'
              : 'var(--color-text-muted, #6b7280)',
        }}
      >
        {row.status}
      </span>
    ),
  },
]

const FILTER_DEFS: FilterDef[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Aktif', value: 'Aktif' },
      { label: 'Non-Aktif', value: 'Non-Aktif' },
    ],
  },
]

const DELETE_CONFIG = {
  onDelete: (row: Nasabah) => nasabahService.delete(row.id),
  dialogTitle: 'Hapus Nasabah?',
  dialogBody: (row: Nasabah) =>
    `Nasabah "${row.nama}" (NIK: ${row.nik}) akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`,
  successMessage: (row: Nasabah) => `Nasabah ${row.nama} berhasil dihapus.`,
  errorMessage: 'Gagal menghapus nasabah. Pastikan tidak ada data terkait.',
}

export default function NasabahListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<Nasabah>
      title="Daftar Nasabah"
      queryKey="nasabah"
      fetcher={nasabahService.list}
      columns={COLUMNS}
      filterDefs={FILTER_DEFS}
      searchPlaceholder="Cari nama atau NIK..."
      addLabel="Tambah Nasabah"
      onAdd={() => navigate('/koperasi/anggota/nasabah/new')}
      onRowClick={(row) => navigate(`/koperasi/anggota/nasabah/${row.id}`)}
      deleteConfig={DELETE_CONFIG}
      exportFilename="nasabah"
      emptyTitle="Belum ada nasabah"
      emptyDescription="Tambah nasabah pertama untuk memulai."
    />
  )
}
