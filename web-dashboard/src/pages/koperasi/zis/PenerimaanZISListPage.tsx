// src/pages/koperasi/zis/PenerimaanZISListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { penerimaanZISService } from '@/services/koperasi/zis.service'
import type { ColumnDef, FilterDef } from '@/widgets/DataTable/DataTable'
import type { PenerimaanZIS } from '@/types/koperasi/zis.types'

const COLUMNS: ColumnDef<PenerimaanZIS>[] = [
  {
    key: 'tanggal',
    header: 'Tanggal',
    render: (_v, row) => new Date(row.tanggal).toLocaleDateString('id-ID'),
    sortable: true,
  },
  { key: 'donatur', header: 'Donatur', sortable: true },
  { key: 'jenis_dana', header: 'Jenis Dana', sortable: true },
  {
    key: 'nominal',
    header: 'Nominal',
    render: (_v, row) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(row.nominal),
    sortable: true,
  },
  {
    key: 'status',
    header: 'Status',
    render: (_v, row) => {
      const colorMap: Record<string, string> = {
        draft: 'var(--color-slate-500)',
        dikonfirmasi: 'var(--color-green-600)',
        dibatalkan: 'var(--color-red-500)',
      }
      return <span style={{ color: colorMap[row.status] ?? 'inherit', textTransform: 'capitalize' }}>{row.status}</span>
    },
  },
]

const FILTER_DEFS: FilterDef[] = [
  {
    key: 'jenis_dana',
    label: 'Jenis Dana',
    type: 'select',
    options: [
      { value: 'Zakat', label: 'Zakat' },
      { value: 'Infaq', label: 'Infaq' },
      { value: 'Shadaqah', label: 'Shadaqah' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'dikonfirmasi', label: 'Dikonfirmasi' },
      { value: 'dibatalkan', label: 'Dibatalkan' },
    ],
  },
]

export function PenerimaanZISListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<PenerimaanZIS>
      title="Penerimaan ZIS"
      addLabel="Tambah Penerimaan"
      onAdd={() => navigate('/koperasi/zis/penerimaan/new')}
      queryKey="koperasi-penerimaan-zis"
      fetcher={penerimaanZISService.list}
      columns={COLUMNS}
      filterDefs={FILTER_DEFS}
      searchPlaceholder="Cari donatur..."
      onRowClick={(row) => navigate(`/koperasi/zis/penerimaan/${row.id}`)}
      deleteConfig={{
        onDelete: (row) => penerimaanZISService.delete(row.id),
        dialogTitle: 'Hapus Penerimaan ZIS?',
        dialogBody: (row) => `Penerimaan dari "${row.donatur}" sebesar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(row.nominal)} akan dihapus.`,
        successMessage: () => 'Penerimaan ZIS berhasil dihapus.',
      }}
      defaultSort={{ key: 'tanggal', order: 'desc' }}
      exportFilename="penerimaan-zis"
    />
  )
}
