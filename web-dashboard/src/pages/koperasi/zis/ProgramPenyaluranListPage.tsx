// src/pages/koperasi/zis/ProgramPenyaluranListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { programPenyaluranService } from '@/services/koperasi/zis.service'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { ProgramPenyaluran } from '@/types/koperasi/zis.types'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const COLUMNS: ColumnDef<ProgramPenyaluran>[] = [
  { key: 'nama', header: 'Nama Program', sortable: true },
  { key: 'target_dana', header: 'Target Dana', render: (_v, row) => fmt(row.target_dana), sortable: true },
  {
    key: 'terealisasi',
    header: 'Terealisasi',
    render: (_v, row) => {
      const pct = row.target_dana > 0 ? Math.round((row.terealisasi / row.target_dana) * 100) : 0
      return `${fmt(row.terealisasi)} (${pct}%)`
    },
  },
  {
    key: 'status',
    header: 'Status',
    render: (_v, row) => {
      const colorMap: Record<string, string> = {
        aktif: 'var(--color-green-600)',
        selesai: 'var(--color-slate-500)',
        ditunda: 'var(--color-orange-500)',
      }
      return <span style={{ color: colorMap[row.status] ?? 'inherit', textTransform: 'capitalize' }}>{row.status}</span>
    },
  },
]

const FILTER_DEFS: FilterDef[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'aktif', label: 'Aktif' },
      { value: 'selesai', label: 'Selesai' },
      { value: 'ditunda', label: 'Ditunda' },
    ],
  },
]

export function ProgramPenyaluranListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<ProgramPenyaluran>
      title="Program Penyaluran ZIS"
      addLabel="Tambah Program"
      onAdd={() => navigate('/koperasi/zis/program/new')}
      queryKey="koperasi-program-penyaluran"
      fetcher={programPenyaluranService.list}
      columns={COLUMNS}
      filterDefs={FILTER_DEFS}
      searchPlaceholder="Cari nama program..."
      onRowClick={(row) => navigate(`/koperasi/zis/program/${row.id}`)}
      deleteConfig={{
        onDelete: (row) => programPenyaluranService.delete(row.id),
        dialogTitle: 'Hapus Program?',
        dialogBody: (row) => `Program "${row.nama}" akan dihapus permanen.`,
        successMessage: (row) => `Program "${row.nama}" berhasil dihapus.`,
      }}
      exportFilename="program-penyaluran-zis"
    />
  )
}
