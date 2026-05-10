// src/pages/koperasi/zis/PenyaluranZISListPage.tsx

import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { penyaluranZISService } from '@/services/koperasi/zis.service'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { PenyaluranZIS } from '@/types/koperasi/zis.types'

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

const COLUMNS: ColumnDef<PenyaluranZIS>[] = [
  { key: 'program_nama', header: 'Program', sortable: true },
  { key: 'penerima', header: 'Penerima', sortable: true },
  { key: 'nominal', header: 'Nominal', render: (_v, row) => fmt(row.nominal), sortable: true },
  { key: 'tanggal', header: 'Tanggal', render: (_v, row) => new Date(row.tanggal).toLocaleDateString('id-ID'), sortable: true },
]

export function PenyaluranZISListPage() {
  const navigate = useNavigate()

  return (
    <ListPageTemplate<PenyaluranZIS>
      title="Penyaluran ZIS"
      addLabel="Tambah Penyaluran"
      onAdd={() => navigate('/koperasi/zis/penyaluran/new')}
      queryKey="koperasi-penyaluran-zis"
      fetcher={penyaluranZISService.list}
      columns={COLUMNS}
      searchPlaceholder="Cari penerima atau program..."
      onRowClick={(row) => navigate(`/koperasi/zis/penyaluran/${row.id}/edit`)}
      deleteConfig={{
        onDelete: (row) => penyaluranZISService.delete(row.id),
        dialogTitle: 'Hapus Penyaluran ZIS?',
        dialogBody: (row) => `Penyaluran ke "${row.penerima}" sebesar ${fmt(row.nominal)} akan dihapus.`,
        successMessage: () => 'Penyaluran ZIS berhasil dihapus.',
      }}
      defaultSort={{ key: 'tanggal', order: 'desc' }}
      exportFilename="penyaluran-zis"
    />
  )
}
