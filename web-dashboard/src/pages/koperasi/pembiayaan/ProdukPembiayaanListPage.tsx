// src/pages/koperasi/pembiayaan/ProdukPembiayaanListPage.tsx
import { useNavigate } from 'react-router-dom'
import { ListPageTemplate } from '@/widgets/ListPageTemplate/ListPageTemplate'
import type { DeleteConfig } from '@/widgets/ListPageTemplate/ListPageTemplate'
import { produkPembiayaanService } from '@/services/koperasi/pembiayaan.service'
import { QK } from '@/services/query-keys'
import type { ColumnDef } from '@/widgets/DataTable/DataTable'
import type { ProdukPembiayaan } from '@/types/koperasi/pembiayaan.types'

const COLUMNS: ColumnDef<ProdukPembiayaan>[] = [
  { key: 'nama', header: 'Nama', sortable: true },
  { key: 'akad', header: 'Akad', sortable: true },
  {
    key: 'margin',
    header: 'Margin %',
    render: (_v, row) => `${row.margin}%`,
  },
  {
    key: 'tenor_max',
    header: 'Tenor Maks',
    render: (_v, row) => `${row.tenor_max} bulan`,
  },
  {
    key: 'status',
    header: 'Status',
    render: (_v, row) => (
      <span style={{ color: row.status === 'Aktif' ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
        {row.status}
      </span>
    ),
  },
]

const DELETE_CONFIG: DeleteConfig<ProdukPembiayaan> = {
  onDelete: (row) => produkPembiayaanService.delete(row.id),
  dialogTitle: 'Hapus Produk Pembiayaan?',
  dialogBody: (row) => `Produk "${row.nama}" akan dihapus permanen.`,
  successMessage: (row) => `Produk "${row.nama}" berhasil dihapus.`,
}

export function ProdukPembiayaanListPage() {
  const navigate = useNavigate()
  return (
    <ListPageTemplate<ProdukPembiayaan>
      title="Produk Pembiayaan"
      addLabel="Tambah Produk"
      onAdd={() => navigate('new')}
      queryKey={QK.produkPembiayaan}
      fetcher={produkPembiayaanService.list}
      columns={COLUMNS}
      onRowClick={(row) => navigate(`${row.id}/edit`)}
      searchPlaceholder="Cari produk pembiayaan..."
      exportFilename="produk-pembiayaan"
      deleteConfig={DELETE_CONFIG}
    />
  )
}
